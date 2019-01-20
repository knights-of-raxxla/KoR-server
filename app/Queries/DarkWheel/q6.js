/**
 * 5th query
 * Adds unpopulated systems to the params
 * Includes all types of Stars
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
let t_tauri_name = 'T Tauri Star';
const type_m = require('./_type_m.js');
let sol;
let systems;
let systems_id;
let gaz_giants_info = [];

let res_a = [];
let res_b = [];

function query(ids) {
    return knex('bodies')
        .where('system_id', 3914323) // Bered
        .groupBy('bodies.system_id')
        .count('id as count')
        .select('system_id')
        .having('count', '>', 9) // 8 moons + gaz giant + sun
        .where('system_id', 'in', q => {
            return q.from('bodies')
            .where('bodies.sub_type', 'in', gas_types)
            .select('system_id')
        }).where('system_id', 'in', q => {
            return q.from('bodies')
            .where('bodies.type', 'Star')
            .select('system_id')
        });
}

let center_system = 'Sol';
let center_distance = 250; // ly

query(systems_id).
    then(systems => {
        console.log(`found ${systems.length} with at least 1 star + 1 gaz giant + at least 10 bodies`);
        return async.eachLimit(systems, 10, system => {
            let q = `
            id in (SELECT id from bodies
                where system_id = '${system.system_id}' AND
                bodies.name like CONCAT(bodies.name, '%')
                GROUP BY id
                HAVING count(id) > 8)
            `;

            console.log(q);


            return knex('bodies')
                .where('system_id', system.system_id)
                .whereRaw(q)
                // .where('id', 'in', q => {
                //     return q.from('bodies').raw(`SELECT id from bodies where bodies.name like CONCAT(bodies.name, '%')`);
                //     return knex.raw(`SELECT id from bodies where bodies.name like CONCAT(bodies.name, '%')`);
                //     return knex.raw(`SELECT id from bodies where bodies.name like CONCAT(bodies.name, '%')`);
                //     return q.raw(`SELECT id from bodies where bodies.name like CONCAT(bodies.name, '%')`);
                //     // return q.from('bodies')
                //     //     .where('bodies.name', 'like', 'bodies.name%')
                //     //     .select('id')
                //     //     // .count('bodies.id as count')
                //     //     // .having('count', '>', 8)
                // })
            .then(d => {
                    console.log(d, 'd');
                    return gaz_giants_info.push(d);
                })
        });
    }).then(() => {
        console.log(gaz_giants_info);
        console.log(`${gaz_giants_info.length} of which have at least 8 moons around found the gaz giant`);
        let f_systems = _.map(gaz_giants_info, sys => sys.system_id);
        let results = [];
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
                'parents'])
            .then(bodies => {
                gaz_giants_info.forEach(gaz => {
                    // 1 - si pas 8 moon -> on dégage
                    let center = {name: gaz.body_name};
                    let eight_moon = {};
                    // let eight_moon = helper.findNthMoonLike(center, bodies);
                    if (!eight_moon) {
                        console.log(`no eight moon in ${center.name}`);
                        return;
                    }

                    let system_stars_count = 0;
                    let star_types = "-";
                    let m_or_tt = false;
                    let coldest_possible_star_temp = null;
                    let coldest_possible_star_luminosity = null;
                    let possible_stars = _.filter(bodies, b => {
                        if (b.system_id !== gaz.system_id) return false;
                        if (b.type !== 'Star') return false;
                        star_types += b.sub_type;
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
                    // if (!possible_stars.length) {
                    //     console.log(`no suitable star in ${center.name}`);
                    //     return;
                    // }
                    //
                    let biggest_star_radius ;
                    let possible_star = {};
                    if (possible_stars.length) {
                        biggest_star_radius = _.orderBy(possible_stars, 'radius', 'desc')[0].radius;
                        gaz.biggest_star_radius = biggest_star_radius;

                        possible_star = _.orderBy(possible_stars, s => {
                            return Math.abs(s.distance_from_arrival - gaz.body_distance_from_arrival);
                        }, 'asc')[0];
                        possible_star.temp_class = helper.getTypeMStarSubClass(possible_star.surface_temperature);
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
                console.log(JSON.stringify(res_a.length, null, 4), 'Résultats A');
                console.log(JSON.stringify(res_b.length, null, 4), 'Résultats B');
                toCsv(res_a, 'dw-all-edsm.csv');
                process.exit(0);
            });
    });


function toCsv(data, file) {
    let str =""
    str += [
        `System name`,
        `Distance from ${sol.name} (ly)`,
        `System stars count`,
        `System suitable stars count`,
        `Gas Body Name`,
        `Gas Body Surface Temperature (K)`,
        `Gas Sub Type`,
        `Gas distance from arrival (ls)`,
        `Gas has multiple stars ?`,
        `Gas star as orbit center ?`,
        `Gas orbit centers count`,
        `Gas orbital eccentricity`,
        `Gas semi major axis (ls)`,
        `Gas semi minor axis (ls)`,
        `Ref Star Name`,
        `Ref Star Sub Type`,
        `Ref Star Temp Class`,
        `Ref Star Distance from arrival (ls)`,
        `Ref Star Radius`,
        `Ref Star Luminosity`,
        `Ref Star Age`,
        `Ref Star Temperature`,
        `Biggest Suitable Star Radius`,
        // `8th Moon Name`,
        // `8th Moon Distance from arrival (ls)`,
        // `8th Moon Sub Type`,
        // `8th Moon Surface Temperature (K)`,
        // `8th Moon Radius`,
        `Star Types`,
        `Is populated`,
        `Has M or TT Star ?`,
        `Coldest M or TT Star temp.`,
        `Coldest M or TT Star lum.`,
    ].join(',') + os.EOL;
    data.forEach(row => {
        str += [
            row.system_name,
            row.distance_from_center,
            row.system_stars_count,
            row.suitable_stars_count,
            row.body_name,
            row.body_surface_temperature,
            row.body_sub_type,
            row.body_distance_from_arrival,
            row.multiple_stars,
            row.star_as_orbit_center,
            row.body_orbit_centers_count,
            row.body_orbital_eccentricity,
            geoRepo.auToLs(row.body_semi_major_axis),
            row.body_semi_minor_axis,
            row.possible_star.name,
            row.possible_star.sub_type,
            row.possible_star.temp_class,
            row.possible_star.distance_from_arrival,
            row.possible_star.radius,
            row.possible_star.luminosity,
            row.possible_star.age,
            row.biggest_star_radius,
            row.possible_star.surface_temperature,
            // row.eight_moon.name,
            // row.eight_moon.distance_from_arrival,
            // row.eight_moon.sub_type,
            // row.eight_moon.surface_temperature,
            // row.eight_moon.radius,
            row.star_types,
            row.is_populated,
            row.m_or_tt,
            row.coldest_possible_star_temp,
            row.coldest_possible_star_luminosity,

        ].join(',') + os.EOL;
    })
    fs.writeFileSync(file, str);
}

