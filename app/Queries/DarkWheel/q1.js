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

let res_a = [];
let res_b = [];
let res_c = [];


function query(ids) {
    return knex('bodies')
        .leftJoin('systems', 'bodies.system_id', 'systems.id')
        .where('bodies.type', 'Planet')
        .where('bodies.sub_type', 'in', gas_types)
        .whereIn('system_id', q => {
            return q.distinct('bodies.system_id').from('bodies')
                .where('bodies.sub_type', 'in', type_m)
                .where('bodies.system_id', 'in', ids);
        })
        .select('bodies.id as body_id')
        .select('bodies.name as body_name')
        .select('bodies.semi_major_axis as body_semi_major_axis')
        .select('bodies.orbital_eccentricity as body_orbital_eccentricity')
        .select('bodies.orbital_inclination as body_orbital_inclination')
        .select('bodies.parents as body_parents')
        .select('bodies.body_id as body_body_id')
        .select('bodies.sub_type as body_sub_type')
        .select('bodies.distance_from_arrival as body_distance_from_arrival')
        .select('systems.id as system_id')
        .select('systems.name as system_name')
        .select('systems.x as x')
        .select('systems.y as y')
        .select('systems.z as z')
        .select('bodies.distance_from_arrival as distance_from_arrival')
}



let center_system = 'Sol';
let center_distance = 1000;
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
                .where('name', 'like', body.body_name + ' %')
                .where('bodies.system_id', body.system_id)
                .count('* as count')
                .then(([{count}]) => {
                    if (count > 7) gaz_giants_info.push(body);
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
            .select(['id',
                'system_id',
                'radius',
                'type',
                'sub_type',
                'name',
                'distance_from_arrival',
                'semi_major_axis',
                'orbital_eccentricity',
                'orbital_inclination',
                'body_id',
                'parents'])
            .then(bodies => {
                gaz_giants_info.forEach(gaz => {
                    // 1 - si pas 8 moon -> on dégage
                    let center = {name: gaz.body_name};
                    let eight_moon = helper.findNthMoonLike(center, bodies);
                    if (!eight_moon) {
                        console.log(`no eight moon in ${center.name}`);
                        return;
                    }

                    // 2 - si la géante gazeuse orbite autour de + 1 étoile -> on pousse dans res_b
                    if (helper.getBodyInfoByName(gaz.body_name, gaz.system_name).has_multiple_stars) {
                        gaz.reject_reason = 'multiple stars';
                        res_b.push(gaz);
                        return;
                    }

                    // 3 - on check que le parent immédiat de la géante gazeuse soit une étoile
                    // du bon type
                    // si parents === NULL -> infos dans EDSM non renseignées, on push dans res_c
                    let m_stars = _.filter(bodies, b => {
                        return b.system_id === gaz.system_id &&
                            b.type === 'Star'  &&
                            type_m.indexOf(b.sub_type) > -1
                    });
                    let m_stars_bodies_id = _.map(m_stars, s => s.body_id);
                    // si le parent de la gaz giant est une étoile
                    let gaz_parents = JSON.parse(gaz.body_parents);
                    if (!gaz_parents) { // NULL
                        let stars = helper.getBodyInfoByName(gaz.body_name, gaz.system_name).stars;
                        let parent_star;
                        if (stars[0] === '$main')parent_star = _.find(m_stars, {distance_from_arrival: 0});
                        else {
                            stars.forEach(star => {
                                if (parent_star) return;
                                let full_name = gaz.system_name + ' ' + star;
                                parent_star = _.find(m_stars, {name: full_name});
                            });
                        }
                        if (!parent_star) {
                            gaz.reject_reason = 'no parent in edsm';
                            res_c.push(gaz);
                            return;
                        }
                    }

                    let right_star = _.find(gaz_parents, g => {
                        return m_stars_bodies_id.indexOf(g.Star) > -1
                    });
                    if (!right_star) {
                        return;
                    }
                    if (right_star) {
                        let star_id = right_star.Star;
                        gaz.star = _.find(m_stars, {body_id: star_id});
                    }

                    let gaz_semi_minor_axis = geoRepo.semiMinorAxis(gaz.body_semi_major_axis
                        , gaz.body_orbital_eccentricity);
                    if (isNaN(gaz_semi_minor_axis)) throw new Error(2);
                    gaz_semi_minor_axis = geoRepo.auToLs(gaz_semi_minor_axis);
                    let moon_s_major_axis = geoRepo.auToLs(eight_moon.semi_major_axis);

                    let calc_method;
                    gaz.eight_moon_distance_from_arrival = eight_moon.distance_from_arrival;
                    gaz.eigth_moon_semi_major_axis = eight_moon.semi_major_axis;
                    gaz.eight_moon = eight_moon.name;
                    // if (gaz_semi_minor_axis > 0.01 || moon_s_major_axis > 0.01) {
                    //     calc_method = 'axis';
                    //     gaz.calc_method = calc_method;
                    //     let min_distance = helper.smallestDistance(gaz_semi_minor_axis, moon_s_major_axis,
                    //         gaz.body_orbital_inclination, eight_moon.orbital_inclination);
                    //     gaz.eight_moon_min_distance = min_distance;
                    //
                    //     // let min_distance = geoRepo.auToLs(gaz_semi_minor_axis - eight_moon.semi_major_axis);
                    //     if (Math.abs(min_distance < 100)) {
                    //         if (gaz.reject_reason === 'no parent in edsm') res_c.push(gaz);
                    //         else res_a.push(gaz);
                    //     }
                    // } else {
                        calc_method = 'difference_from_arrival';
                        gaz.calc_method = calc_method;
                        let rel_distance = Math.abs(gaz.eight_moon_distance_from_arrival - gaz.star.distance_from_arrival);
                        gaz.rel_distance = rel_distance;
                        if (rel_distance < 500) {
                            // if (gaz.reject_reason === 'no parent in edsm') res_c.push(gaz);
                            // else res_a.push(gaz);
                            res_a.push(gaz);
                        }
                    // }
                });
                return;
            });
    }).then(() => {
        console.log('===== Résultats A =====')
        console.log(JSON.stringify(res_a, null, 4));

        console.log('===== Résultats B =====')
        console.log(JSON.stringify(res_b, null, 4));

        console.log('===== Résultats C =====')
        console.log(JSON.stringify(res_b, null, 4));

        console.log(res_a.length, 'Résultats A');
        console.log(res_b.length, 'Résultats B');
        console.log(res_c.length, 'Résultats C');
        console.log('The END');
        process.exit(0);
    });


