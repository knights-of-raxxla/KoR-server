/**
 * # Request
 * Systems with at least 10 bodies (exactly 10 bodies would be nice)
 * 1 star
 * 2nd planet should have a ring
 * planet 6 is a moon of 5
 *
 * ===================================================================
 * # Implementation
 *
 * This query starts by fetching planets with rings, which are very few compared the overall
 * total number of bodies in the game. Those systems with less than 9 bodies are then excluded.
 * The following columns are then placed in the csv in order to be used as filters :
 *
 *  `System Name`,              Name of the system
 *  `Ringed Planet Name`,       Name of ringed planet
 *  `Is ring 2nd planet`,       Does the ring planet appears to be the second planet of the system ?
 *  `Body count`                Number of bodies in systeem (planets + stars)
 *  `Star count`                Number of stars in system
 *  `Fifth planet moons count`, Number of moons around the fifth planet
 *  `Fifth planet moons names`  Names of those moons around the fifth planet
 */


/**
 * Run with node probe.js fast if u wanna read the json
 * instead of querying again
 */

let args = process.argv;
let mode = args[2];

let container = require('../../Container.js')
    .getInstance();
const knex = container.get('knex');
const expeRepo = container.get('ExpeditionsRepo');
const geoRepo = container.get('GeometryRepo');
const helper = container.get('HelperRepo');
const async = container.get('async');
const _ = container.get('lodash');
const fs = require('fs');
const os = require('os');

function q1() {
    return knex('rings')
        .leftJoin('bodies', 'rings.body_id', 'bodies.id')
        .leftJoin('bodies as bodies_2', 'bodies.system_id', 'bodies_2.system_id')
        .count('bodies_2.id as count')
        .select('bodies_2.system_id as system_id')
        .distinct('rings.body_id')
        .groupBy(['bodies_2.system_id', 'rings.body_id'])
        .having('count', '=', 10);
}


function p1() {
    let suitables = [];
    let cmds = [];
    if (mode !== 'fast') cmds.push(q1());
    return Promise.all(cmds)
        .then(out => {
            let rows;
            if (mode === 'fast') rows = require('../../../storage/probe_1.json');
            else {
                rows = out[0];
                fs.writeFileSync('./storage/probe_1.json', JSON.stringify(rows));
            }
            return knex('bodies')
                .leftJoin('systems', 'systems.id', 'bodies.system_id')
                .leftJoin('rings', 'rings.body_id', 'bodies.id')
                .where('bodies.system_id', 'in', _.map(rows, r => r.system_id))
                .select('systems.name as system_name')
                .select('systems.id as system_id')
                .select('rings.name as ring_name')
                .select('bodies.name as body_name')
                .select('bodies.type as body_type')
                .distinct('bodies.id')
        }).then(bodies => {
            console.log(`${bodies.length} systems in filter`);
            let systems = _.groupBy(bodies, 'system_name');
            let l = Object.keys(systems).length;
            for (let i = 0; i < l; i++) {
                if (i % 800 === 0) {
                    let prct = i/l * 100;
                    console.log(`${prct.toFixed(1)} % scanned || found: ${suitables.length} || last: ${_.get(_.last(suitables), 'system_name')}`);
                }
                let key = Object.keys(systems)[i];
                let bodies = systems[key];
                let system_name = key;

                let body_count = bodies.length;
                if (body_count !== 10) continue;

                let ringed_count = _.filter(bodies, b => b.ring_name).length;
                if (ringed_count > 1) continue;

                // let ringed = _.find(bodies, b => b.ring_name);

                let bodies_meta = _.map(bodies, b => {
                    let meta = helper.getBodyPosition(system_name, b.body_name)
                    meta.body_name = b.body_name;
                    meta.ring_name = b.ring_name;
                    return meta;
                });

                let bodies_by_name = _.orderBy(bodies_meta, ['ref_stars', 'ref_stars_pos', 'rest'], ['asc', 'asc', 'asc']);

                let snd_ringed = bodies_by_name[2].ring_name &&
                    bodies_by_name[2].ring_name.length > 0;
                if (!snd_ringed) continue;

                let no_moons = bodies_by_name.slice(1, 6).concat(bodies_by_name.slice(7))
                let has_no_moons = true;
                for (let nm of no_moons) {
                    let spl = nm.body_name.split(' ');
                    if (_.last(spl).match(/[a-z]/)) {
                        has_no_moons = false;
                        break;
                    }
                }
                if (!has_no_moons) continue;


                // let third_not_a_moon = bodies_by_name[3].body_name.replace(bodies_by_name[2].body_name).length === 0;
                // if (!third_not_a_moon) continue;
                //
                // let snd_ringed_suffix = snd_ringed.body_name.split(system_name)[1];
                // console.log(snd_ringed_suffix);
                // if (snd_ringed_suffix.match('10')) continue;
                // if (snd_ringed_suffix.match('11')) continue;
                // if (snd_ringed_suffix.match('12')) continue;
                // if (snd_ringed_suffix.match('13')) continue;
                // if (snd_ringed_suffix.match('14')) continue;


                // let start_index = parseInt(bodies_by_name[0].body_name.split(system_name)[1])
                // if (isNaN(start_index)) {
                //     // system probably has several stars near arrival
                //     // console.log('nan', system_name);
                //     continue;
                // }
                //
                //
                // let pl_1_ok = bodies_by_name[1].body_name === system_name + ` ${start_index + 0}`;
                // if (!pl_1_ok) continue;
                //
                // let pl_2_ok = bodies_by_name[2].body_name === system_name + ` ${start_index + 1}` && bodies_by_name[2].ring_name;
                // if (!pl_2_ok) continue;
                //
                // let pl_3_ok = bodies_by_name[3].body_name === system_name + ` ${start_index + 2}`;
                // if (!pl_3_ok) continue;
                //
                // let pl_4_ok = bodies_by_name[4].body_name === system_name + ` ${start_index + 3}`;
                // if (!pl_4_ok) continue;
                //
                // let pl_8_ok = bodies_by_name[8].body_name === system_name + ` ${start_index + 7}`;
                // if (!pl_8_ok) continue;
                //
                // let pl_9_ok = bodies_by_name[9].body_name === system_name + ` ${start_index + 8}`;
                // if (!pl_9_ok) continue;
                //
                // let pl_2_ok = bodies_by_name[2].body_name === system_name + ' 2' && bodies_by_name[2].ring_name;
                // if (!pl_2_ok) continue;
                // let pl_3_ok = bodies_by_name[3].body_name === system_name + ' 3';
                // if (!pl_3_ok) continue;
                // let pl_4_ok = bodies_by_name[4].body_name === system_name + ' 4';
                // if (!pl_4_ok) continue;
                //
                // let pl_8_ok = bodies_by_name[8].body_name === system_name + ' 8';
                // if (!pl_8_ok) continue;
                // let pl_9_ok = bodies_by_name[9].body_name === system_name + ' 9';
                // if (!pl_9_ok) continue;


                // let is_second_planet = false;
                // if (ringed && ringed.body_name) {
                //     is_second_planet = isNthBody(system_name, ringed.body_name, 2);
                // }
                //
                // if (!is_second_planet) continue;

                let stars_count = _.filter(bodies, {body_type: 'Star'}).length;

                // let fifth = _.find(bodies, b => isNthBody(system_name, b.body_name, 5));
                // let sixth = _.find(bodies, b => isNthBody(system_name, b.body_name, 6));

                // checks whether fifth has moons
                // let moons = [];
                // if (fifth) {
                //     moons = _.filter(bodies, b => {
                //         let spl = b.body_name.split(fifth.body_name);
                //         return spl.length > 1;
                //     });
                // }
                // checks whether fifth and sitxh planets share the same barycenter
                // let fifth_sixth_share_barycenter = false;
                // if (fifth && sixth && fifth.parents && sixth.parents &&
                //     fifth.parents.length && sixth.parents.length) {
                //     let f_parents = JSON.parse(fifth.parents);
                //     let s_parents = JSON.parse(sixth.parents);
                //
                //     let f_barycenters = [];
                //     let s_barycenters = [];
                //     _.forIn(f_parents, (id, type) => {
                //         if (type === 'Null') f_barycenters.push(id);
                //     });
                //     _.forIn(s_parents, (id, type) => {
                //         if (type === 'Null') s_barycenters.push(id);
                //     });
                //
                //     fifth_sixth_share_barycenter = _.intersection(f_barycenters, s_barycenters).length > 0;
                // }

                // let fifth_moon_count = moons.length;
                // let fifth_moon_names = _.map(moons, m => m.body_name).join(' ** ');

                let o = {
                    system_name,
                    ringed_count,
                    // ring_name: ringed.ring_name,
                    // is_second_planet,
                    // fifth_sixth_share_barycenter,
                    body_count: bodies.length,
                    stars_count: _.filter(bodies, {body_type: 'Star'}).length,
                    // fifth_moon_count,
                    // fifth_moon_names
                };
                suitables.push(o);
            }
            toCsv('probe.csv', suitables);
            console.log('DONE');
            process.exit(0);
        }); // then
}

function toCsv(filename, data) {
    let str = "";
    str += [
        `System Name`,
        `Ringed planets count`,
        // `2nd Ringed Planet Name`,
        // `Is ring 2nd planet`,
        `Body count`,
        `Star count`,
        // `Fifth planet moons count`,
        // `Fifth planet moons names`,
        // `Do 6th and 5th share a barycenter ?`
    ].join(',') + os.EOL;
    data.forEach(row => {
        str += [
            row.system_name,
            row.ringed_count,
            // row.ring_name,
            // row.is_second_planet,
            row.body_count,
            row.stars_count,
            // row.fifth_moon_count,
            // row.fifth_moon_names,
            // row.fifth_sixth_share_barycenter,
        ].join(',') + os.EOL;
    })
    fs.writeFileSync(filename, str);
}

function isNthBody(system_name, body_name, pos) {
    let suffix = body_name.split(system_name)[1];

    let matches = [
        `${system_name} ${pos}`,
        `${system_name} A ${pos}`,
        `${system_name} AB ${pos}`
    ];
    return matches.indexOf(body_name) > -1;

    // if (body_na)
    // if (!suffix) return false;
    //
    // if (suffix.match(pos)) return true;
    // if (suffix.match(`A ${pos}`)) return true;
    // if (suffix.match(`AB ${pos}`)) return true;
    //
    // return false;
}

p1();
