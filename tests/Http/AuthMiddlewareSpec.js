'use strict';
var chai = require('chai');
var expect = chai.expect;

describe('UserManagerSpec', function(){
    const container = require('../../app/Container')
        .getInstance();
    const Middleware = require('../../app/Http/AuthMiddleware.js');
    const JwtFactory = container.get('JwtFactory');
    const request =


    // we sign a jwt token
    it('should let pass request', function(done) {
        JwtFactory.make({payload: {user_id: 1}})
        .then(token => {
            let cookie = `kor=${token}`
            let good_req = {
                headers: {
                    cookie
                },
                query: {
                    cookie
                }
            };
            return new Middleware(good_req, {}, JwtFactory)
            .auth()
        }).then(() => {
            done();
        }).catch(err => {
            throw new Error(err);
        });
    });

    it('should refuse request', function(done) {
        JwtFactory.make({payload: {user_id: 1}})
        .then(token => {
            let cookie = `kor=a${token}`
            let good_req = {
                headers: {
                    cookie
                },
                query: {
                    cookie
                }
            };
            return new Middleware(good_req, {}, JwtFactory)
            .auth()
        }).catch(err => {
            done();
        });
    });
});

