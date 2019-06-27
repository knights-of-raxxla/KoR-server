'use strict';
var chai = require('chai');
var expect = chai.expect;
let child_p = require('child_process');

describe('EDSM_API Spec', function(){
    const container = require('../../../app/Container')
    .getInstance();
    const edsm = container.get('EDSM_API');
    this.timeout(4500);
    const async = container.get('async');

    it('should query sol', function(done) {
        edsm.systemBodies('Sol')
            .then(data => {
                expect(data.id).to.be.ok;
                expect(data.bodyCount).to.be.ok;
                expect(data.bodies.length).to.be.above(0);
                done();
            }).catch(err => {
                throw new Error(err);
            });
    });

    it('should query abidji', function(done) {
        edsm.systemBodies('Abidji')
            .then(data => {
                expect(data.id).to.be.ok;
                expect(data.bodyCount).to.be.ok;
                expect(data.bodies.length).to.be.above(0);
                done();
            }).catch(err => {
                throw new Error(err);
            });
    });

    it('should query bad', function(done) {
        edsm.systemBodies('bad_aaaa')
            .then(data => {
                throw new Error('bad then');
            }).catch(err => {
                console.log(err);
                done();
            });
    });

    it('should torify', function(done) {
        this.timeout(4500000);
        let arr = [...Array(5).keys()];
        let tor = edsm.rq;
        let p = {
            method: 'GET',
            url: 'https://api.ipify.org'
        };
        let ips = [];
        async.eachSeries(arr, () => {
        // async.eachLimit(arr, 2, () => {
            return new Promise((resolve, reject) => {
                tor.newTorSession(err => {
                    if (err) return reject(err);
                    return tor.request(p, (err, res, body) => {
                        console.log(body);
                        if (err) return reject(err);
                        setTimeout(() =>  resolve(body), 15000);
                    });
                });
            });
        }).then(out => {
            console.log(out.length);
            done();
        }).catch(err => {
            console.log({err});
        });
    });
});
