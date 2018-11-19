'use strict';
var chai = require('chai');
var expect = chai.expect;

describe('UserManagerSpec', function(){
    const container = require('../../app/Container')
        .getInstance();
   const uuid = container.get('uuid');
   const userManager = container.get('UserManager');
   const knex = container.get('knex');

   let inserted_users = [];
   let password =  uuid.v4();
   let email = uuid.v4() + '@yopmail.com';
   let name = uuid.v4();
   it('should create a new user', function(done) {
         userManager.createUser({name, password, email})
        .then(pk => {
            expect(pk).to.be.above(0);
            inserted_users.push(pk);
            done();
        }).catch(err => {
            console.log({err});
            throw new Error(err);
        });
   });

   it('should let user login', function(done) {
        userManager.userCanLogin(email, password)
            .then(can => {
                expect(can).to.equal(true);
                done();
            });
   });

   it('should not let user login', function(done) {
        let bad_password = password + 'a';
        userManager.userCanLogin(email, bad_password)
            .then(can => {
                expect(can).to.equal(false);
                done();
            });
   });

   it('should fail to create user bc of invalid email', function(done) {
        let name = uuid.v4();
        let email = uuid.v4() + '@yopmail.com' + '@toto';

        userManager.createUser({name, password, email})
        .catch(err => {
            let is_bad_email = err.match('bad email');
            expect(is_bad_email).to.be.ok;
            done();
        });
   });

   it('should archive user', function(done) {
       userManager.archiveUser(inserted_users[0])
       .then(res => {
           expect(res).to.equal(1);
           done();
       });
   });



   it('clean up', function() {
       return knex('users')
       .whereIn('id', inserted_users)
       .delete();
   });
});

