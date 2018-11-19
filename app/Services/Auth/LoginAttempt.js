'use strict';

/** @module Services/Auth */

/**
 * @class
 * @description Classe qui représente une tentative de login
 * @memberof module:Services/Auth
 */
class LoginAttempt {

    /**
     * @constructor
     * @param {object} data doit avoir 2 attr : email et password
     */
    constructor(PasswordManager, EmailModel, EventBusFactory) {
        this.PasswordManager = PasswordManager;
        this.EmailModel = EmailModel;
        this.AuthEvents = EventBusFactory.get("auth");
    }

    attempt(data, socket) {
        return this._authenticate(data, socket);
    }

    /**
     * @param {Object} data &.email et &.password
     * Chaine unique pour authenticate
     * @param {Object} socket socket
     * @return {Promise} Promise
     */
    _authenticate(data, socket) {
        let input_email = data.email;
        let input_pwd   = data.password;
        let that        = this;
        let utilisateur;

        return new Promise((resolve, reject) => {
            that._emailMatchesRegisteredUser(input_email).then(user => {
                utilisateur = user;
                if (!user) {
                    return resolve(false);
                }
                return this.PasswordManager.matchPasswords(input_pwd, user.node_password);
            }).then(match => {
                if (!match) {
                    return resolve(false);
                }
                try {
                    this.AuthEvents.emit("un utilisateur est connecté", socket);
                } catch (e) {
                    return reject(e);
                }
                return resolve(utilisateur);
            }).catch(err => {
                return reject(err);
            });
        });
    }

    /**
     * Check si un email est associé à un utilisateur dans la bdd
     * @param {string} email email
     * @return {Promise} avec l'objet utilisateur de la bdd
     */
    _emailMatchesRegisteredUser(email) {
        return new Promise((resolve, reject) => {
            this.EmailModel.where('email', email)
                .fetch({
                    withRelated: ['personne', 'personne.utilisateur']
                })
            .then(data => {
                let utilisateur = false;
                try {
                    let rel     = data.toJSON();
                    utilisateur = rel.personne[0].utilisateur;
                    resolve(utilisateur);
                } catch (e) {
                    resolve(utilisateur);
                }
            });
        });
    }
}

module.exports = LoginAttempt;
