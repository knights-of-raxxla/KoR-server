'use strict';
var chai = require('chai');
var expect = chai.expect;

describe('Body Repo Spec', function(){
    const container = require('../../../app/Container.js')
        .getInstance();
    const expeRepo = container.get('ExpeditionsRepo');
    const bodyRepo = container.get('BodyRepo');
    const knex = container.get('knex');
    let sol;
    let insert_body = {
        eddb_id: 1,
        system_id: 1,
        type: "planet",
        name: "Test A",
        is_landable: true,
        distance_from_arrival: 42
    };

    it('pretest clean db', function(done) {
        expeRepo.getSystem('Sol')
        .then(_sol => {
            sol = _sol
            return knex('bodies')
                .where({system_id: _sol.id})
                .delete();
        }).then(out => {
            expect(out).to.be.a('number');
            done();
        }).catch(err => {
            console.log({err});
            throw new Error(err);
        });
    });

    it('should check if sol has not bodies', function(done) {
        bodyRepo.checkHasBodies(sol.id)
        .then(has => {
            expect(has).to.be.false;
            done();
        }).catch(err => {
            console.log({err});
            throw new Error(err);
        });
    });

    it('should request bodies of sol', function(done) {
        bodyRepo.getBodiesFromEDDB(sol)
        .then(bodies => {
            expect(bodies).to.be.an('array')
                .that.is.not.empty;
            bodies.forEach(body => {
                expect(body).to.have.property('eddb_id');
                expect(body).to.have.property('system_id');
                expect(body).to.have.property('name');
                expect(body).to.have.property('type');
                expect(body).to.have.property('is_landable');
                expect(body).to.have.property('distance_from_arrival');
            });
            done();
        }).catch(err => {
            console.log({err});
            throw new Error(err);
        });
    });

    it('should insert bodies', function(done) {
        let body = [insert_body];
        bodyRepo.insertBodies(body)
        .then(out => {
            expect(out).to.be.ok;
            done();
        }).catch(err => {
            console.log({err});
            throw new Error(err);
        });
    });

    it('should get and insert sol bodies', function(done) {
        bodyRepo.getAndInsertBodies(sol)
        .then(out => {
            expect(out).to.be.ok;
            done();
        }).catch(err => {
            console.log({err});
            throw new Error(err);
        });
    });

    it('should check if sol has bodies', function(done) {
        bodyRepo.checkHasBodies(sol.id)
        .then(has => {
            expect(has).to.be.true;
            done();
        }).catch(err => {
            console.log({err});
            throw new Error(err);
        });
    });

    it('clear the fake inserted body', function(done) {
        knex('bodies').where(insert_body)
        .delete()
        .then(out => {
            expect(out).to.be.ok;
            done();
        }).catch(err => {
            console.log({err});
            throw new Error(err);
        });
    })
});
