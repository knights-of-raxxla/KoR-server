const Dipsy = require('dipsy');
class Container {
    constructor(express, app, http) {
        this.dipsy = new Dipsy();
        return this.register();
    }

    register() {
        let dipsy = new Dipsy();
        dipsy.register('async', require('async-q'), [], false);
        dipsy.register('lodash', require('lodash'), [], false);
        dipsy.register("request", require("request"), [], false);
        dipsy.register('object-hash', require('object-hash'), [], false);
        dipsy.register("uuid", require("uuid"), [], false);
        dipsy.register("md5", require("md5"), [], false);
        dipsy.register("bcrypt", require("bcrypt"), [], false);
        dipsy.register("decimal.js", require("decimal.js"), [], false);
        dipsy.register("jsonwebtoken", require("jsonwebtoken"), [], false);
        dipsy.register('knex', require('./Framework/Knex.js'), []);

        dipsy.register('JwtFactory', require('./Services/Auth/JwtFactory.js'), [
            'jsonwebtoken',
        ]);

        dipsy.register('UserManager', require('./Services/Auth/UserManager.js'), [
            "knex",
            "bcrypt",
            "uuid"
        ]);

        dipsy.register('StreamReader', require('./Services/Files/StreamReader.js'), []);

        dipsy.register('ExpeditionsRepo', require('./Repos/ExpeditionsRepo.js'), ['knex']);

        return dipsy;
    }
}

let $instance;
module.exports =  {
    getInstance(express, app, http) {
        if (!$instance) $instance = new Container(express, app, http);
        return $instance;
    }
}
