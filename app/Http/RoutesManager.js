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
        this.app.get('/api/v1/user/login/'
            , this.userController.handleLogin_v1);

        // // TODO
        // this.app.get('/api/v1/user/can-login'
        //     , this.userController.canLogin);
        //
        // // TODO
        // this.app.post('/api/v1/user/create'
        //     , this.userController.createUser);
        //
        // // TODO
        // this.app.post('/api/v1/user/archive'
        //     , this.userController.archiveUser);
        //
        // // TODO
        // this.app.post('/api/v1/user/update'
        //     , this.userController.updateUser);
        //
        // // TODO
        // this.app.get('/api/v1/user/reset-password'
        //     , this.userController.resetPassword);
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
