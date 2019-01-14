const container = require('../app/Container.js')
    .getInstance();
const reader = container.get('StreamReader');
const _ = container.get('lodash');
const systems_json_edsm = './storage/systemsWithCoordinates.json';
let knex;
let theo_tot_systems = Math.pow(10, 6) * 30;
let all_count = 0;
let last_displayed_count = 0;
let start = Date.now();

function insertSystemsChunk(systems) {
    systems = _.chain(systems)
        .map(_system => {
            if (!isData(_system)) return;
            if (_.last(_system) === ",") _system = _system.slice(0, -1);
            else {
                console.log('Dernière ligne o/')
            }
            let system;
            try {
                system = JSON.parse(_system);
            } catch (e) {
                console.log("======== Debut d'erreur de parse =========")
                console.log(_system);
                console.log("======== Fin d'erreur de parse =========")
            }
            if (!system) return;

            let name = system.name;
            let edsm_id = system.id;
            let x = system.coords.x * 32;
            let y = system.coords.y * 32;
            let z = system.coords.z * 32;
            let created_at = system.date;

            return {name, x, y, z, edsm_id, created_at};
        }).compact().value();
    all_count += systems.length;
    let curr_count = all_count - last_displayed_count;
    if (curr_count > 1000000) {
        last_displayed_count = all_count;
        let pourcent = (all_count / theo_tot_systems) * 100;
        let ecoule = (Date.now()  - start) / 1000 /  60;
        console.log(`Progression : ${pourcent.toFixed()} % | Temps écoulé : ${ecoule.toFixed(2)} minutes`);
    }
    return knex('systems').insert(systems);
}

function isData(line) {
    return line.length > 1;
}

exports.seed = function(_knex, Promise) {
    knex = _knex;
    console.log('==== Seed des systèmes de EDSM ====');
    return reader.readFileLinesByChunk(systems_json_edsm
        , 20000, insertSystemsChunk);
};
