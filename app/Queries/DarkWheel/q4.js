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

let res_a = [];
let center_system = 'Sol';
let center_distance = 500; // ly
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
            .where('sub_type', 'in', type_m)
            .where('radius', '>', 1)
            .where('system_id', 'in', _.map(systems, s => s.id));
    }).then(_stars => {
        console.log(_stars.length, 'étoiles géantes M');
        res_a = _stars;
        res_a = _.map(res_a, row => {
            let sum = (Math.pow(row.x / 32  - sol.x / 32, 2) +
                Math.pow(row.y / 32 - sol.y / 32, 2) +
                Math.pow(row.z / 32 - sol.z / 32, 2));
            row.distance_from_center = Math.sqrt(sum).toFixed(2);
            return row;
        });

        console.log(res_a.length)
        return toCsv(res_a, 'q4-big-stars.csv');
    });

function toCsv(data, file) {
    let str="";
    str += [
        `Star name`,
        `Distance from ${sol.name} (ly)`,
        `Star radius`,
        `Star luminosity`,
        `Star temperature`
    ].join(',') + os.EOL;
    data.forEach(row => {
        str += [
            row.name,
            row.distance_from_center,
            row.radius,
            row.luminosity,
            row.surface_temperature
        ].join(',') + os.EOL;
    })
    fs.writeFileSync(file, str);
}

