/**
 * @class AuthMiddleware
 * filters API requests and makes sure they carry
 * a valid JWT
 */
const cookie_key = 'kor';
module.exports = class AuthMiddleware {
    constructor(req, res, JWT) {
        this.JWT = JWT;
        this.req = req;
        this.res = res;
        // this.token = token;
    }

    auth() {
        // console.log('http auth');
        return new Promise((resolve, reject) => {
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
        let cookies = this.req.headers.cookie.split("; ");
        for (let cookie of cookies) {
            let spl = cookie.split("=");
            if (spl[0] === cookie_key) return spl[1];
        }
        if (this.req.query.cookie) return this.req.query.cookie;
        return false;
    }
}
