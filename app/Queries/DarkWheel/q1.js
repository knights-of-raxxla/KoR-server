let container = require('../../Container.js')
    .getInstance();
const knex = container.get('knex');
const expeRepo = container.get('ExpeditionsRepo');
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
const type_m = require('./_type_m.js');
let sol;
let systems;
let systems_id;

function query(ids) {
    return knex('systems')
        .leftJoin('bodies', 'bodies.system_id', 'systems.id')
        .where('bodies.type', 'Planet')
        .where('bodies.sub_type', 'in', gas_types)
        // .where('systems.id', 'in', ids)
        .whereIn('systems.id', q => {
            return q.select('bodies.system_id').from('bodies')
                .where('bodies.sub_type', 'in', type_m)
                // .where('bodies.radius', '>', 2)
                .where('bodies.system_id', 'in', ids);
        });
        // .whereIn ('systems.id', q => {
        //     return q.distinct('bodies.system_id')
        //         .from('bodies')
        //         .where('type', 'in', type_m)
        //         // .where('bodies.radius', '>', 3)
        //         .where('bodies.system_id', 'in', ids)
        // });
}
expeRepo.getSystem('Sol')
    .then(_sol => {
        console.log('got sol');
        sol = _sol;
        return expeRepo.findSystemsAround(sol, 200);
    }).then(_systems => {
        systems = _systems;
        console.log(systems.length, 'systems filtered');
        systems_id = _.map(systems, sys => sys.id);
        return query(systems_id);
    }).then(bodies => {
        console.log(bodies.length, 'B');
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
    }).then(res => {
        console.log(res.length);
        console.log('done');
    });


