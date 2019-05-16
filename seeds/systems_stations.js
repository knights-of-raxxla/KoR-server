const container = require('../app/Container.js')
    .getInstance();
const async = container.get('async');
const reader = container.get('StreamReader');
const _ = container.get('lodash');
const stations_edsm = './storage/stations.json';
let knex;
let all_count = 0;
let last_displayed_count = 0;
let start = Date.now();

let inserted =  0;

function insertStationsChunk(stations) {
    if (inserted % 1000 === 0) console.log(`inserted ${inserted} stations`);
    let now = new Date();
    return async.eachLimit(stations, 20, _station => {
        if (!isData(_station)) return;
        if (_.last(_station) === ",") _station = _station.slice(0, -1);
        else {
            console.log('Dernière ligne stations o/')
        }
        let station;
        try {
            station = JSON.parse(_station);
        } catch (e) {
            console.log("======== Debut d'erreur de parse =========")
            console.log(_station);
            console.log("======== Fin d'erreur de parse =========")
        }
        if (!station) return;

        return knex('systems')
            .where({edsm_id: station.systemId})
            .first()
            .then(sys => {
                if (!sys) return;
                inserted++;
                return knex('stations')
                    .insert({
                        name: station.name,
                        type: station.type,
                        body_id: 1,
                        location:  'test',
                        system_id: sys.id,
                        created_at: now
                    });
            });
    });
}

function isData(line) {
    return line.length > 1;
}

exports.seed = function(_knex, Promise) {
    knex = _knex;
    console.log('==== Seed des stations de EDSM ====');
    return reader.readFileLinesByChunk(stations_edsm
        , 280000, insertStationsChunk);
};
