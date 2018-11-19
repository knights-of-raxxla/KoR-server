const rounds = 10; // salt rounds yarrrrr
module.exports = class UserManager {
    constructor(knex, bcrypt) {
        this.knex = knex;
        this.bcrypt = bcrypt;
    }

    /**
     * @public
     * Creates a brand new user
     * @param {Object} params bag
     * @param {String} params.password clear password
     * @param {String} params.email email
     * @param {String} params.name cmd name
     * @param {String[]} params.groups user groups
     * @param {String[]} params.permissions single permissions
     *
     * @return {Promise<Integer, Error>} Pk or some knex error
     */
    createUser(params = {}) {
        return new Promise((resolve, reject) => {
            let clear_password = params.password;
            let {email, name, groups, permissions} = params;

            if (!this._validateEmail(email)) return reject(`UserManager:01:bad email`);

            if (groups && Array.isArray(groups)) groups = JSON.stringify(groups);
            else groups = null;

            if (permissions && Array.isArray(permissions)) permissions = JSON.stringify(permissions);
            else permissions = null;

            return this._hashPassword(clear_password).then(hashed => {
                return this._insertUser({
                    password: hashed,
                    name,
                    email,
                    groups,
                    permissions
                });
            }).then(([id]) => {
                return resolve(id);
            }).catch(err => reject(err));
        })
    }

    /**
     * @public
     * Archives a user
     * @param {Integer} id user pk
     * @return {Promise<Integer>} 1 if ok
     */
    archiveUser(id) {
        return this.knex('users')
            .where({id})
            .update({archive: 1});
    }

    updateUser(params = {}) {
        let {id, name, password, groups, permissions} = params;
        return this.knex('users')
            .where({id})
            .update({name, password, groups, permissions});
    }

    /**
     * @public
     * Checks if user can login with combo email + clear password
     * @param {Integer} user_id id de l'utilisateur
     * @param {String} clear_password
     *
     * @return {Promise<Boolean, Error>} true if can
     */
    userCanLogin(email, clear_password) {
        return new Promise((resolve, reject) => {
            let hashed_password;
            this.knex('users')
            .where({email})
            .first()
            .then(user => {
                if (!user) return reject('UserManager:02:cant find user with id ' + user_id);
                hashed_password = user.password;
                return this._passwordMatch(clear_password, hashed_password);
            }).then(match => {
                return resolve(match);
            }).catch(err => reject(err));
        });
    }

    /**
     * Matches a plain and hashed password
     * @param {string} plain le password en clair
     * @param {string} hash le password hashé
     * @return {Promise} avec {bool} ou erreur en param
     */
    _passwordMatch(plain, hash) {
        return new Promise((resolve, reject) => {
            this.bcrypt.compare(plain, hash, (err, res) => {
                if (err) {
                    return reject(err);
                }
                return resolve(res);
            });
        });
    }

    /**
     * @private
     * Inserts a user in db
     * @param {Object} params ...
     * @param {String} params.password
     * @param {String} params.name
     * @param {String} params.email
     * @param {String} params.groups
     * @param {String} params.permissions
     *
     * @return {Promise<Integer[], Error>} [pk]
     */
    _insertUser({password, name, email, groups, permissions}) {
        return this.knex('users')
        .insert({
            password,
            name,
            email,
            created_at: new Date(),
            groups,
            permissions
        });
    }

    /**
     * @private
     * Generates bcrypt's salt to hash password
     * @return {Promise<String, Error>} salt
     */
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

    /**
     * @private
     * Transforms a plain password into a hashed password
     * @param {String} plain (clear password)
     * @return {Promise<String, Error>} hashed password
     */
    _hashPassword(plain) {
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

    /**
     * @private
     * @param {String} email
     * @return {Boolean} true if email is valid
     */
    _validateEmail(email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }
}
