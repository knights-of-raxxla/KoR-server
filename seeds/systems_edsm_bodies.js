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
let columns = {
    'name': ['name'],
    'body_id': ['bodyId'],
    'edsm_id': ['id'],
    'distance_from_arrival': ['distanceToArrival'],
    'is_landable': ['isLandable'],
    'type': ['type'],
    'sub_type': ['subType'],
    'parents': ['parents'],
    'mass': ['earthMasses', 'solarMasses'],
    'radius': ['solarRadius', 'radius'],
    'surface_temperature': ['surfaceTemperature'],
    'offset': ['offset'],
    "orbital_period": ["orbitalPeriod"],
    'semi_major_axis': ['semiMajorAxis'],
    "orbital_eccentricity": ["orbitalEccentricity"],
    "orbital_inclination": ["orbitalInclination"],
    "arg_of_periapsis": ["argOfPeriapsis"],
    "rotational_period": ["rotationalPeriod"],
    "rotational_period_tidally_locked": ["rotationalPeriodTidallyLocked"],
    "axial_tilt": ["axialTilt"],
    'is_main_star': ['isMainStar'],
    "is_scoopable": ["isScoopable"],
    "age": ["age"],
    'spectral_class': ['spectralClass'],
    "luminosity": ["luminosity"],
    "absolute_magnitude": ["absoluteMagnitude"],

    // planets
    'gravity': ['gravity'],
    'surface_pressure': ['surfacePressure'],
    "volcanism_type": ["volcanismType"],
    'atmosphere_type': ['atmosphereType'],
    'atmosphere_composition': ['atmosphereComposition'],
    'solid_composition': ['solidComposition'],
    "terraforming_state": ["terraformingState"],

    // sql
    'created_at': ['date'],
};

function fetchSystemsIn(bodiesInfo){
    let ids = _.map(bodiesInfo, b => b.systemId);
    let found;
    return knex('systems')
        .where('edsm_id', 'in', ids)
        .select('id')
        .select('edsm_id')
    .then(_found => {
        found = _found;
        let missing_systems = _.filter(bodiesInfo, b => {
                return !_.find(found, {edsm_id: b.systemId});
        });
        let insert_missing = _.map(missing_systems, data => {
            return {
                edsm_id: data.systemId,
                name: data.systemName
            };
        });
        if (insert_missing.length > 0) {
            return knex('systems').insert(insert_missing)
                .then(() => {
                    return fetchSystemsIn(missing_systems);
                }).then(new_found => {
                    return found.concat(new_found);
                });
        }
        return found;
    });
}

function insertSystemsChunk(bodies) {
    bodies = _.chain(bodies).map(_body => {
        if (!isData(_body)) return;
        if (_.last(_body) === ",") _body = _body.slice(0, -1);
        else console.log('Dernière ligne o/')
        let body;
        try {
            body = JSON.parse(_body);
        } catch (e) {
            console.log("======== Debut d'erreur de parse =========")
            console.log(_body);
            console.log("======== Fin d'erreur de parse =========")
            return;
        }
        return body;
    }).compact().value();

    let systems_edsm_ids = _.chain(bodies)
        .map(body => {
            return {
                systemId: body.systemId,
                systemName: body.systemName
            };
        }).uniqBy('systemId')
        .value();

    return fetchSystemsIn(systems_edsm_ids)
        .then(rows => {
            let rings = [];
            let inserts = _.chain(bodies)
                .map(body => {
                    let system_id = _.get(_.find(rows, {edsm_id: body.systemId}), 'id');
                    if (!system_id) {
                        console.log("======== Debut d'erreur de réconciliation =========")
                        console.log(body);
                        console.log("======== Fin d'erreur de réconciliation =========")
                        return;
                    }
                    if (body.rings && body.rings.length) {
                        rings.push({
                            edsm_id: body.id,
                            rings: body.rings
                        });
                    }

                    let o = {system_id}
                    _.forIn(columns, (keys, col) => {
                        // code pas beau
                        if (keys.length === 1)
                            o[col] = body[keys[0]];
                        else if (keys.length === 2)
                            o[col] = body[keys[0]] || body[keys[1]];
                        else if (keys.length === 3)
                            o[col] = body[keys[0]] || body[keys[1]] || body[keys[2]];

                        if (o[col] && typeof o[col] === 'object') o[col] = JSON.stringify(o[col]);
                    });
                    return o;

                }).compact().value();

            all_count += bodies.length;
            let curr_count = all_count - last_displayed_count;
            if (curr_count > 500000) {
                last_displayed_count = all_count;
                let ecoule = (Date.now()  - start) / 1000 /  60;
                let all_millions = all_count / (Math.pow(10, 6));
                console.log(`Progression : ${all_millions.toFixed(2)} millions bodies | Temps écoulé : ${ecoule.toFixed(2)} minutes`);
            }
            return knex('bodies').insert(inserts)
                .then(ids => {
                    return knex('bodies')
                        .where('edsm_id', 'in', _.map(rings, r => r.edsm_id))
                        .select(['id', 'edsm_id'])
                }).then(bodies => {
                    return async.eachLimit(rings, 30, ({edsm_id, rings}) => {
                        let body = _.find(bodies, {edsm_id});
                        let rings_ins = _.map(rings, r => {
                            return {
                                name: r.name,
                                body_id: body.id,
                                // mass: r.mass,
                                // outer_radius: r.outerRadius,
                                // inner_radius: r.innerRadius,
                                type: r.type,
                                created_at: new Date()
                            };
                        })
                        return knex('rings')
                            .insert(rings_ins)
                    });
                });
        });
}

function isData(line) {
    return line.length > 1;
}

exports.seed = function(_knex, Promise) {
    knex = _knex;
    // return Promise.all([]);
    console.log('==== Seed des bodies de EDSM ====');
    return reader.readFileLinesByChunk(bodie_json_edsm
        , 280000, insertSystemsChunk);
};
