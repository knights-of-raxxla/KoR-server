process.setMaxListeners(0);
require('events').EventEmitter.defaultMaxListeners = 0;

// // const HttpAuth = require("./app/middlewares/HttpAuthMiddleware.js");
const AuthMiddleware = require('./app/Http/AuthMiddleware.js');
const RouteManager = require("./app/Http/RoutesManager.js");

const runtime_args = {};
let command_line_args = process.argv.slice(2);
const allowed_args_keys = ['port'];
command_line_args.forEach(couples => {
    let spl = couples.split('=');
    let key = spl[0].replace('--', '');
    let val = spl[1];
    if (!allowed_args_keys.indexOf(key) < 0)
        throw new Error(`arg key ${key} is not recognized`);
    runtime_args[key] = val;
});

var express = require("express");
var app     = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

var http = require("http").createServer(app);

let port = runtime_args.port || 80;
global.express_port = port; // on en a besoin pour dans RedisBaseEvents.js

// Service Container
let container = require("./app/Container").getInstance(express, app, http); // boot le container

app.use((req, res, next) => {
    let jwt_factory = container.get('JwtFactory');
    new AuthMiddleware(req, res, jwt_factory).auth()
    .then(() => {
        next();
    }).catch(err => {
        res.send(401);
    });
});

RouteManager.getInstance(app, container);
console.log('http controllers inited');


global.rootRequire = function(name) {
    return require(__dirname + '/' + name);
};

// Starting the Server
http.listen(port, '0.0.0.0', function() {
    console.log(`KoR server started on port ${port}`);
});
