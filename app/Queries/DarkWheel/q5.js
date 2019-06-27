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
const moment = require('moment');

const {query_s, query_gg, query_all} = require('./utils.js');
let file_name_prefix = moment().format('YYYY-MM-DD') + '_dw-300' + '_' + Date.now();

let t_tauri_name = 'T Tauri Star';
const type_m = require('./_type_m.js');
let sol;
let systems;
let systems_id;
let gaz_giants_info = [];

let res_a = [];
let res_b = [];

let center_system = 'Sol';
let center_distance = 300; // ly
expeRepo.getSystem(center_system)
    .then(_sol => {
        console.log(`Fetched ${center_system} system coordinates`);
        sol = _sol;
        return expeRepo.findSystemsAround(sol, center_distance);
    }).then(_systems => {
        systems = _systems;
        console.log(`${systems.length} systems around ${center_system} within ${center_distance} ly`);
        systems_id = _.map(systems, sys => sys.id);
        return query_all(systems_id);
    }).then(({res_a, res_b}) => {
        console.log(JSON.stringify(res_a.length, null, 4), 'Résultats A');
        console.log(JSON.stringify(res_b.length, null, 4), 'Résultats B');
        console.log(JSON.stringify(_.uniqBy(res_a, 'system_id').length), 'systems');
        console.log(file_name_prefix);
        toCsv(res_a, file_name_prefix + '.csv');
        process.exit(0);
    });


function toCsv(data, file) {
    let str =""
    fs.writeFileSync(file_name_prefix + '.json', JSON.stringify(data));
    str += [
        `System name`,
        `Distance from ${sol.name} (ly)`,
        `Counting moons of moons`,
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
        `Moon Star Diistance`,
        `Biggest Suitable Star Radius`,
        `8th Moon Name`,
        `8th Moon Distance from arrival (ls)`,
        `8th Moon Sub Type`,
        `8th Moon Surface Temperature (K)`,
        `8th Moon Radius`,
        `Star Types`,
        `Is populated`,
        `Has M or TT Star ?`,
        `Coldest M or TT Star temp.`,
        `Coldest M or TT Star lum.`,
        `Has Toroid Station`
    ].join(',') + os.EOL;
    data.forEach(row => {
        str += [
            row.system_name,
            row.distance_from_center,
            row.counting_moon_of_moons,
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
            row.possible_star.surface_temperature,
            row.moon_star_dist,
            row.biggest_star_radius,
            row.eight_moon.name,
            row.eight_moon.distance_from_arrival,
            row.eight_moon.sub_type,
            row.eight_moon.surface_temperature,
            row.eight_moon.radius,
            row.star_types,
            row.is_populated,
            row.m_or_tt,
            row.coldest_possible_star_temp,
            row.coldest_possible_star_luminosity,
            row.has_toroid
        ].join(',') + os.EOL;
    })
    fs.writeFileSync(file, str);
}

