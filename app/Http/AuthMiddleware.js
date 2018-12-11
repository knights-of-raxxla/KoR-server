const _ = require('lodash');
const err = {
    no_token: `AuthMiddleware:01:no jwt token`,
};

const env = require('../../env.js');
const public_endpoints = [
    '/api/v1/user/login',
    '/api/v1/user/authenticate',
    '/api/v1/user/create',
    '/api/v1/user/start-password-reset',
    '/api/v1/user/reset-password',
    '/api/v1/expeditions/current',
    '/api/v1/expedition/',
    '/api/v1/expeditions/around',
    '/api/v1/systems/search',
    '/api/v1/system/',
    '/api/v1/visitables'
];
/**
 * @class AuthMiddleware
 * - filters API requests and makes sure they carry
 * a valid JWT
 * - let requests that come from public endpoints pass through
 */
const cookie_key = 'raxxla_auth';
module.exports = class AuthMiddleware {
    constructor(req, res, JWT) {
        this.JWT = JWT;
        this.req = req;
        this.res = res;
    }

    auth() {
        return new Promise((resolve, reject) => {
            let p = new Promise(resolve => resolve());
            let is_public = this._isPublicEndpoint(this.req);
            let token = this.getToken() || "";
            if (token) p = this.JWT.make(token);
            p.then(decoded => {
                if (decoded) {
                    console.log('AuthMiddleware::good token');
                    this.req.jwt_decoded = decoded;
                    return resolve();
                }
                if (!decoded && is_public) {
                    console.log('AuthMiddleware::public route');
                    return resolve();
                }
            }).catch(err => {
                if (is_public) {
                    console.log('AuthMiddleware::public route');
                    return resolve();
                }
                console.log({err});
                return reject(err);
            });
        });
    }

    getToken() {
        let header_auth = _.get(this.req.headers, 'raxxla-auth');
        if (header_auth) return header_auth;
        let cookies = _.get(this.req.headers, 'cookie');
        if (!cookies || !cookies.length) return false;
        for (let cookie of cookies) {
            let spl = cookie.split("=");
            if (spl[0].trim() === cookie_key) return spl[1];
        }
        if (this.req.query.cookie) return this.req.query.cookie;
        return false;
    }

    _isPublicEndpoint(req) {
        let endpoint = req.url.split('?')[0];
        for (let public_endpoint of public_endpoints) {
            let r = `^${public_endpoint}`;
            let m = endpoint.match(new RegExp(r));
            if (m && m.length) return true;
        }
        return false;
        // return public_endpoints.indexOf(endpoint) > -1;
    }
}
