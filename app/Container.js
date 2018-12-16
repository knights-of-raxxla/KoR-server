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
        dipsy.register('nodemailer', require('nodemailer'), [], false);
        dipsy.register('child_process', require('child_process'), [], false);
        dipsy.register('cheerio', require('cheerio'), [], false);

         dipsy.register('BodiesModel', require('./Models/BodiesModel.js', [], false));
         dipsy.register('ExpeditionsSystemsUserModel'
             , require('./Models/ExpeditionsSystemsUsersModel.js'), [], false);
         dipsy.register('VisitablesModel', require('./Models/VisitablesModel.js'), [], false);
         dipsy.register('UsersModel', require('./Models/UsersModel.js'), [], false);
         dipsy.register('SystemsModel', require('./Models/SystemsModel.js'), [], false);
         dipsy.register('GeometryRepo', require('./Repos/GeometryRepo.js'), []);
         dipsy.register('ExpeditionsModel', require('./Models/ExpeditionsModel.js'), [], false);
         dipsy.register('HelperRepo', require('./Repos/HelperRepo.js'), []);

        dipsy.register('MutationReporter',
            require('./Framework/MutationReport.js'));

        dipsy.register('JwtFactory', require('./Services/Auth/JwtFactory.js'), [
            'jsonwebtoken',
        ]);

        dipsy.register('UserManager', require('./Services/Auth/UserManager.js'), [
            "knex",
            "bcrypt",
            "uuid"
        ]);

        dipsy.register('StreamReader'
            , require('./Services/Files/StreamReader.js'), []);

        dipsy.register('BodyRepo'
            , require('./Repos/BodyRepo.js')
            , ['request', 'cheerio', 'knex', 'MutationReporter']);
        dipsy.register('ExpeditionsRepo'
            , require('./Repos/ExpeditionsRepo.js'), [
            'knex',
            'async',
            'MutationReporter',
            'ExpeditionsModel',
            'ExpeditionsSystemsUserModel',
            'SystemsModel',
            'BodyRepo'
            ]);

         dipsy.register('Mailer'
         , require('./Services/Email/Mailer.js'), ['nodemailer']);
         dipsy.register('MailFactory'
         , require('./Services/Email/MailFactory.js'));



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
