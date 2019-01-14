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

function p1() {
    let suitables = [];
    knex('rings')
        .leftJoin('rings.body_id', 'bodies.id')
        .leftJoin('systems.system_id', 'bodies.system_id')
        .select('bodies.id as body_id')
        .select('bodies.name as body_name')
        .select('systems.name as system_name')
        .select('systems.x as system_x')
        .select('systems.y as system_y')
        .select('systems.z as system_z')
        .select('rings.name as ring_name')
        .then(rings => {
            return async.eachLimit(rings, 10, ring => {
                return knex('bodies')
                    .leftJoin('systems.id', 'bodies.system_id')
                    .select('bodies.name as body_name')
                    .select('systems.name as system_name')
                    .where('id', ring.body_id)
                    .then(bodies => {
                        let fifth = _.find(bodies, b => isNthBody(ring.system_name, b.body_name, 5)) || {};
                        let moons = [];
                        if (fifth) {
                            moons = _.find(bodies, b => {
                                let spl = b.body_name.split(fifth.body_name);
                                return spl.length > 0
                            });
                        }

                        let fifth_moon_count = moons.length;
                        let fifth_moon_names = _.map(moons, m => m.body_name).join(' ** ');

                        suitables.push({
                            system_name: ring.system_name,
                            ring_name: ring.body_name,
                            is_second_planet: isNthBody(ring, 2),
                            body_count: bodies.length,
                            stars_count: _.filter(bodies, {type: 'Star'}).length,
                            fifth_moon_count,
                            fifth_moon_names
                        });
                    });
            });
        });
}

function toCsv(filename, data) {
    let str = "";
    str += [
        `System Name`,
        `Ringed Planet Name`,
        `Is ring 2nd planet`,
        `Body count`,
        `Star count`,
        `Fifth planet moons count`,
        `Fifth planet moons names`
    ].join(',') + os.EOL;
    data.forEach(row => {
        str += [
            row.system_name,
            row.ring_name,
            row.is_second_planet,
            row.body_count,
            row.stars_count
            row.fifth_moon_count,
            row.fifth_moon_names
        ].join(',') + os.EOL;
    })
    fs.writeFileSync(filename, str);
}

function isNthBody(system_name, body_name, pos) {
    let suffix = body_name.split(system_name)[1];

    if (suffix.match(pos)) return true;
    if (suffix.match(`A ${pos}`)) return true;
    if (suffix.match(`AB ${pos}`)) return true;

    return false;
}

p1().then(data => {
    toCsv('probe.csv', data);
    process.exit(0);
});
