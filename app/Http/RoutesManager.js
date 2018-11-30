const $controllers = {
    'userController': require('./Controllers/UserController.js'),
    'expeditionsController': require('./Controllers/ExpeditionsController.js')
};
class RouteManager {
    constructor(app, container) {
        this.app = app;
        this.userManager = container.get('UserManager');
        this.jwtFactory = container.get('JwtFactory');
        this._ = container.get('lodash');
        this._instantiateControllers(container);
        this.make_v1();
    }

    make_v1() {
        this.app.post('/api/v1/user/authenticate', (req, res) => {
            return this.userController.authenticate(req, res);
        });

        this.app.get('/api/v1/user/login/', (req, res) => {
            return this.userController.handleLogin_v1(req, res);
        });

        this.app.get('/api/v1/user/', (req, res) => {
            return this.userController.getUser(req, res);
        });

        this.app.post('/api/v1/user/create', (req, res) => {
            return this.userController.createUser(req, res);
        });

        this.app.post('/api/v1/user/archive', (req, res) => {
            return this.userController.archiveUser(req, res);
        });

        this.app.post('/api/v1/user/start-password-reset', (req, res) => {
            return this.userController.startResetUserPassword(req, res);
        });

        // TODO
        // /api/v1/user/reset-password
        // params : token, new_clear_password
        // public route
        //

        // // TODO
        // this.app.post('/api/v1/expedition/create'
        //     , this.expeditionsController.createExpedition);
        //
        // // TODO
        // this.app.get('/api/v1/system/search'
        //     , this.expeditionsController.searchSystem);

    }

    _instantiateControllers(container) {
        Object.keys($controllers).forEach(controller_name => {
            if (this.controller_name)
               throw new Error(`RoutesManager:01:cant have 2 controllers with same name (${controller_name})`);
            this[controller_name] = new $controllers[controller_name](container);
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
