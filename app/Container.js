const Dipsy = require('dipsy');

module.exports = class Container {
    constructor(express, app, http) {
        this.dipsy = new Dipsy();
        this.register();
        return this.dipsy;
    }

    register() {
        dipsy.register('async', require('async-q'), [], false);
        dipsy.register('lodash', require('lodash'), [], false);
        dipsy.register("request", require("request"), [], false);
        dipsy.register('object-hash', require('object-hash'), [], false);
        dipsy.register("uuid", require("uuid"), [], false);
        dipsy.register("md5", require("md5"), [], false);
        dipsy.register("decimal.js", require("decimal.js"), [], false);
    }
}
