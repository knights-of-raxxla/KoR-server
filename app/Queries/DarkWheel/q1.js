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
let gaz_giants_info = [];

function query(ids) {
    // return knex('systems')
    //     .leftJoin('bodies', 'bodies.system_id', 'systems.id')
    return knex('systems')
        .leftJoin('bodies', 'bodies.system_id', 'systems.id')
        .where('bodies.type', 'Planet')
        .where('bodies.sub_type', 'in', gas_types)
        // .where('systems.id', 'in', ids)
        .whereIn('system_id', q => {
            return q.distinct('bodies.system_id').from('bodies')
                .where('bodies.sub_type', 'in', type_m)
                // .where('bodies.radius', '>', 2)
                .where('bodies.system_id', 'in', ids);
        })
        .select('bodies.id as body_id')
        .select('bodies.name as body_name')
        .select('bodies.distance_from_arrival as bodies_distance')
        .select('systems.id as system_id')
        .select('systems.name as system_name')
        .select('systems.x as x')
        .select('systems.y as y')
        .select('systems.z as z')
        .select('bodies.distance_from_arrival as distance_from_arrival')
        // .whereIn ('systems.id', q => {
        //     return q.distinct('bodies.system_id')
        //         .from('bodies')
        //         .where('type', 'in', type_m)
        //         // .where('bodies.radius', '>', 3)
        //         .where('bodies.system_id', 'in', ids)
        // });
}
let center_system = 'Sol';
let center_distance = 500;
expeRepo.getSystem(center_system)
    .then(_sol => {
        console.log(`Fetched ${center_system} system coordinates`);
        sol = _sol;
        return expeRepo.findSystemsAround(sol, center_distance);
    }).then(_systems => {
        systems = _systems;
        console.log(`${systems.length} systems around ${center_system} within ${center_distance} ly`);
        systems_id = _.map(systems, sys => sys.id);
        return query(systems_id);
    }).then(bodies => {
        console.log(`found ${bodies.length} with at least 1 star in filter and 1 gaz giant`);
        return async.eachLimit(bodies, 10, body => {
            return knex('bodies')
                .where('name', 'like', body.body_name + '%')
                .where('bodies.system_id', body.system_id)
                .count('* as count')
                .then(([{count}]) => {
                    if (count > 8) gaz_giants_info.push(body);
                    return 0;
                });
        });
    }).then(() => {
        console.log(`${gaz_giants_info.length} of which have at least 8 moons around found the gaz giant`);
        let f_systems = _.map(gaz_giants_info, sys => sys.system_id);
        let results = [];
        return knex('bodies')
            .where('system_id', 'in', f_systems)
            .where('sub_type', 'in', type_m)
            .select(['id', 'system_id', 'radius', 'type', 'sub_type', 'name', 'distance_from_arrival'])
            .then(stars => {
                console.log(`filtering distances w/ respective stars in ${stars.length} stars`);
                gaz_giants_info.forEach(gaz => {
                    let needle = {system_id: gaz.system_id};
                    let system_stars = _.filter(stars, {system_id: gaz.system_id});
                    system_stars.forEach( star => {
                        let distance = Math.abs(gaz.distance_from_arrival - star.distance_from_arrival);
                        if (distance < 600) {
                            gaz.star = star;
                            gaz.star_type = star.sub_type;
                            gaz.star_radius = star.radius;
                            gaz.distance_from_star = distance;
                            results.push(gaz);
                        }
                    });
                });

                console.log(`${results.length} étoiles dans le filtre avant filtre haute granularité`);
                results = _.chain(results)
                    .filter(res => {
                        if (res.distance_from_star  < 50) return true;
                        if (res.star_radius > 2) return true;
                        if (res.star_radius > 1 && res.distance_from_star < 320) return true;
                        return false;
                    }).orderBy('distance_from_star')
                .value();
                return results;
            });
    }).then(results => {
        console.log(JSON.stringify(results, null, 4));
        console.log(results.length, 'systems found');
        console.log('done');
    });


