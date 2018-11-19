class RouteManager {
    constructor(app, container) {
        this.app = app;
        this.userManager = container.get('UserManager');
        this.jwtFactory = container.get('JwtFactory');
        this.make_v1();
    }

    _parseQueryString(base, str) {
        let params = decodeURI(base.split('?')[1]);
        let couples = params.split('&');
        let o = {};
        couples.forEach(couple => {
            let spl = couple.split('=');
            o[spl[0]] = spl[1];
        });
        return o;
    }

    make_v1() {
        this.app.get('/api/v1/login/', (req, res) => {
            let {email, password} = this._parseQueryString(req.url);
            this.userManager.userCanLogin(email, password)
            .then(can => {
                if (!can) return res.send(401);
                this.jwtFactory.make({payload: {email}})
                .then(token => {
                    return res.send(200).with({token});
                });
            }).catch(err => {
                if (err.match('02:cant find user with email')) res.send(401);
                else res.send(501);
                return;
            });
        });
    }
}

let $_instance;

module.exports = {
    getInstance: function(app, container) {
        if (!$_instance) {
            $_instance = new RouteManager(app, container);
        }
        return $_instance;
    }
};
