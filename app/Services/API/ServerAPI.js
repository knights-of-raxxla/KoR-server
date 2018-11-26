class ServerApi {
    constructor(request, opts) {
        this.rq = request;
        this.url = opts.url;
        this.cookie = null;
    }

    login({email, password}) {
        return new Promise((resolve, reject) => {
            email = encodeURIComponent(email);
            password = encodeURIComponent(password);
            let qs = [
                this.url,
                '/api/v1/user/login',
                `?email=${email}`,
                `&password=${password}`
            ].join('');
            this.rq.get(qs, (err, res) => {
                if (err) return reject(err);
                let token = JSON.stringify(res.body).token;
                this.cookie = token;
                return resolve(res);
            });
        });
    }

    createUser(params) {
        return new Promise((resolve, reject) => {
            this.rq.post({
                form: params,
                uri: [
                    this.url,
                    '/api/v1/user/create'
                    ].join('')
            }, (err, res) => {
                if (err) return reject(err);
                return resolve(res);
            });
        });
    }

    archiveUser(user_id) {
        return new Promise((resolve, reject) => {
            this.rq.post({
                form: {user_id},
                url: [
                    this.url,
                    '/api/v1/user/archive'
                ].join('')
            }, (err, res) => {
                if (err) return reject(err);
                return resolve(res);
            });
        });
    }

    getUser(user_id) {
        return new Promise((resolve, reject) => {
            let url = [
                this.url,
                '/api/v1/user',
                '?user_id=',
                user_id
            ].join('');
            this.rq.get(url, (err, res) => {
                if (err) return reject(err);
                return resolve(res);
            });
        });
    }

    startPasswordReset(email) {
        return new Promise((resolve, reject) => {
            let url = [
                this.url,
                '/api/v1/system/start-password-reset'
                ].join('');
                this.rq.post({
                    form: {email},
                    url: url
                }, (err, out) => {
                    if (err) return reject(err);
                    return resolve(out);
                });
        });
    }
}

module.exports = ServerApi;


