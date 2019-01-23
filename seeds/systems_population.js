const container = require('../app/Container.js')
    .getInstance();
const async = container.get('async');
const reader = container.get('StreamReader');
const _ = container.get('lodash');
const population_json_edsm = './storage/systemsPopulated.json';
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
                console.log('Dernière ligne population o/')
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

            return system.id;
        }).compact().uniq().value();
    all_count += systems.length;
    return async.eachLimit(systems, 40, edsm_id => {
        return knex('systems')
            .where({
                edsm_id,
            }).update({is_populated: 1})
    });
}

function isData(line) {
    return line.length > 1;
}

exports.seed = function(_knex, Promise) {
    knex = _knex;
    console.log('==== Seed des populations de EDSM ====');
    return reader.readFileLinesByChunk(population_json_edsm
        , 280000, insertSystemsChunk);
};
