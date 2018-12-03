const rounds = 10; // salt rounds yarrrrr
const env = require('../../../env.js');
module.exports = class UserManager {
    constructor(knex, bcrypt, uuid) {
        this.knex = knex;
        this.bcrypt = bcrypt;
        this.uuid = uuid;
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
            let {email, name, groups, permissions, platform} = params;

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
                    permissions,
                    platform
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
        let cmds = [];
        if (password && typeof password === 'string'  && password.length)
            cmds.push(this._hashPassword(password))

        return Promise.all(cmds)
        .then(hashed_password => {
            if (hashed_password) password = hashed_password;

            return this.knex('users')
            .where({id})
            .update({name, password, groups, permissions});
        });
    }

    getUser(id) {
        return this.knex('users')
            .where({id})
            .select([
                'id',
                'name',
                'email',
                'permissions',
                'groups',
                'archive',
                'created_at'
            ]).first();
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
                if (!user) return reject('UserManager:02:cant find user with email ' + email);
                hashed_password = user.password;
                return this._passwordMatch(clear_password, hashed_password);
            }).then(match => {
                return resolve(match);
            }).catch(err => reject(err));
        });
    }

    /**
     * @public
     * Start password reset process
     * by generating a uuid and sending recovery email
     *
     * @param {String} email the user email
     * @return {Promise<Object, Error>} see below
     */
    startPasswordReset(email) {
        return new Promise((resolve, reject) => {
            let reset_key = this.uuid.v4();
            let user;

            return this.knex('users')
            .where({email})
            .first()
            .then(_user => {
                let p = new Promise(resolve => resolve());
                if (!_user) return reject('no user found');
                else {
                    user = _user;
                    p = this.knex('users')
                    .where({email})
                    .update({
                        reset: reset_key,
                        reset_at: new Date(),
                    });
                }
                return p;
            }).then(() => {
                if (!user) return;
                return resolve({
                    id: user.id,
                    email,
                    reset_key,
                    name: user.name
                });
            });
        });
    }

    resetPassword(token, new_password) {
        return new Promise((resolve, reject) => {
            this.knex('users')
            .where({
                reset: token,
            }).first()
            .then(user => {
                if (!user) {
                    let err = `UserManager:12:cant find user to reset password`;
                    return reject(err);
                } else return this._hashPassword(new_password);
            }).then(hashed_pass => {
                return this.knex('users')
                .where({
                    reset: token,
                }).update({
                    password: hashed_pass,
                    reset: null
                });
            }).then(() => {
                return resolve();
            }).catch(err => {
                return reject(err);
            });
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
    _insertUser({password, name, email, groups, permissions, platform}) {
        return this.knex('users')
        .insert({
            password,
            name,
            email,
            created_at: new Date(),
            groups,
            permissions,
            platform
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
