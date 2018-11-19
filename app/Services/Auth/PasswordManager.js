"use strict";

/**
 * @typedef {number} SaltRounds
 */
const rounds = 10;

/**
 * @class PasswordManager
 * @memberof module:Services/Auth
 */
class PasswordManager {
    /**
     * @constructor
     * @param {bcrypt} bcrypt nodejs
     * @param {knex} knex initialisé
     * @param {DateHelper} DateHelper helper de dates
     */
    constructor(bcrypt, knex, DateHelper) {
        this.bcrypt = bcrypt;
        this.knex = knex;
        this.DateHelper = DateHelper;
    }

    /**
     * Check si le password récupéré match le password en clair
     * rentré dans les inputs de la page
     * @param {string} plain le password en clair
     * @param {string} hash le password hashé
     * @return {Promise} avec {bool} ou erreur en param
     */
    matchPasswords(plain, hash) {
        return new Promise((resolve, reject) => {
            this.bcrypt.compare(plain, hash, (err, res) => {
                if (err) {
                    return reject(err);
                }
                return resolve(res);
            });
        });
    }

    _genSalt() {
        return new Promise((resolve, reject) => {
            this.bcrypt.genSalt(rounds, (err, res) => {
                if (err) {
                    return reject(err);
                }
                resolve(res);
            });
        });
    }

    makePassword(plain) {
        return new Promise((resolve, reject) => {
            this._genSalt().then(salt => {
                this.bcrypt.hash(plain, salt, function(err, res) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(res);
                });
            });
        });
    }

    updateUserPassword(clearPassword, userId) {
        return this.makePassword(clearPassword)
        .then(hashed => {
            return this.knex("utilisateur")
            .where("utilisateur_id", userId)
            .update({
                password: hashed,
                updated_at: this.DateHelper.dbNow()
            });
        });
    }
}

module.exports = PasswordManager;
