'use strict';
var chai = require('chai');
var expect = chai.expect;

describe('Helper Repo Spec', function(){
    const container = require('../../../app/Container.js')
        .getInstance();
    const _ = container.get('lodash');
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

    it('get body name from info', function() {
        let a_sys = 'Sys';
        let a_body = 'Sys 1'
        let a_res = repo.getBodyInfoByName(a_body, a_sys);

        let b_sys = 'Sys';
        let b_body = 'Sys 1 f'
        let b_res = repo.getBodyInfoByName(b_body, b_sys);

        let c_sys = 'Sys';
        let c_body = 'Sys A 1'
        let c_res = repo.getBodyInfoByName(c_body, c_sys);

        let d_sys = 'Sys';
        let d_body = 'Sys A 1 f'
        let d_res = repo.getBodyInfoByName(d_body, d_sys);

        let e_sys = 'Sys';
        let e_body = 'Sys AB 1'
        let e_res = repo.getBodyInfoByName(e_body, e_sys);

        let f_sys = 'Sys';
        let f_body = 'Sys AB 1 f'
        let f_res = repo.getBodyInfoByName(f_body, f_sys);

        expect(a_res.has_multiple_stars).to.equal(false);
        expect(a_res.stars[0]).to.equal('$main');

        expect(b_res.has_multiple_stars).to.equal(false);
        expect(b_res.stars[0]).to.equal('$main');

        expect(c_res.has_multiple_stars).to.equal(false);
        expect(c_res.stars[0]).to.equal('A');

        expect(d_res.has_multiple_stars).to.equal(false);
        expect(d_res.stars[0]).to.equal('A');

        expect(e_res.has_multiple_stars).to.equal(true);
        expect(e_res.stars[0]).to.equal('A');
        expect(e_res.stars[1]).to.equal('B');

        expect(f_res.has_multiple_stars).to.equal(true);
        expect(f_res.stars[0]).to.equal('A');
        expect(f_res.stars[1]).to.equal('B');
    });

    it('should compute smallest distance between 2 orbits (star - outer planet - moon)', function() {
        let gaz_s_minor = 47; // ls
        let moon_s_major = 18;
        let gaz_orbital_inclin = 0.02;
        let moon_orbital_inclin = 12.7;
        let distance = repo.smallestDistance(gaz_s_minor, moon_s_major, gaz_orbital_inclin, moon_orbital_inclin);
        expect(distance).to.be.above(47-18);
    });

    it.only('should find out body position based on name', function() {
        let sys = 'System';
        let a = 'System 1';
        let b = 'System ABC 1';
        let c = 'System ABC 1 a'
        let d = 'System ABC 10';

        // let a_meta = repo.getBodyPosition(sys, a);
        // expect(a_meta.ref_stars).to.equal(undefined);
        // expect(a_meta.ref_stars_pos).to.equal(1);
        //
        // let b_meta = repo.getBodyPosition(sys, b);
        // expect(b_meta.ref_stars).to.equal('ABC');
        // expect(b_meta.ref_stars_pos).to.equal(1);
        //
        // let c_meta = repo.getBodyPosition(sys, c);
        // expect(c_meta.ref_stars).to.equal('ABC');
        // expect(c_meta.ref_stars_pos).to.equal(1);
        //
        // let d_meta = repo.getBodyPosition(sys, d);
        // expect(d_meta.ref_stars).to.equal('ABC');
        // expect(d_meta.ref_stars_pos).to.equal(10);

        let bodies = [
            'System A',
            'System A 1',
            'System A 2 b',
            'System A 2',
            'System A 12',
            'System A 2 a',
            'System B',
            'System B 1',
            'System B 2',
            'System B 3'
        ];

        let m= repo.getBodyPosition(sys, bodies[0]);

        let meta_l = _.map(bodies, b => {
            let meta = repo.getBodyPosition(sys, b);
            console.log(meta.rest);
            meta.body_name = b;
            return meta;
        });

        let ordered = _.orderBy(meta_l, ['ref_stars', 'ref_stars_pos', 'rest'], ['asc', 'asc', 'asc']);
        console.log(_.map(ordered, o => o.body_name));

        sys = 'Agnairt TA-U d4-1448';
        bodies = [ 'Agnairt TA-U d4-1448',
            'Agnairt TA-U d4-1448 2 a',
            'Agnairt TA-U d4-1448 2 b',
            'Agnairt TA-U d4-1448 2 c',
            'Agnairt TA-U d4-1448 2 d',
            'Agnairt TA-U d4-1448 2 e',
            'Agnairt TA-U d4-1448 2 f',
            'Agnairt TA-U d4-1448 2 g',
            'Agnairt TA-U d4-1448 1',
            'Agnairt TA-U d4-1448 2'
        ] ;

        meta_l = _.map(bodies, b => {
            let meta = repo.getBodyPosition(sys, b);
            meta.body_name = b;
            console.log(meta);
            return meta;
        });
        ordered = _.orderBy(meta_l, ['ref_stars', 'ref_stars_pos', 'rest'], ['asc', 'asc', 'asc']);
        console.log(_.map(ordered, o => o.body_name));

        sys = 'Aucoks KA-H c13-8';
        bodies =  [ 'Aucoks KA-H c13-8 A',
            'Aucoks KA-H c13-8 ABC 2 a',
            'Aucoks KA-H c13-8 ABC 2 b',
            'Aucoks KA-H c13-8 ABC 2 c',
            'Aucoks KA-H c13-8 ABC 2 e',
            'Aucoks KA-H c13-8 ABC 2 f',
            'Aucoks KA-H c13-8 ABC 2 g',
            'Aucoks KA-H c13-8 ABC 2 h',
            'Aucoks KA-H c13-8 ABC 2',
            'Aucoks KA-H c13-8 B'
        ];
        meta_l = _.map(bodies, b => {
            let meta = repo.getBodyPosition(sys, b);
            meta.body_name = b;
            console.log(meta);
            return meta;
        });
        ordered = _.orderBy(meta_l, ['ref_stars', 'ref_stars_pos', 'rest'], ['asc', 'asc', 'asc']);
        console.log(_.map(ordered, o => o.body_name));

    })
});
