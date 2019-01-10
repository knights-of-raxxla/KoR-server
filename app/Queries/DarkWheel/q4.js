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

let suitable_systems = [];

let res_a = [];
let res_b = [];

let center_system = 'Sol';
let center_distance = 250; // ly
let cold_star_threshold = 2500;
expeRepo.getSystem(center_system)
    .then(_sol => {
        console.log(`Fetched ${center_system} system coordinates`);
        sol = _sol;
        return expeRepo.findSystemsAround(sol, center_distance);
    }).then(systems => {
        console.log(`${systems.length} systems around ${center_system} within ${center_distance} ly`);
        return knex('bodies')
            .where('type', 'Star')
            .where('sub_type', 'like', 'M %')
            .where('surface_temperature', '<', cold_star_threshold)
            .where('radius', '>', 1)
            .where('system_id', 'in', _.map(systems, s => s.id));
    }).then(_stars => {
        console.log(_stars.length, 'étoiles géantes M froides');
        return async.eachLimit(_stars, 10, star => {
            return knex('bodies')
                .leftJoin('systems', 'systems.id', 'bodies.system_id')
                .select('systems.x as x')
                .select('systems.y as y')
                .select('systems.z as z')
                .select('bodies.name as name')
                .select('bodies.surface_temperature as surface_temperature')
                .select('bodies.luminosity as luminosity')
                .select('bodies.sub_type as sub_type')
                .where('bodies.system_id', star.system_id)
                .where('bodies.sub_type', 'in', gas_types)
                .count('* as count')
                .then(([{count}]) => {
                    if (count > 0) {
                        star.gaz_giant_count = count;
                        suitable_systems.push(star);
                    }
                })
        });
    }).then(() => {
        res_a = suitable_systems;
        res_a = _.map(res_a, row => {
            let sum = (Math.pow(row.x / 32  - sol.x / 32, 2) +
                Math.pow(row.y / 32 - sol.y / 32, 2) +
                Math.pow(row.z / 32 - sol.z / 32, 2));
            row.distance_from_center = Math.sqrt(sum).toFixed(2);
            return row;
        });
        console.log(res_a);
        console.log(res_a.length)
    });


//
//                 // [res_a, res_b] = _.partition(res_a, row => {
//                 //     return row.body_surface_temperature > 0;
//                 // });
//                 res_a = _.orderBy(res_a, 'body_surface_temperature', 'desc');
//                 // console.log(JSON.stringify(res_a, null, 4));
//                 console.log(JSON.stringify(res_a.length, null, 4), 'Résultats A');
//                 console.log(JSON.stringify(res_b.length, null, 4), 'Résultats B');
//                 toCsv(res_a, 'temperatures-sort-all-distances-large-cold-stars.csv');
//                 process.exit(0);
//             });
//     });
//
// function toCsv(data, file) {
//     let str = [
//         `===== PARAMETERS =====`,
//         `Total rows : ${data.length}`,
//         `Reference system: ${sol.name}`,
//         `Area of search : ${center_distance} ly`,
//         // `Max distance from star ${max_star_distance_from_gaz} ls`,
//         `Gas types ${gas_types.join(' +' )}`,
//         `Ref star types : ${type_m.join(' + ')}`,
//         `==========`,
//         ``
//     ].join(os.EOL);
//
//     str += [
//         `System name`,
//         `Distance from ${sol.name} (ly)`,
//         `System stars count`,
//         `System suitable stars count`,
//         `Gas Body Name`,
//         `Gas Body Surface Temperature (K)`,
//         `Gas Sub Type`,
//         `Gas distance from arrival (ls)`,
//         `Gas has multiple stars ?`,
//         `Gas star as orbit center ?`,
//         `Gas orbit centers count`,
//         `Gas orbital eccentricity`,
//         `Gas semi major axis (ls)`,
//         `Gas semi minor axis (ls)`,
//         `Ref Star Name`,
//         `Ref Star Sub Type`,
//         `Ref Star Temp Class`,
//         `Ref Star Distance from arrival (ls)`,
//         `Ref Star Radius`,
//         `Ref Star Luminosity`,
//         `Ref Star Age`,
//         `Ref Star Temperature`,
//         `Biggest Suitable Star Radius`,
//         `Cold Stars Count`,
//         `Coldest star temp`,
//         `Cold Stars Luminosities`,
//         `Has T Tauri Star ?`,
//         `8th Moon Name`,
//         `8th Moon Distance from arrival (ls)`,
//         `8th Moon Sub Type`,
//         `8th Moon Surface Temperature (K)`,
//         `8th Moon Radius`,
//     ].join(',') + os.EOL;
//     data.forEach(row => {
//         str += [
//             row.system_name,
//             row.distance_from_center,
//             row.system_stars_count,
//             row.suitable_stars_count,
//             row.body_name,
//             row.body_surface_temperature,
//             row.body_sub_type,
//             row.body_distance_from_arrival,
//             row.multiple_stars,
//             row.star_as_orbit_center,
//             row.body_orbit_centers_count,
//             row.body_orbital_eccentricity,
//             geoRepo.auToLs(row.body_semi_major_axis),
//             row.body_semi_minor_axis,
//             row.possible_star.name,
//             row.possible_star.sub_type,
//             row.possible_star.temp_class,
//             row.possible_star.distance_from_arrival,
//             row.possible_star.radius,
//             row.possible_star.luminosity,
//             row.possible_star.age,
//             row.possible_star.surface_temperature,
//             row.biggest_star_radius,
//             row.cold_stars_count,
//             row.coldest_star_temp,
//             row.cold_star_luminosities,
//             row.has_t_tauri,
//             row.eight_moon.name,
//             row.eight_moon.distance_from_arrival,
//             row.eight_moon.sub_type,
//             row.eight_moon.surface_temperature,
//             row.eight_moon.radius
//         ].join(',') + os.EOL;
//     })
//     fs.writeFileSync(file, str);
// }

