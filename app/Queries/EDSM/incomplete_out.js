let incompletes_data = require('../../../edsm_incomplete.json');
let q5_data = require('../../../dw-all-stars-population.json');
let max_coord = 600;
let cube_size = 30;
const _ = require('lodash');
const os = require('os');
const sep = ';';
const fs = require('fs');

function make_cubes() {
    // 600x600x600 cube
    let big_cube_a = [-1 * max_coord / 2, max_coord / 2 * 1, -1 * max_coord / 2]
    // [-300, 300, -300]
    let big_cube = build_cube(big_cube_a, max_coord);
    let z_a = big_cube_a[2] * 1;
    let cubes = [];
    let x_a, y_a;
    let planes = 0;
    while (z_a < max_coord / 2) {
        planes ++;
        x_a = big_cube_a.slice(0)[0] * 1;
        while (x_a < max_coord / 2) {
            y_a = big_cube_a.slice(0)[1] *  1;
            while (y_a  > max_coord / 2 * -1) {
                let pt = [x_a * 1, y_a * 1, z_a * 1];
                cubes.push(build_cube(pt.slice(0), cube_size));
                y_a -= cube_size;
            }
            x_a += cube_size;
        }
        z_a += cube_size;
    }
    return cubes;
}

/**
 * builds a cube given its center
 * @param {Number[]} top left point of foreground face of cube
 * ex [10, 10, 10]
 * @return {Number} [] 8 points
 */
function build_cube(pt, cube_size) {
    let A = JSON.parse(JSON.stringify(pt));
    // TODO vérifier ca pt1
    return [
        A.slice(0),
        [A.slice(0)[0] + cube_size, A.slice(0)[1], A.slice(0)[2]],
        [A.slice(0)[0], A.slice(0)[1] - cube_size, A.slice(0)[2]],
        [A.slice(0)[0] + cube_size, A.slice(0)[1] - cube_size, A.slice(0)[2]],

        [A.slice(0)[0], A.slice(0)[1], A.slice(0)[2] + cube_size],
        [A.slice(0)[0] + cube_size, A.slice(0)[1], A.slice(0)[2] + cube_size],
        [A.slice(0)[0], A.slice(0)[1] - cube_size, A.slice(0)[2] + cube_size],
        [A.slice(0)[0] + cube_size, A.slice(0)[1] - cube_size, A.slice(0)[2] + cube_size],

    ];
}

function pt_in_cube(pt, cube) {
    let x_range = _.orderBy([cube[0][0], cube[1][0]], s => s, 'asc');
    let y_range = _.orderBy([cube[0][1], cube[2][1]], s => s, 'asc');
    let z_range = _.orderBy([cube[0][2], cube[4][2]], s => s, 'asc');

    return [
        pt[0] >= x_range[0] && pt[0] <= x_range[1],
        pt[1] >= y_range[0] && pt[1] <= y_range[1],
        pt[2] >= z_range[0] && pt[2] <= z_range[1],
    ].indexOf(false) === -1;
}

function distance_sol(cube) {
    let x_range = _.orderBy([cube[0][0], cube[1][0]], s => s, 'asc');
    let y_range = _.orderBy([cube[0][1], cube[2][1]], s => s, 'asc');
    let z_range = _.orderBy([cube[0][2], cube[4][2]], s => s, 'asc');

    let center = [
        _.sum(x_range) / x_range.length,
        _.sum(y_range) / y_range.length,
        _.sum(z_range) / z_range.length,
    ];
    let dist = Math.sqrt(Math.pow(center[0], 2) + Math.pow(center[1], 2) + Math.pow(center[2], 2));
    return dist;
}

let cubes = make_cubes();
let o = [];
let csv = "";
let i = 0;
let packet_i = 0;
let systems_count = 0;
console.log(`${cubes.length} cubes to check out.`);
let tot_count = q5_data.length + incompletes_data.length;

// cubes = _.map(cubes, coords => {
//     return {
//         coords,
//         systems: []
//     }
// });
//
// q5_data.concat(incompletes_data).forEach((sys, i) => {
//     if (parseInt(i) % 500 === 0)
//         console.log(i, 'systems');
//     let sys_cube_i = _.findIndex(cubes, cube => {
//         let coords = [sys.x / 32, sys.y / 32, sys.z / 32];
//         return pt_in_cube(coords, cube.coords);
//     });
//     if (sys_cube_i === -1) return false;
//
//     if (sys.reason) sys.task = 'incomplete data in EDSM please do a full FSS scan with an EDDN app plugged in.';
//     else sys.task =  sys.body_name + ' h';
//     cubes[sys_cube_i].systems.push(sys);
// });
//
// fs.writeFileSync('dw-packets.json', JSON.stringify(cubes));
let systems_per_cube = []

cubes =  require('../../../dw-packets.json');
let r = /\sf/
cubes = _.map(cubes, cube => {
    cube.systems = _.map(cube.systems, sys => {
        sys.task = sys.task.replace(r, ' h')
        console.log(sys.task);
        return sys;
        exit;
    });
    return cube;
});
cubes = _.orderBy(cubes, cube => {
    let dist = distance_sol(cube.coords);
    return dist;
}, 'asc')

cubes.forEach(({systems, coords}) => {
    if (!systems.length) return;
    packet_i ++;
    systems_per_cube.push(systems.length);
    let cube_name = `Packet #${packet_i} [${distance_sol(coords).toFixed()} ly to Sol] [${systems.length} systems]`;
    csv += cube_name + os.EOL;

    systems_count += systems.length;
    systems.forEach(sys => {
        let m_or_tt = '?';
        let m_or_tt_temp = '?';
        let m_or_tt_radius = '?';
        if (sys.hasOwnProperty('m_or_tt')) {
            m_or_tt = sys.m_or_tt;
            if (m_or_tt) {
                m_or_tt_temp = sys.coldest_possible_star_temp;
                m_or_tt_radius = sys.possible_star.radius
            }
        }
        csv += ["",
            sys.system_name,
            sys.task,
            m_or_tt,
            m_or_tt_temp,
            m_or_tt_radius
            ].join(sep) + os.EOL;
    });
    csv += '--------' + os.EOL;
});


// cubes.forEach(cube => {
//     if (i % 1000 === 0) console.log((i / cubes.length) * 100,
//     '%');
//     i++;
//     let incompletes = _.chain(incompletes_data)
//         .filter(sys => {
//             let coords = [sys.x / 32, sys.y / 32, sys.z / 32];
//             return pt_in_cube(coords, cube);
//         }).map(sys => {
//             return {
//                 system: sys.system_name,
//                 task: 'incomplete data in EDSM please do a full FSS scan with an EDDN app plugged in.',
//                 x: sys.x,
//                 y: sys.y,
//                 z: sys.z
//             };
//         }).value();
//
//     let fits = _.chain(q5_data)
//     .filter(sys => {
//         let coords = [sys.x / 32, sys.y / 32, sys.z / 32];
//         return pt_in_cube(coords, cube);
//     }).map(sys => {
//         return {
//             system: sys.system_name,
//             x: sys.x,
//             y: sys.y,
//             z: sys.z
//         };
//     }).value();
//
//     let systems  = _.chain(incompletes.concat(fits))
//         .orderBy('system', 'asc')
//         .uniqBy(sys => sys.system + '_' + sys.body_name)
//         .value();
//     systems_count += systems.length;
//     if (!systems.length) return
//     packet_i++;
// });
console.log({systems_count, tot_count});
fs.writeFileSync('dw-packets.csv', csv);
console.log((_.sum(systems_per_cube) / systems_per_cube.length).toFixed(), 'average sys. per cube');

