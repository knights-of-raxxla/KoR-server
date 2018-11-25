
'use strict';
var chai = require('chai');
var expect = chai.expect;

describe('Expedition Repo Spec', function(){
    const container = require('../../app/Container.js')
        .getInstance();
    const repo = container.get('ExpeditionsRepo');
    let sol;

    it('should find system', function(done) {
        this.timeout(8500);
        // repo.getSystem('Sol')
        repo.getSystem('Sol')
            .then(_sol => {
                sol = _sol;
                console.log(sol);
                done();
            }).catch(err => {
                console.log({err});
                throw new Error(err);
            });
    });

    it('should find systems at 150Ly of Sol', function(done){
        this.timeout(50000);
        repo.findSystemsAround(sol, 150)
            .then(systems => {
                console.log(JSON.stringify(systems, null, 4));
                console.log(systems.length);
                done();
            }).catch(err => {
                console.log(JSON.stringify({err}, null, 4));
                throw new Error(err);
            });
    });

    // TODO
    it('should create an expedition', function(done) {
    });
});

