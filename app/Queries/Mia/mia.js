
/**
 * # Request
 * 0. located 1100ly~ (+-200ls) away from alioth, preferably in the general direction of polaris
 * 1. K type orange star
 * 2. only star in the system
 * 3. first planet has ammonia atmosphere and a single sattelite
 * 4. and the rest of them probably too https://cdn.discordapp.com/attachments/382006664569815042/534435266367324200/unknown.png
 * so that would be - 3rd and 5th planets are gas giants
 *
 * ===============================================================
 *
 * # Implementation
 * This query starts by fetching all systems in EDSM that have at least a K type Star and an ammonia  planet
 * around 1500 ly of Alioth. I've decided to set aside the "preferably in the general direction of polaris" part for now.
 * Then the following columns are placed in the csv, with the appropriate tests, which can act as filters using MS Excel or Google Sheets.
 *
 *       `System Name`,                 name of the system
 *       `Bodies count`,                count of stars + planets
 *       `Stars count`,                 count of stars
 *       `Ammonia count`,               count of ammonia planets
 *       `Is first planet ammonia ?`,   assuming first name is either '1' 'A1' or 'AB 1', if it's a named planet this will fail but 'Has named planets' will be true (see below)
 *       `First planet moons count`,    Number of moons orbitting the first planet (see above)
 *       `First planet moons names`,    Names of those moons
 *       `Third planet type`,           ex: Class I gas giant
 *       `Fifth planet type`            ex: Class I gas giant
 *       `Has named planets ?`         if one planet doesnt fit the system name it is then considered a "named planet" (so not proc-generated)
 *
 */

let container = require('../../Container.js')
    .getInstance();
const knex = container.get('knex');
const expeRepo = container.get('ExpeditionsRepo');
const async = container.get('async');
const _ = container.get('lodash');
const fs = require('fs');
const os = require('os');

const k_types = [
    'K (Yellow-Orange) Star',
    'K (Yellow-Orange giant) Star'
];

const ammonia_types = [
    'Ammonia world',
    'Gas giant with ammonia-based life'
];


function getSystemsAroundAlioth() {
    expeRepo.getSystem('Alioth')
        .then(alioth => {
            return expeRepo.findSystemsAround(alioth, 1500)
        });
}

function query(ids) {
    return knex('bodies')
        .leftJoin('systems', 'bodies.system_id', 'systems.id')
        .where('bodies.type', 'Planet')
        .where('bodies.sub_type', 'in', ammonia_types)
        .whereIn('system_id', q => {
            return q.distinct('bodies.system_id').from('bodies')
                .where('bodies.sub_type', 'in', k_type)
                .where('bodies.system_id', 'in', ids);
        })
        .select('bodies.id as body_id')
        .select('bodies.name as body_name')
        .select('bodies.parents as body_parents')
        .select('bodies.body_id as body_body_id')
        .select('bodies.sub_type as body_sub_type')
        .select('systems.id as system_id')
        .select('systems.name as system_name')
        .select('systems.x as x')
        .select('systems.y as y')
        .select('systems.z as z');
}

getSystemsAroundAlioth()
    .then(ids => {
        return query(ids)
    }).then(bodies => {
        return knex('bodies')
            .where('system_id', 'in', _.map(bodies => b.system_id))
            .leftJoin('bodies.system_id', 'systems.id')
            .select('systems.name as system_name')
            .select('bodies.name as body_name')
            .select('bodies.type as body_type')
            .select('bodies.sub_type as body_sub_type')
    }).then(bodies => {
        let out = [];
        let systems = _.groupBy(bodies, b => b.system_id);
        _.forIn(systems, (bodies, system_id) => {
            let system_name = bodies[0].system_name;
            let body_count = bodies.length;
            let stars_count = _.filter(bodies, {type: 'Star'}).length;

            let has_named_planets = false;
            bodies.forEach(b => {
                if (has_named_planets) return;
                if (b.body_type === 'Planet' && !b.match(system_name)) has_named_planets = true;
            });


            let first_planet_p_names = [
                system_name + ' 1',
                system_name + ' A 1',
                system_name + ' AB 1',
            ];
            let first_planet = _.find(bodies, b => {
                let f = false;
                first_planet_p_names.forEach(n => {
                    if (f) return;
                    return _.find(bodies, {body_name: n})
                })
                return f;
            });

            let ammonia_count = _.filter(bodies, b => {
                return ammonia_types.indexOf(b.sub_type) > -1;
            }).length;

            let first_planet_is_ammonia = ammonia_types.indexOf(first_planet.sub_type) > -1;

            let first_planet_moons_count = 0;
            let first_planet_moons_names = "";
            if (first_planet) {
                let moons = _.filter(bodies, b => {
                    let spl = b.body_name.split(first_planet.body_name);
                    return spl.length > 0;
                });
                first_planet_moons_count = moons.length;
                first_planet_moons_names += _.map(moons, m => m.body_name).join(' ** ');
            }
            let third_planet = _.find(bodies, {body_name: system_name + ' 3'}) || {};
            let fifth_planet = _.find(bodies, {body_name: system_name + ' 5'}) || {};

            let third_planet_type = third_planet.sub_type;
            let fifth_planet_type = fifth_planet.sub_type;

            out.push({
                system_name: bodies[0].system_name,
                body_count,
                stars_count,
                ammonia_count,
                first_planet_is_ammonia,
                first_planet_moons_count,
                first_planet_moons_names,
                third_planet_type,
                fifth_planet_type,
                has_named_planets,
            });
        });
        console.log(`${out.length} systems found`);
        toCsv('mia.csv', out);
        process.exit(0);
    })

function toCsv(filename, data) {
    let str = "";
    str += [
        `System Name`,
        `Bodies count`,
        `Stars count`,
        `Ammonia count`,
        `Is first planet ammonia ?`,
        `First planet moons count`,
        `First planet moons names`,
        `Third planet type`,
        `Fifth planet type`,
        `Has named planets ?`
    ].join(',') + os.EOL;
    data.forEach(row => {
        str += [
            row.system_name,
            row.body_count,
            row.stars_count,
            row.ammonia_count,
            row.first_planet_is_ammonia,
            row.first_planet_moons_count,
            row.first_planet_moons_names,
            row.third_planet_type,
            row.fifth_planet_type,
            row.has_named_planets
        ].join(',') + os.EOL;
    })
    fs.writeFileSync(filename, str);
}

