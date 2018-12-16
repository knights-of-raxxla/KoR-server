'use strict';
var chai = require('chai');
var expect = chai.expect;

describe('Geometry Repo Spec', function(){
    const container = require('../../../app/Container.js')
        .getInstance();
    const repo = container.get('GeometryRepo');

    it('should compute semi small axis in light seconds', function() {
        let semi_major_axis = 0.36; //au
        let orbital_eccentricity = 0.0100;
        let semi_minor_axis_au = repo.semiMinorAxis(semi_major_axis, orbital_eccentricity);
        let semi_minor_axis_ls = repo.semiMinorAxis(semi_major_axis, orbital_eccentricity, {unit: 'ls'});

        expect(semi_minor_axis_au).to.be.above(0.35);
        expect(semi_minor_axis_au).to.be.below(0.36);
        expect(semi_minor_axis_ls).to.be.below(180);
        expect(semi_minor_axis_ls).to.be.above(0.179);
    });
});
