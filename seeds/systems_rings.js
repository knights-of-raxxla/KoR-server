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
    rings = _.map(bodiesInfo, data => {
        if (data.rings && data.rings.length) {
            rings_insert.push({
                edsm_id: data.id,
                rings: _.map(data.rings, r => {
                    return {
                        name: r.name,
                        mass: r.mass,
                        outer_radius: r.outerRadius,
                        inner_radius: r.innerRadius,
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
            })
    });
}

function insertSystemsChunk(bodies) {
    return fetchSystemsIn(systems_edsm_ids)
        .then(rows => {
            return insertRings(rows);
        });
}

function isData(line) {
    return line.length > 1;
}

exports.seed = function(_knex, Promise) {
    knex = _knex;
  // Deletes ALL existing entries
  return knex('bodies').del()
    .then(function () {
        console.log('==== Seed des bodies de EDSM ====');
        return reader.readFileLinesByChunk(bodie_json_edsm
            , 5000, insertSystemsChunk);
    });
};
