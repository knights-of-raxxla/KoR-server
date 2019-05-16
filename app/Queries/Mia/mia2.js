
/**
 * # Request
 * 0. located 2100-2800 ls away from sol, preferably in the general direction of polaris
 * 1. K type orange star
 * 2. only star in the system
 * 3. first planet has ammonia atmosphere and a single sattelite
 * 4. and the rest of them probably too https://cdn.discordapp.com/attachments/382006664569815042/534435266367324200/unknown.png
 * so that would be - 3rd and 5th planets are gas giants
 *
 *
 * ===============================================================
 *
 * # Implementation
 *      - have only 1 star
 *   - The Star is a K-type star
 *   - Closest planet to star is either ammonia or gas giant with ammonia-base life
 *   - System has at least 2 gas giants
 *   - System has at least 11 bodies (including star)
 *   - System within 900ly and 1300ly of Alioth
 *
 */

let container = require('../../Container.js')
    .getInstance();
const knex = container.get('knex');
const expeRepo = container.get('ExpeditionsRepo');
const helper = container.get('HelperRepo');
const async = container.get('async');
const _ = container.get('lodash');
const fs = require('fs');
const os = require('os');

let args = process.argv;
let mode = args[2];

let gas_types = [
    'Class I gas giant',
    'Class II gas giant',
    'Class III gas giant',
    'Class IV gas giant',
    'Class V gas giant',
    'Gas giant with ammonia-based life',
    'Gas giant with water-based life',
    'Helium-rich gas giant',
    'Helium gas giant',
];

const k_types = [
    'K (Yellow-Orange) Star',
    'K (Yellow-Orange giant) Star'
];

const ammonia_types = [
    'Ammonia world',
    // 'Gas giant with ammonia-based life'
];

let sol_around_min = 2100;
let sol_around_max = 2800;
let center = 'Sol';

function getAroundAlioth() {
return expeRepo.getSystem(center)
    .then(_sol => {
        sol = _sol;
        return expeRepo.findSystemsAround(sol, sol_around_min)
    }).then(systems => {
        return expeRepo.findSystemsAround(sol, sol_around_max, _.map(systems, s => s.id))
    }).then(systems => {
        console.log(`${systems.length} systems between ${sol_around_min}-${sol_around_max} Ly of ${center}`);
        return query(_.map(systems, s => s.id))
    });
}

function aroundOther() {
    let n = 'Wredguia ZB-K b22-0';
    let radius = 500;
    return expeRepo.getSystem(n)
        .then(sys => {
            return expeRepo.findSystemsAround(sys, radius)
        }).then(systems => {
            console.log(systems.length, 'around', n, 'at', radius, 'ly');
            return query(_.map(systems, s => s.id))
        });
}

function query(ids) {
    return knex('bodies')
        .leftJoin('systems', 'bodies.system_id', 'systems.id')
        .leftJoin('bodies as bodies_2', 'bodies.system_id', 'bodies_2.system_id')
        .where('bodies.type', 'Planet')
        .where('bodies.sub_type', 'in', ammonia_types)
        .whereIn('bodies.system_id', q => {
            return q.distinct('bodies.system_id').from('bodies')
                .where('bodies.sub_type', 'in', k_types)
                .where('bodies.system_id', 'in', ids);
        })
        .select('bodies_2.id as body_id')
        .select('bodies_2.name as body_name')
        .select('bodies_2.parents as body_parents')
        .select('bodies_2.body_id as body_body_id')
        .select('bodies_2.sub_type as body_sub_type')
        .select('bodies_2.type as body_type')
        .select('bodies_2.distance_from_arrival as body_distance_from_arrival')
        .select('systems.id as system_id')
        .select('systems.name as system_name')
        .select('systems.x as x')
        .select('systems.y as y')
        .select('systems.z as z')
        .then(data => {
            fs.writeFileSync('./storage/mia2.json', JSON.stringify(data));
            return data;
        });
}

function toCsv(filename, data) {
    let str = "";
    str += [
        `System Name`,
        `Bodies count`,
        `Fully proc named`
    ].join(',') + os.EOL;
    data.forEach(row => {
        str += [
            row.system_name,
            row.body_count,
            row.all_proc_named,
        ].join(',') + os.EOL;
    })
    fs.writeFileSync(filename, str);
}

let sol;
let cmds = [];

if (mode !== 'fast') cmds.push(getAroundAlioth())
// if (mode !== 'fast') cmds.push(aroundOther())
Promise.all(cmds)
    .then(data => {
        let bodies;
        if (mode === 'fast') bodies = require('../../../storage/mia2.json');
        else bodies = data[0];
        console.log(`${bodies.length} in ammonia + K star filter`);
        let systems = _.groupBy(bodies, 'system_id');
        let l = Object.keys(systems).length;
        let suitables = [];
        for (let i = 0; i < l; i++) {
            if (i % 500 === 0) {
                let prct = i/l * 100;
                if (!isNaN(prct) && prct && typeof prct === 'number') {
                    console.log(`${prct} % scanned || found: ${suitables.length} || last: ${_.get(_.last(suitables), 'system_name')}`);
                }
            }
            let system_id = Object.keys(systems)[i];
            let bodies = systems[system_id]
            let system_name = bodies[0].system_name;

            if (bodies.length < 11) continue;

            let stars_count = _.filter(bodies, {body_type: 'Star'}).length;
            if (stars_count !== 1) continue;

            let bodies_by_distance = _.orderBy(bodies, ['body_distance_from_arrival'], ['asc']);
            let scnd_is_ammonia = ammonia_types.indexOf(bodies_by_distance[1].body_sub_type) > -1;
            if (!scnd_is_ammonia) {
                let bodies_meta = _.map(bodies, b => {
                    let meta = helper.getBodyPosition(system_name, b.body_name)
                    meta.body_name = b.body_name;
                    meta.body_sub_type = b.body_sub_type;
                    return meta;
                });
                let bodies_by_name = _.orderBy(bodies_meta, ['ref_stars', 'ref_stars_pos', 'rest'], ['asc', 'asc', 'asc']);
                scnd_is_ammonia = ammonia_types.indexOf(bodies_by_name[1].body_sub_type) > -1;
                if (!scnd_is_ammonia) continue;
                console.log('2nd ', system_name);

            }

            let all_proc_named = true;
            bodies.forEach(({body_name}) => {
                if (!all_proc_named) return;
                if (body_name.split(system_name).length < 2) all_proc_named = false;
            });

            let gas_count = _.filter(bodies, b => {
                return gas_types.indexOf(b.body_sub_type) > -1;
            }).length;

            // if (gas_count < 2) continue;
            if (gas_count !== 2) continue;

            // if (all_proc_named) {
            //     let bodies_meta = _.map(bodies, b => {
            //         let meta = helper.getBodyPosition(system_name, b.body_name)
            //         meta.body_name = b.body_name;
            //         meta.body_sub_type = b.body_sub_type;
            //         return meta;
            //     });
            //
            //
            //     let first_gas = gas_bodies[0];
            //     let second_gas = gas_bodies[1];
            //
            //     let first_gas_moons = _.filter(bodies, b => {
            //         return b.body_name.match(first_gas.body_name);
            //     });
            //
            //     let second_gas_moons = _.filter(bodies, b => {
            //         return b.body_name.match(second_gas.body_name);
            //     });
            //
            //     if (first_gas_moons.length !== 4 && second_gas_moons.length ===3) {
            //         console.log(`Perfect match ${system_name}`);
            //     }
            // }

            suitables.push({
                system_name,
                body_count: bodies.length,
                stars_count,
                all_proc_named,
            });
        }

        console.log(suitables.length + ' results');
        console.log(_.map(suitables,s => s.system_name));
        console.log(suitables);

        toCsv('mia.csv', suitables);
        console.log('done');
        process.exit(0);
    })


