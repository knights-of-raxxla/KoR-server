process.setMaxListeners(0);
require('events').EventEmitter.defaultMaxListeners = 0;

// const HttpAuth = require("./app/middlewares/HttpAuthMiddleware.js");
const RouteManager = require("./app/Http/RoutesManager.js");

var express = require("express");
var app     = express();
var http    = require("http").createServer(app);

let port = 3000;
global.express_port = port; // on en a besoin pour dans RedisBaseEvents.js

// Service Container
let container = require("./app/Container").getInstance(express, app, http); // boot le container

app.use((req, res, next) => {
    new HttpAuth(req, res, container.get('JWTFactory')).auth()
    .then(() => {
        next();
    }).catch(err => {
        res.send(err);
    });
});

RouteManager.getInstance(app, container);
console.log('http controllers inited');


global.rootRequire = function(name) {
    return require(__dirname + '/' + name);
};

// Starting the Server
http.listen(port, '0.0.0.0', function() {
    console.log(`KoR server started on port${port}`);
});
