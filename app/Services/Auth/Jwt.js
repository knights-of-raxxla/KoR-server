
'use strict';

/**
 * @class
 * @description classe qui gère les tokens JWT
 * @memberof module:Services/Auth
 */
class JWT  {
    constructor(engine, params) {
        this.engine = engine; //jsonwebtoken

        this.options;
        this.salt       = 'we_dont_bask_in_ur_glory';
        this.expire     = '9999 days';
        this.hasErrored = false;
        if (typeof params === 'string') {
            this.token = params;
            return this.decode();
        } else {
            this.payload = params.payload;
            if (!params.payload.exp) this.options = {
                expireIn: this.expire
            };
            return this.encode();
        }
    }

    get() {
        if (this.decoded) {
            return this.decoded;
        } else if (this.encoded) {
            return this.encoded;
        } else {
            return null;
        }
    }

    isValid() {
        return this.hasErrored === false;
    }

    /**
     * Decode en vérifiant que la signature correspond
     * au salt de ce code / serveur
     * @return Promise
     */
    decode() {
        return new Promise((resolve, reject) =>  {
            this.engine.verify(this.token, this.salt, this.options, (err, decoded) => {
                if (err) {
                    reject(err);
                }
                resolve(decoded);
            });
        });
    }

    /**
     * Signe ou Encode un Json Web Token
     * @return Promise
     */
    encode() {
        return new Promise((resolve, reject) =>  {
            let token = this.engine.sign(this.payload, this.salt);
            // let token = this.engine.sign(this.payload, this.salt, {
            //     expiresIn: this.expire
            // });
            if (!token) {
                reject(token);
            }
            resolve(token);
        });
    }
}

module.exports = JWT;
