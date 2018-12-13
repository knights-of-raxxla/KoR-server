const container = require('../../Container.js')
    .getInstance();
const expeRepo = container.get('ExpeditionsRepo');
const knex = container.get('knex');
const async = container.get('async');
const _ = container.get('lodash');
const fs = require('fs');

let gas_types = [
    'Class I gas giant',
    'Class II gas giant',
    'Class III gas giant',
    'Class IV gas giant',
    'Class V gas giant',
    'Gas giant with ammonia-based life',
    'Gas giant with water-based life',
    'Hellium-rich gas giant',
];
// let star_types = require('./star_types.js');
let star_types = require('./star_types_2.js');

let sol;
function findDarkWheelCodexSystems(systems_around) {
    let systems_around;
    let dw_systems = [];
    return knex('systems')
    .leftJoin('bodies', 'bodies.system_id', 'systems.id')
    .where('bodies.type', 'Planet')
    .where('bodies.sub_type', 'in', gas_types)
    .where('bodies.distance_from_arrival', '<=', 100)
    .where('systems.id', 'in', systems_around)
    // .whereIn('bodies.system_id', q => {
    //     return q.select('bodies.system_id').from('bodies')
    //     .where('bodies.sub_type', 'in', star_types)
    //     .where('bodies.system_id', 'in', systems_around);
    // })
    .select('bodies.id as body_id')
    .select('bodies.name as body_name')
    .select('systems.id as system_id')
    .select('systems.name as system_name')
    .select('systems.x as x')
    .select('systems.y as y')
    .select('systems.z as z')
    .select('bodies.distance_from_arrival as distance_from_arrival')
    .then(bodies => {
        return async.eachLimit(bodies, 10, body => {
            return knex('bodies')
                .where('name', 'like', body.body_name + '%')
                .where('bodies.system_id', body.system_id)
                .count('* as count')
                .then(([{count}]) => {
                    if (count > 8) dw_systems.push(body);
                    return 0;
                });
        });
    }).then(() => {
        return dw_systems;
    });
}
return expeRepo.getSystem('Sol')
    .then(_sol => {
        sol = _sol;
        return expeRepo.findSystemsAround(sol, 250);
    }).then(systems => {
        console.log(`filtered ${systems.length} systems`)
        console.log(`fetching bodies' data`);
        systems_around = systems.map(sys => sys.id);
        return expeRepo._checkAndFetchAllBodies(systems, 12);
    }).then(() => {
        console.log('bodies fetched');
        return findDarkWheelCodexSystems(systems_around);
    }).then(res => {
        console.log(`${res.length} results`);
        res = _.chain(res)
        .map(row => {
            let distance_2 = Math.pow(row.x - sol.x, 2) +
                Math.pow(row.y - sol.y, 2) +
                Math.pow(row.z - sol.z, 2);
            let distance = Math.sqrt(distance_2);
            row.distance = distance;
            return row;
        }).orderBy('distance_from_arrival', 'asc')
        .value();
        let file = 'dark-wheel-' + Date.now() + '.json';
        console.log('writing file ' + file);
        fs.writeFileSync(file, JSON.stringify(res, null, 4));
        console.log('done');
        return 1;
    }).catch(err => {
        throw new Error(err);
    });
