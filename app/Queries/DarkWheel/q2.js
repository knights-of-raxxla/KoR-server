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
    // 'Class I gas giant',
    // 'Class II gas giant',
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
        .select('bodies.surface_temperature as body_surface_temperature')
        .select('bodies.body_id as body_body_id')
        .select('bodies.sub_type as body_sub_type')
        .select('bodies.distance_from_arrival as body_distance_from_arrival')
        .select('systems.id as system_id')
        .select('systems.name as system_name')
        .select('systems.x as x')
        .select('systems.y as y')
        .select('systems.z as z');
}

let center_system = 'Sol';
let center_distance = 1000; // ly
let max_star_distance_from_gaz = 1000; //ls
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
                    let eight_moon = helper.findNthMoonLike(center, bodies);
                    if (!eight_moon) {
                        console.log(`no eight moon in ${center.name}`);
                        return;
                    }

                    let possible_stars = _.filter(bodies, b => {
                        if (b.system_id !== gaz.system_id) return false;
                        if (b.type !== 'Star') return false;
                        if (type_m.indexOf(b.sub_type) === -1) return false;
                        let rel_distance = Math.abs(b.distance_from_arrival - gaz.body_distance_from_arrival);
                        return rel_distance <= max_star_distance_from_gaz;
                    });
                    if (!possible_stars.length) return;
                    let possible_star = _.orderBy(possible_stars, s => {
                        return Math.abs(s.distance_from_arrival - gaz.body_distance_from_arrival);
                    }, 'asc')[0];

                    let multiple_stars = false;
                    if (helper.getBodyInfoByName(gaz.body_name, gaz.system_name)
                        .has_multiple_stars) multiple_stars = true;

                    possible_star.temp_class = helper.getTypeMStarSubClass(possible_star.surface_temperature);
                    gaz.multiple_stars = multiple_stars;

                    gaz.possible_star = possible_star;
                    gaz.eight_moon = eight_moon;
                    res_a.push(gaz);
                });
                res_a = _.map(res_a, row => {
                    let sum = (Math.pow(row.x / 32  - sol.x / 32, 2) +
                        Math.pow(row.y / 32 - sol.y / 32, 2) +
                        Math.pow(row.z / 32 - sol.z / 32, 2));
                    row.distance_from_center = Math.sqrt(sum).toFixed(2);
                    return row;
                });

                [res_a, res_b] = _.partition(res_a, row => {
                    return row.body_surface_temperature > 0;
                });
                res_a = _.orderBy(res_a, 'body_surface_temperature', 'desc');
                console.log(JSON.stringify(res_a, null, 4));
                console.log(JSON.stringify(res_a.length, null, 4), 'Résultats A');
                console.log(JSON.stringify(res_b.length, null, 4), 'Résultats B');
                toCsv(res_a, 'temperatures-sort.csv');
                process.exit(0);
            });
    });

function toCsv(data, file) {
    let str = [
        `===== PARAMETERS =====`,
        `Total rows : ${data.length}`,
        `Reference system: ${sol.name}`,
        `Area of search : ${center_distance} ly`,
        `Max distance from star ${max_star_distance_from_gaz} ls`,
        `Gas types ${gas_types.join(' +' )}`,
        `Ref star types : ${type_m.join(' + ')}`,
        `==========`,
        ``
    ].join(os.EOL);

    str += [
        `System name`,
        `Gas Body Name`,
        `Distance from ${sol.name} (ly)`,
        `Gas Body Surface Temperature (K)`,
        `Gas Sub Type`,
        `Gas distance from arrival (ls)`,
        `Gas has multiple stars ?`,
        `Ref Star Name`,
        `Ref Star Sub Type`,
        `Ref Star Temp Class`,
        `Ref Star Distance from arrival (ls)`,
        `Ref Star Radius`,
        `Ref Star Luminosity`,
        `Ref Star Age`,
        `Ref Star Temperature`,
        `8th Moon Name`,
        `8th Moon Distance from arrival (ls)`,
        `8th Moon Sub Type`,
        `8th Moon Surface Temperature (K)`,
        `8th Moon Radius`,
    ].join(',') + os.EOL;
    data.forEach(row => {
        str += [
            row.system_name,
            row.body_name,
            row.distance_from_center,
            row.body_surface_temperature,
            row.body_sub_type,
            row.body_distance_from_arrival,
            row.multiple_stars,
            row.possible_star.name,
            row.possible_star.sub_type,
            row.possible_star.temp_class,
            row.possible_star.distance_from_arrival,
            row.possible_star.radius,
            row.possible_star.luminosity,
            row.possible_star.age,
            row.possible_star.surface_temperature,
            row.eight_moon.name,
            row.eight_moon.distance_from_arrival,
            row.eight_moon.sub_type,
            row.eight_moon.surface_temperature,
            row.eight_moon.radius
        ].join(',') + os.EOL;
    })
    fs.writeFileSync(file, str);
}

