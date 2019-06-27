const container = require('../../Container.js')
    .getInstance();
const knex = container.get('knex');
const _ = container.get('lodash');
const fs = require('fs');
let star_types = [
    'O (Blue-White) Star', //0
    'K (Yellow-Orange) Star',
    'M (Red dwarf) Star', // 2
    'L (Brown dwarf) Star',
    'F (White) Star',
    'Black Hole',
    'Y (Brown dwarf) Star',
    'T (Brown dwarf) Star',
    'G (White-Yellow) Star',
    'B (Blue-White) Star',
    'A (Blue-White) Star',
    'T Tauri Star', // 11
    'A (Blue-White super giant) Star',
    'Wolf-Rayet O Star',
    'White Dwarf (DA) Star',
    'K (Yellow-Orange giant) Star', // 15
    'Neutron Star',
    'MS-type Star',// 17
    'S-type Star',
    'M (Red giant) Star', // 19
    'C Star', // 20
    'M (Red super giant) Star', // 21
    'G (White-Yellow super giant) Star',
    'White Dwarf (DC) Star',
    'Herbig Ae/Be Star', // 24
    'CN Star', // 25
    'B (Blue-White super giant) Star', // 26
    'Wolf-Rayet Star',
    'Supermassive Black Hole',
    'Wolf-Rayet C Star', // 29
    'White Dwarf (DCV) Star',
    'White Dwarf (DAB) Star',
    'White Dwarf (D) Star',
    'Wolf-Rayet NC Star',
    'White Dwarf (DBV) Star',
    'White Dwarf (DB) Star',
    'F (White super giant) Star',
    'White Dwarf (DAV) Star',
    'White Dwarf (DAZ) Star',
    'White Dwarf (DQ) Star',
    'Wolf-Rayet N Star',
    'CJ Star', // 41
    'White Dwarf (DBZ) Star'
];

let $argv = process.argv.slice(2);
let $args = {type: null, center: null, stairs: 220};

$argv.forEach(arg => {
    let v = arg.split('=');
    let var_name = v[0];
    let var_value = v[1];
    $args[var_name] = var_value;
});
let $selected_type = star_types[$args.type];
console.log(`You have selected ${$selected_type}`);

let $selected_types = [
    star_types[2], // M
    star_types[19], // M
    star_types[21], // M Super giant
    star_types[22], // G
    star_types[11], // T Tauri
    star_types[15], // K giants
    star_types[1], // K
    star_types[17], // MS
    star_types[20], // C
    star_types[24], // Herbig
    star_types[25], // CN
    star_types[41], // CJ
    star_types[18], // S
    star_types[29], // WR
    star_types[27], // WR
    star_types[33], // WRNC
    star_types[18], // S
];

console.log($selected_types);

let $center;

function getCenter() {
    return knex('systems')
        .where('name', $args.center)
        .select(['name', 'x', 'y', 'z'])
        .first();
}

function getStars() {
    return knex('bodies')
        .where('type', 'Star')
        .whereNotNull('bodies.luminosity')
        .whereNotNull('systems.x')
        .whereNotNull('systems.y')
        .whereNotNull('systems.z')
        .leftJoin('systems', 'systems.id', 'bodies.system_id')
        .select('systems.name as system_name')
        .select('bodies.name as body_name')
        .select('bodies.surface_temperature as surface_temperature')
        .select('bodies.radius as radius')
        .select('bodies.luminosity as luminosity')
        .select('systems.x as x')
        .select('systems.y as y')
        .select('systems.z as z')
        .select('bodies.sub_type as sub_type')
        .select('bodies.type as type')
        .select('systems.edsm_id as edsm_id')
        .select('systems.eddb_id as eddb_id')
        // .limit(1500) // testing
        .where('bodies.sub_type', 'in', $selected_types)
        .then(bodies => {
            console.log(bodies.length, 'bodies requested');
            bodies = _.chain(bodies)
            .orderBy(b => b.surface_temperature, 'asc')
            .groupBy(b => b.type + '_' + b.luminosity + '_' + b.sub_type)
            .value();
            return bodies;
        });
}

function makeStarChunks(luminosities) {
    let out = {};
    _.forIn(luminosities, (bodies, lum) => {
        let coldest = bodies[0];
        let hottest = _.last(bodies);

        let o_temps = [];
        let o_bodies = [[]];
        let s = bodies[0].surface_temperature + $args.stairs;
        o_temps.push(s);
        let push_i = 0;
        bodies.forEach((body, i) => {
            if (body.surface_temperature  <= s)
                o_bodies[push_i].push(body);
            else {
                let diff_ok = false;
                while (diff_ok === false) {
                    s += $args.stairs;
                    if (body.surface_temperature  <= s) {
                        o_temps.push(s);
                        push_i ++;
                        o_bodies.push([]);
                        o_bodies[push_i].push(body)
                        diff_ok = true;
                    }
                }
            }
        });
        out[lum] = {bodies_grps: o_bodies, temps: o_temps};
    });
    return out;
}

// TODO changer ca pour calculer directemnt la distance la plus petite
// function generatePaths(grps, i = 0, paths = []) {
//     console.log(i);
//     if (!grps[i]) return paths;
//     let grps_l = grps[i].length;
//     if (!paths.length) {
//         for (let k = 0; k < grps_l; k++) {
//             paths.push(grps[k]);
//         }
//     } else {
//         let new_paths = [];
//         let paths_l = paths.length;
//         for (let l = 0; l < grps_l; l++) {
//             for (let j = 0; j < paths_l; j ++) {
//                 if (!paths[j]) continue;
//                 let p = paths[j].slice();
//                 p.push(grps[i][l]);
//                 new_paths.push(p);
//             }
//         }
//         paths = new_paths;
//         new_paths = [];
//     }
//     i += 1;
//     return generatePaths(grps, i, paths);
// }

// function buildPowerSet(chars) {
//     var result = [];
//     var f = function(prefix, chars) {
//         for (var i = 0; i < chars.length; i++) {
//             result.push(prefix + chars[i]);
//             f(prefix + chars[i], chars.slice(i + 1));
//         }
//     };
//     f('', chars);
//     return result;
// }

// function buildPowerSet(ary) {
//     var ps = [[]];
//     for (var i=0; i < ary.length; i++) {
//         for (var j = 0, len = ps.length; j < len; j++) {
//             ps.push(ps[j].concat(ary[i]));
//         }
//     }
//     return ps;
// }
//
// function perm(xs) {
//     let ret = [];
//
//     for (let i = 0; i < xs.length; i = i + 1) {
//         let rest = perm(xs.slice(0, i).concat(xs.slice(i + 1)));
//
//         if(!rest.length) {
//             ret.push([xs[i]])
//         } else {
//             for(let j = 0; j < rest.length; j = j + 1) {
//                 ret.push([xs[i]].concat(rest[j]))
//             }
//         }
//     }
//     return ret;
// }
//
// var permutation = function (collection){
//     var current,
//     subarray,
//     result = [],
//     currentArray = [],
//     newResultArray = [];
//
//     if (collection.length){
//         current = collection.shift();
//         result = permutation(collection);
//
//         currentArray.push(current);
//
//         result.map(function(list) {
//             newResultArray.push(list.slice(0));
//             list.push(current);
//         });
//
//         result.push(currentArray);
//         result = result.concat(newResultArray);
//     }
//
//     return result;
// };

function generateShortestPath(luminosities) {
    let flat_grps = [];
    _.forIn(luminosities, ({bodies_grps}, grp_i) => {
        // if (grp_i === 0)
        //     bodies_grps = bodies_grps.slice(0, 5); // 5 coldest
        // else if (grp_i == bodies_grps.length - 1)
        //     bodies_grps = bodies_grps.slice(bodies_grps.length - 6); // 5 warmest
        flat_grps.push(...bodies_grps);
    });
    $total_stops = flat_grps.length;
    return makeOrderedRoute(flat_grps, $center);
}

function makeSystemUniqueId(sys) {
    return sys.body_name + '_' + sys.system_name;
}

function makeOrderedRoute(chunks, start) {
    let total_distance = 0;
    let route = [start];
    let rows = [];
    let forbidden_chunks = [];

    chunks.forEach((systems, chunk_i) => {
        systems.forEach(sys => {
            sys.chunk_i = chunk_i;
            rows.push(sys)
        });
    });

   while (route.length !== chunks.length) {
        let closest = _.chain(rows)
            .filter(row => {
                let is_forbidden = forbidden_chunks.indexOf(row.chunk_i) > -1;
                return !is_forbidden;
            }).map(row => {
                let distance = distance2Points(route[route.length - 1], row);
                return {distance, system: row};
            }).minBy(r => r.distance)
            .value();

        total_distance+= closest.distance;
        forbidden_chunks.push(closest.system.chunk_i);
        closest.system.rel_dist = closest.distance;
        route.push(closest.system);
   }
   return {total_distance, route};
}

// function makeOrderedRoute(systems) {
//     let total_distance = 0;
//     let route = [systems[0]];
//     let waypoint = systems[0]
//     for (let i = 1; i < systems.length; i++) {
//         let systems_current = _.filter(systems, (s, j) => {
//             let is_self = i === j
//             let is_taken = _.find(route, sys => {
//                 return makeSystemUniqueId(sys) === makeSystemUniqueId(s);
//             }) !== undefined;
//             return !is_self && !is_taken;
//         });
//
//         if (!systems_current.length) break;
//         let distances_to_i = _.map(systems_current, system => {
//             let distance = distance2Points(route[i-1], system);
//             return {distance, system};
//         });
//
//         let min_distance = _.minBy(distances_to_i, 'distance');
//         let min_distance_i = _.findIndex(systems, makeSystemUniqueId);
//         if (min_distance_i === -1) throw new Error('01');
//
//         route.push(min_distance.system);
//         total_distance += min_distance.distance;
//     }
//     return {route, total_distance};
// }


function distance2Points(a, b) {
    let sum = (Math.pow(b.x / 32  - a.x / 32, 2) +
        Math.pow(b.y / 32 - a.y / 32, 2) +
        Math.pow(b.z / 32 - a.z / 32, 2));
    return Math.sqrt(sum);
}


Promise.all([
    getCenter(),
    getStars()
]).then(([center, stars]) => {
    $center = center;
    let chunks = makeStarChunks(stars);
    let shortest = generateShortestPath(chunks);
    console.log(JSON.stringify(shortest, null, 4));
    console.log(`${shortest.route.length} stops`);
    let n = Date.now();
    fs.writeFileSync(`star_maps${n}.json`, JSON.stringify(shortest));
});






