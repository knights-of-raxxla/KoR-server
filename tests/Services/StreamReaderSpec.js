
'use strict';
var chai = require('chai');
var expect = chai.expect;

describe('Stream Reader Spec', function(){
    const Reader = require('../../app/Services/Files/StreamReader.js');


    it('should read real long file', function(done) {
        this.timeout(8500);
        let path = './tests/Services/long-csv.csv';
        let reader= new Reader();
        let last_line;
        let rounds = 0;

        let onRead = function(chunk) {
            return new Promise((resolve, reject) => {
                rounds ++;
                last_line = chunk[chunk.length - 1];
                return resolve();
            });
        };

        reader.readFileLinesByChunk(path, 1, onRead)
            .then(() => {
                expect(last_line).to.be.ok;
                expect(typeof last_line).to.equal('string');
                expect(rounds).to.be.above(3);
                done();
            }).catch(err => {
                console.log(JSON.stringify(err, null, 4));
                throw new Error(err);
            });
    });
});

