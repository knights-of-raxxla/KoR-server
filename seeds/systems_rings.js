const container = require('../app/Container.js')
    .getInstance();
const reader = container.get('StreamReader');
const _ = container.get('lodash');
const bodie_json_edsm = './storage/bodies.json';
const async = require('async-q');


let all_count = 0;
let last_displayed_count = 0;
let start = Date.now();
let knex;

// à gauche les valeurs des clefs dans le dump json
// de EDSM

function insertRings(bodiesInfo){
    let rings_insert = [];
    bodiesInfo.forEach(_data => {
        if (!isData(_data)) return;
        if (_.last(_data) === ",") _data = _data.slice(0, -1);
        else {
            console.log('Dernière ligne population o/')
        }
        let data;
        try {
            data = JSON.parse(_data);
        } catch (e) {
            console.log("======== Debut d'erreur de parse =========")
            console.log(_data);
            console.log("======== Fin d'erreur de parse =========")
        }
        if (!data) return;
        if (data && data.rings && data.rings.length) {
            rings_insert.push({
                edsm_id: data.id,
                rings: _.map(data.rings, r => {
                    return {
                        name: r.name,
                        // mass: r.mass,
                        // outer_radius: r.outerRadius,
                        // inner_radius: r.innerRadius,
                        type: r.type,
                        created_at: new Date()
                    };
                })
            });
        }
    });


    return async.eachLimit(rings_insert, 10, data => {
        return knex('bodies')
            .where('edsm_id', data.edsm_id)
            .first()
            .then(body => {
                let rings = _.map(data.rings, r => {
                    r.body_id = body.id;
                    return r;
                });
                return knex('rings')
                    .insert(rings);
            }).catch(err  => {
                console.log('oops');
                console.log({err});
                throw new Error(err);
            });
    });
}

function isData(line) {
    return line.length > 1;
}

exports.seed = function(_knex, Promise) {
    knex = _knex;
    return Promise.all([]);
    console.log('==== Seed des rings de EDSM ====');
    return reader.readFileLinesByChunk(bodie_json_edsm
        , 5000, insertRings);
};
