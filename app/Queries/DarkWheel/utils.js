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
let t_tauri_name = 'T Tauri Star';
const type_m = require('./_type_m.js');
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
    'Water giant'
];

function query_gg(ids) {
    return knex('bodies')
        .leftJoin('systems', 'bodies.system_id', 'systems.id')
        .where('bodies.type', 'Planet')
        .where('bodies.sub_type', 'in', gas_types)
        .whereIn('system_id', q => {
            return q.distinct('bodies.system_id').from('bodies')
                .where('bodies.sub_type', 'in', gas_types)
                .where('bodies.system_id', 'in', ids);
        })
        .select('bodies.id as body_id')
        .select('bodies.name as body_name')
        .select('bodies.semi_major_axis as body_semi_major_axis')
        .select('bodies.orbital_eccentricity as body_orbital_eccentricity')
        .select('bodies.orbital_inclination as body_orbital_inclination')
        .select('bodies.parents as body_parents')
        .select('bodies.surface_temperature as body_surface_temperature')
        .select('bodies.body_id as body_body_id')
        .select('bodies.sub_type as body_sub_type')
        .select('bodies.distance_from_arrival as body_distance_from_arrival')
        .select('systems.id as system_id')
        .select('systems.name as system_name')
        .select('systems.x as x')
        .select('systems.y as y')
        .select('systems.z as z')
        .select('systems.is_populated as is_populated');
        // .select('bodies.rotational_period_tidally_locked as body_is_tidal_locked')
}

function query_s(ids) {
    return knex('bodies')
        .leftJoin('systems', 'bodies.system_id', 'systems.id')
        .where('bodies.type', 'Star')
        .where(q => {
            return q.where('bodies.sub_type', 'like', 'T (%')
            .orWhere('bodies.sub_type', 'like', 'Y (%')
            .orWhere('bodies.sub_type', 'like', 'L (%')
        })
        .whereIn('system_id', q => {
            return q.distinct('bodies.system_id').from('bodies')
                .where(q => {
                    return q.where('bodies.sub_type', 'like', 'T (%')
                    .orWhere('bodies.sub_type', 'like', 'Y (%')
                    .orWhere('bodies.sub_type', 'like', 'L (%')
                })
                .where('bodies.system_id', 'in', ids);
        })
        .select('bodies.id as body_id')
        .select('bodies.name as body_name')
        .select('bodies.semi_major_axis as body_semi_major_axis')
        .select('bodies.orbital_eccentricity as body_orbital_eccentricity')
        .select('bodies.orbital_inclination as body_orbital_inclination')
        .select('bodies.parents as body_parents')
        .select('bodies.surface_temperature as body_surface_temperature')
        .select('bodies.body_id as body_body_id')
        .select('bodies.sub_type as body_sub_type')
        .select('bodies.distance_from_arrival as body_distance_from_arrival')
        .select('systems.id as system_id')
        .select('systems.name as system_name')
        .select('systems.x as x')
        .select('systems.y as y')
        .select('systems.z as z')
        .select('systems.is_populated as is_populated');
}

function query_all(ids) {
    let gaz_giants_info = [];
    return Promise.all([
        query_s(ids),
        query_gg(ids)
    ]).then(out => {
        return _.chain(out)
        .flatten()
        .uniqBy('body_id')
        .value();
    }).then(bodies => {
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
        return getToroidStationSystems();
    }).then(toroids => {
        return format_bodies(gaz_giants_info, toroids);
    });
}

function getToroidStationSystems() {
    let types = ['Orbis Starport', 'Ocellus Starport'];
    return knex('stations')
        .where('type', 'in', types);
}

function hasToroidInOrbit(body, toroid_systems, toroid_systems_ids) {
    let system_id = body.system_id;
    let toroid_i = toroid_systems_ids.indexOf(system_id);
    if (toroid_i === -1) return false;
    let toroid = toroid_systems[toroid_i];
    return Math.abs(body.distance_from_arrival - toroid.distance_from_arrival) < 300; //ls
}

function getStraightMoons(gaz, bodies) {
    let gaz_body_name =  gaz.body_name
        .replace('+', '\\+')
        .replace('-', '\\-')
        .replace('(', '\\(')
        .replace(')', '\\)')
        .replace('[', '\\[')
        .replace(']', '\\]')
        .replace('*', '\\*')
        .replace('?', '\\?')
        .replace('$', '\\$')
        .replace('|', '\\|')

    let reg = `^${gaz_body_name}\\s[a-zA-Z]$`

    return _.filter(bodies, ({name}) => {
        return new RegExp(reg).test(name);
    });
}

function getVagueMoons(gaz, bodies) {
    let gaz_body_name = gaz.body_name;
    return _.filter(bodies,  ({name}) => {
        return name.split(gaz_body_name).length > 1;
    });
}


function format_bodies(gaz_giants_info, toroid_systems) {
    let toroid_systems_ids = _.map(toroid_systems, t => t.system_id);
    console.log(`${gaz_giants_info.length} of which have at least 8 moons around found the gaz giant`);
    let res_a = [];
    let res_b = [];
    let sol;
    return knex('systems')
    .where('name', 'Sol')
    .first()
    .then(_sol => {
        sol = _sol;
        let f_systems = _.map(gaz_giants_info, sys => sys.system_id);
        return knex('bodies')
            .where('system_id', 'in', f_systems)
            .select(['id',
                'system_id',
                'radius',
                'type',
                'sub_type',
                'name',
                'distance_from_arrival',
                'surface_temperature',
                'semi_major_axis',
                'orbital_eccentricity',
                'orbital_inclination',
                'age',
                'luminosity',
                'body_id',
                'parents'
            ]);
        }).then(bodies => {
            gaz_giants_info.forEach(gaz => {
                // 1 - si pas 8 moon -> on dégage

                let direct_moons = getStraightMoons(gaz, bodies);
                let counting_moon_of_moons = false;
                if (direct_moons.length < 8) {
                    direct_moons = getVagueMoons(gaz, bodies);
                    if (direct_moons.length  < 8) {
                        console.log(`no 8 moons in ${gaz.body_name}, (${direct_moons.length})`)
                        return;
                    } else counting_moon_of_moons = true;
                }
                let eight_moon = _.orderBy(direct_moons, 'name', 'asc')[7];
                let system_stars_count = 0;
                let star_types = "-";
                let m_or_tt = false;
                let coldest_possible_star_temp = null;
                let coldest_possible_star_luminosity = null;
                let possible_stars = _.filter(bodies, b => {
                    if (b.name === gaz.body_name) return false;
                    if (b.system_id !== gaz.system_id) return false;
                    if (b.type !== 'Star') return false;
                    star_types += b.sub_type + '-';
                    system_stars_count ++;
                    if (type_m.indexOf(b.sub_type) > -1 || b.sub_type === t_tauri_name) {
                        m_or_tt = true;
                        let temp = b.surface_temperature;
                        if (coldest_possible_star_temp === null || temp < coldest_possible_star_temp) {
                            coldest_possible_star_temp = temp;
                            coldest_possible_star_luminosity = b.luminosity;
                        }
                    }
                    return true;
                });
                let biggest_star_radius ;
                let possible_star = {};
                let moon_star_dist;
                if (possible_stars.length) {
                    // on enleve la 8eme moon des possible stars si c'est une étoile
                    biggest_star_radius = _.get(_.orderBy(possible_stars, 'radius', 'desc'), '[0].radius');
                    gaz.biggest_star_radius = biggest_star_radius;

                    possible_star = _.orderBy(possible_stars, s => {
                        return Math.abs(s.distance_from_arrival - gaz.body_distance_from_arrival);
                    }, 'asc')[0];
                    possible_star.temp_class = helper.getTypeMStarSubClass(possible_star.surface_temperature);
                    moon_star_dist = Math.abs(eight_moon.distance_from_arrival- possible_star.distance_from_arrival)
                }

                let multiple_stars = false;
                if (helper.getBodyInfoByName(gaz.body_name, gaz.system_name)
                    .has_multiple_stars) multiple_stars = true;

                let parents = JSON.parse(gaz.body_parents) || [];
                let star_as_orbit_center = false;
                parents.forEach(p => {
                    let keys = Object.keys(p);
                    if (keys.indexOf('Star') > -1) star_as_orbit_center = true;
                });

                gaz.counting_moon_of_moons = counting_moon_of_moons;

                let orbit_centers_count = parents.length;
                gaz.body_semi_minor_axis = geoRepo.semiMinorAxis(gaz.body_semi_major_axis
                    , gaz.body_orbital_eccentricity, {unit: 'ls'});

                gaz.star_as_orbit_center = star_as_orbit_center; // si on a "{Star:1}" dans body.parents
                gaz.multiple_stars = multiple_stars;

                gaz.body_orbit_centers_count = orbit_centers_count;
                gaz.possible_star = possible_star;
                gaz.suitable_stars_count = possible_stars.length;
                gaz.system_stars_count = system_stars_count;
                gaz.eight_moon = eight_moon;
                gaz.star_types = star_types;
                gaz.m_or_tt = m_or_tt;
                gaz.coldest_possible_star_temp = coldest_possible_star_temp;
                gaz.coldest_possible_star_luminosity = coldest_possible_star_luminosity;
                gaz.has_toroid = hasToroidInOrbit(gaz.eight_moon, toroid_systems, toroid_systems_ids);
                gaz.moon_star_dist = moon_star_dist;
                res_a.push(gaz);
            });

            res_a = _.map(res_a, row => {
                let sum = (Math.pow(row.x / 32  - sol.x / 32, 2) +
                    Math.pow(row.y / 32 - sol.y / 32, 2) +
                    Math.pow(row.z / 32 - sol.z / 32, 2));
                row.distance_from_center = Math.sqrt(sum).toFixed(2);
                return row;
            });

            res_a = _.orderBy(res_a, 'body_surface_temperature', 'desc');
            return {res_a, res_b}
    });
}

module.exports = {query_gg, query_s, query_all};

