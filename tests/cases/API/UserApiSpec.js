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
    let port = 3111; // cannot be changed
    const api = new ServerApi(rq, {url: `http://127.0.0.1:${port}`});
    const knex = container.get('knex');
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

    let users =[];
    it('should login', function(done) {
        let user_id;
        let p = {
            name: uuid.v4(),
            password: uuid.v4(),
            email: uuid.v4() + '@yopmail.com'
        };
        users.push(p);
        users_scenarios.createUser(p).then(_id => {
            user_id = _id;
            return api.login(p);
        }).then(res => {
            expect(res.statusCode).to.equal(200);
            let body = JSON.parse(res.body);
            expect(body.token).to.be.ok;
            done();
        });
    });

    it('should fail to login  => user not found', function(done) {
        let p = users.slice(0)[0];
        p.email = 'test' + p.email;
        api.login(p)
        .then(res => {
            expect(res.body.match('02:cant find user with email')).to.be.ok;
            expect(res.statusCode).to.equal(401);
            done();
        }).catch(err => {
            console.log(err);
        });
    });

    it('should fail to login  => bad password', function(done) {
        let p = users.slice(0)[0];
        p.email = 'test' + p.password;
        api.login(p)
        .then(res => {
            expect(res.statusCode).to.equal(401);
            done();
        }).catch(err => {
            console.log(err);
        });
    });

    let last_user_id;
    it('should create a new user', function(done) {
        let new_user = {
            email: uuid.v4() + '@yopmail.com',
            name: 'Cmdr ' + uuid.v4(),
            password: uuid.v4()
        };
        api.createUser(new_user)
            .then(res => {
                let body = JSON.parse(res.body);
                last_user_id = body.user_id;
                return api.getUser(last_user_id);
            }).then(user => {
                let userData = JSON.parse(user.body);
                expect(userData.email).to.equal(new_user.email);
                expect(userData.name).to.equal(new_user.name);
                done();
            }).catch(err => {
                throw new Error(err);
            });
    });

    let user_email;
    it('should archive user', function(done) {
        api.archiveUser(last_user_id)
        .then(res => {
            return api.getUser(last_user_id);
        }).then(res => {
            let userData = JSON.parse(res.body);
            user_email = userData.email;
            expect(userData.archive).to.equal(1);
            done();
        }).catch(err => {
            throw new Error(err);
        });
    });

    it('should start reset password process', function(done) {
        api.startPasswordReset(user_email)
            .then(res => {
                expect(res.statusCode).to.equal(200);
                let data = JSON.parse(res.body);
                expect(data.out.reset_key).to.be.ok;
                done();
            }).catch(err => {
                throw new Error(err);
            });
    });

    it('should fail to start reset password process (no user found)', function(done) {
        api.startPasswordReset('a@yopmail.com')
            .then(res => {
                expect(res.statusCode).to.equal(501);
                done();
            }).catch(err => {
                throw new Error(err);
            });
    });



    after(function(done) {
        server.on('close', () => {
            done();
        });
        server.kill();
    });
});

