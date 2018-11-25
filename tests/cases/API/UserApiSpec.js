'use strict';
var chai = require('chai');
var expect = chai.expect;
let child_p = require('child_process');

describe('UserApiSpec', function(){
    const container = require('../../../app/Container')
    .getInstance();
    const users_scenarios = require('../../scenarios/users/users_scenarios.js');
    const uuid = require('uuid');
    const rq = container.get('request');
    const ServerApi = require('../../../app/Services/API/ServerAPI.js');
    let port = 3111;
    const api = new ServerApi(rq, {url: `http://127.0.0.1:${port}`});
    let server;

    before(function(done) {
        this.timeout(15000);
        let entry = process.cwd() + '/server.js';
        server = child_p.spawn('node', [entry, `--port=${port}`]);

        server.stdout.on('data', data => {
            if (data && data.toString) data = data.toString();
            console.log(`[server.js] ${data}`);
            if (data.match('server started')) done();
        });

        server.stderr.on('data', data => {
            if (data && data.toString) data = data.toString();
            throw new Error(data);
        });
    });

    it('should login', function(done) {
        let user_id;
        let p = {
            name: uuid.v4(),
            password: uuid.v4(),
            email: uuid.v4() + '@yopmail.com'
        };
        users_scenarios.createUser(p).then(_id => {
            user_id = _id;
            return api.login(p);
        }).then(res => {
            let body = JSON.parse(res.body);
            expect(body.token).to.be.ok;
            done();
        });
    });

    after(function(done) {
        server.on('close', () => {
            done();
        });
        server.kill();
    });

});

