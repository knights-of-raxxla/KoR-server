const container = require('../app/Container.js')
    .getInstance();
const reader = container.get('StreamReader');
const _ = container.get('lodash');
const systems_csv = './storage/systems.csv';
let knex;
let is_first_chunk = true;
// setInterval(() => {
//     console.log(`inserted ${inserted_count} systems`);
// }, 15 * 1000);

let columns = [
    'id',
    "edsm_id",
    "name",
    "x",
    "y",
    "z",
    "population",
    "is_populated",
    "government_id",
    "government",
    "allegiance_id",
    "allegiance",
    "state_id",
    "state",
    "security_id",
    "security",
    "primary_economy_id",
    "primary_economy",
    "power",
    "power_state",
    "power_state_id",
    "needs_permit",
    "updated_at",
    "simbad_ref",
    "controlling_minor_faction_id",
    "controlling_minor_faction",
    "reserve_type_id",
    "reserve_type"
];

function getColIndex(str) {
    return columns.indexOf(str);
}

function insertSystemsChunk(systems) {
    let created_at = Date.now();
    systems = _.map(systems, system => {
        system = system.split(',');
        let name = system[getColIndex('name')].split('"').join('');
        let edsm_id = system[getColIndex('edsm_id')];
        let eddb_id = system[getColIndex('id')];
        let x = system[getColIndex('x')];
        let y = system[getColIndex('y')];
        let z = system[getColIndex('z')];
        return {name, x, y, z, edsm_id, eddb_id, created_at};
    });
    if (is_first_chunk) {
        systems.shift();
        is_first_chunk = false;
    }
    // inserted_count += systems.length;
    return knex('systems').insert(systems);
}

exports.seed = function(_knex, Promise) {
    return new Promise(resolve => resolve(1));
  //   knex = _knex;
  // // Deletes ALL existing entries
  // return knex('systems').del()
  //   .then(function () {
  //       return reader.readFileLinesByChunk(systems_csv
  //           , 1, insertSystemsChunk);
  //   });
};
