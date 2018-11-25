const err = {
    no_token: `AuthMiddleware:01:no jwt token`,
};

const env = require('../../env.js');
const public_endpoints = [
    '/api/v1/login'
];
/**
 * @class AuthMiddleware
 * - filters API requests and makes sure they carry
 * a valid JWT
 * - let requests that come from public endpoints pass through
 */
const cookie_key = 'kor';
module.exports = class AuthMiddleware {
    constructor(req, res, JWT) {
        this.JWT = JWT;
        this.req = req;
        this.res = res;
    }

    auth() {
        return new Promise((resolve, reject) => {
            if (this._isPublicEndpoint(this.req)) return resolve();
            let token = this.getToken();
            if (!token) return reject(err.no_token);
            this.JWT.make(token)
            .then(jwt => {
                this.req.jwt = jwt;
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    }

    getToken() {
        console.log(this.req.headers.cookie);
        let cookies = this.req.headers.cookie.split("; ");
        for (let cookie of cookies) {
            let spl = cookie.split("=");
            if (spl[0] === cookie_key) return spl[1];
        }
        if (this.req.query.cookie) return this.req.query.cookie;
        return false;
    }

    _isPublicEndpoint(req) {
        let req_endpoint = req.headers.host + req.url.split('?')[0];
        for (let public_e of public_endpoints) {
            let possibilities = [
                env.app_url + public_e,
                'http://127.0.0.1:3111' + public_e // unit tests
            ];
            let f = env.app_url + public_e;
            if (possibilities.indexOf(f) > -1)
                return true;
        }
        return false;
    }
}
