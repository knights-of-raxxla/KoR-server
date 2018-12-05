'use strict';
var chai = require('chai');
var expect = chai.expect;

describe('Expedition Repo Spec', function(){
    const container = require('../../../app/Container.js')
        .getInstance();
    const repo = container.get('ExpeditionsRepo');
    const async = container.get('async');
    let sol;

    it('should create new system', function(done) {
        let system = {
            name: 'Raxxla X1',
            edsm_id: null,
            eddb_id: null,
            x: 10,
            y: 10,
            z: 10
        };
        repo.createSystem(system)
            .then(res => {
                done();
            }).catch(err => {
                throw new Error(err);
            });
    });

    it('should find system', function(done) {
        this.timeout(8500);
        repo.getSystem('Raxxla X1')
            .then(_sol => {
                sol = _sol;
                done();
            }).catch(err => {
                console.log({err});
                throw new Error(err);
            });
    });

    it('should find systems at 50ly of Raxxla 1', function(done){
        this.timeout(10000);
        let systems = [
            {
                name: 'Raxxla X2',
                edsm_id: null,
                eddb_id: null,
                x: 10,
                y: 11,
                z: 11
            },
            {
                name: 'Raxxla X3',
                edsm_id: null,
                eddb_id: null,
                x: 1500,
                y: 1500,
                z: 1500
            }
        ];

        async.each(systems, system => {
            return repo.createSystem(system);
        }).then(() => {
            return repo.findSystemsAround(sol, 50);
        }).then(systems => {
            expect(systems.length).to.be.above(1);
            done();
        }).catch(err => {
            console.log(JSON.stringify({err}, null, 4));
            throw new Error(err);
        });
    });
});

