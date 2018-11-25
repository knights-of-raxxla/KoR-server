'use strict';
var chai = require('chai');
var expect = chai.expect;
let child_p = require('child_process');

describe('UserManagerSpec', function(){
    const container = require('../../app/Container')
    .getInstance();
    let port = 3111;
    let server;

    before(function(done) {
        server = child_p.exec(`node server.js --port=${port}`);
        setTimeout(() => {
            done();
        }, 4500);
    });

    it('should login', function(done) {
    });
});

