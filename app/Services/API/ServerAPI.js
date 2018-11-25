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
                return resolve(res);
            });
        });
    }
}

module.exports = ServerApi;


