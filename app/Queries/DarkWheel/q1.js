let container = require('../../Container.js')
    .getInstance();
const knex = container.get('knex');
const expeRepo = container.get('ExpeditionsRepo');
const geoRepo = container.get('GeometryRepo');
const helper = container.get('HelperRepo');
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
        .select('bodies.semi_major_axis as body_semi_major_axis')
        .select('bodies.orbital_eccentricity as body_orbital_eccentricity')
        .select('bodies.parents as body_parents')
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
            // .where('sub_type', 'in', type_m)
            .select(['id', 'system_id', 'radius', 'type', 'sub_type', 'name', 'distance_from_arrival', 'semi_major_axis', 'orbital_eccentricity', 'parents'])
            .then(bodies => {
                gaz_giants_info.forEach(gaz => {
                    let center = {name: gaz.body_name};
                    let eight_moon = helper.findNthMoonLike(center, bodies);
                    // console.log(eight_moon.name + ' is 8th moon');
                    if (!eight_moon) {
                        console.log(`no eight moon in ${center.name}`);
                        return;
                    }

                    // si le parent de la gaz giant est une étoile
                    // let gaz_parents = JSON.parse(gaz.body_parents);
                    // if (gaz_parents) {
                    //     let has_star = _.find(gaz_parents, item => {
                    //         return item.hasOwnProperty('Star');
                    //     });
                    //     has_star = Boolean(has_star);
                    //     if (!has_star) {
                    //         console.log(`no star as parent for ${gaz.body_name}`);
                    //         return;
                    //     }
                    // }

                    let gaz_semi_minor_axis = geoRepo.semiMinorAxis(gaz.body_semi_major_axis
                        , gaz.body_orbital_eccentricity);
                    if (isNaN(gaz_semi_minor_axis)) throw new Error(2);

                    let min_distance = geoRepo.auToLs(gaz_semi_minor_axis - eight_moon.semi_major_axis);
                    gaz.eight_moon_min_distance = min_distance;
                    gaz.eight_moon = eight_moon.name;
                    if (Math.abs(min_distance < 100)) results.push(gaz);
                });
                results = _.chain(results)
                    .orderBy('eight_moon_min_distance')
                .value();
                return results;
            });
    }).then(results => {
        console.log(JSON.stringify(results, null, 4));
        console.log(results.length, 'systems found');
        console.log('done');
    });


