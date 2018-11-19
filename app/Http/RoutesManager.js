class RouteManager {
    constructor(app, container) {
        this.app = app;
        this.make_v1();
    }

    make_v1() {
        this.app.get('/', (req, res) => {
            console.log('bleh');
        });

        this.app.get('/api/v1/login/', (req, res) => {
            res.send(1);
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
