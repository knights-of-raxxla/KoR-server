'use strict';
var chai = require('chai');
var expect = chai.expect;

describe('Helper Repo Spec', function(){
    const container = require('../../../app/Container.js')
        .getInstance();
    const repo = container.get('HelperRepo');

    it('get 8th moon - ez', function() {
        let center = {name: 'Gaz'};
        let bodies = [
            {
                name: 'Gaz A'
            },
            {
                name: 'Gaz B'
            },
            {
                name: 'Gaz C'
            },
            {
                name: 'Gaz D'
            },
            {
                name: 'Gaz E'
            },
            {
                name: 'Gaz F'
            },
            {
                name: 'Gaz G'
            },
            {
                name: 'Gaz H'
            }
        ];
        let eight = repo.findNthMoonLike(center, bodies);
        expect(eight.name).to.equal('Gaz H');
    });

    it('get 8th moon - hard case', function() {
        let center = {name: 'Gaz'};
        let bodies = [
            {
                name: 'Gaz A'
            },
            {
                name: 'Gaz B'
            },
            {
                name: 'Gaz C 1'
            },
            {
                name: 'Gaz C 2'
            },
            {
                name: 'Gaz D'
            },
            {
                name: 'Gaz E'
            },
            {
                name: 'Gaz F'
            },
            {
                name: 'Gaz G'
            }
        ];
        let eight = repo.findNthMoonLike(center, bodies);
        expect(eight.name).to.equal('Gaz G');
    });

    it('get 8th moon - dafuq 10 case', function() {
        let center = {name: 'Gaz 1'};
        let bodies = [
            {
                name: 'Gaz 1 A'
            },
            {
                name: 'Gaz 1 B'
            },
            {
                name: 'Gaz 1 C'
            },
            {
                name: 'Gaz 1 D'
            },
            {
                name: 'Gaz 1 E'
            },
            {
                name: 'Gaz 1 F'
            },
            {
                name: 'Gaz 1 G'
            },
            {
                name: 'Gaz 10'
            }
        ];
        let eight = repo.findNthMoonLike(center, bodies);
        expect(eight).to.equal(false);
    });
});
