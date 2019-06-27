
let container = require('../../Container.js')
    .getInstance();
const expeRepo = container.get('ExpeditionsRepo');
const geoRepo = container.get('GeometryRepo');
const helper = container.get('HelperRepo');
const async = container.get('async');
const _ = container.get('lodash');
const fs = require('fs');
const os = require('os');
const knex = container.get('knex');
const edsm = container.get('EDSM_API');

let used_ips = [];
let done = -1;
let systems;
let tick = 100; // tick async each missing bodies
let empty = [];
let missing_bodies = [];
let pre_fss = [];

let systems_api_info = [];

expeRepo.getSystem('Sol')
    .then(_sol => {
        sol = _sol;
        return expeRepo.findSystemsAround(sol, 300);
    }).then(_systems => {
        systems = _systems;
        console.log('Around ok', systems.length, 'systems found');
        let ids = _.map(systems, s => s.id)
        let cmds = [
            // missingStarRadius(ids),
            missingBodies()
        ];
        return Promise.all(cmds);
    }).then(arr => {
        let uni = _.chain(arr)
        .flatten(arr)
        .uniqBy('system_name')
        .value();
        console.log(`${uni.length} results`);
        return fs.writeFileSync('edsm_incomplete.json', JSON.stringify(uni))
        console.log('EXITED');
        process.exit(0);
    });

function missingStarLuminosity(ids) {
    return knex('bodies')
        .where('system_id','in', ids)
        .where('type', 'Star')
        .whereNull('luminosity')
        .distinct('system_id')
        .leftJoin('systems', 'systems.id', 'bodies.system_id')
        .select('systems.name as system_name', 'bodies.name as body_name', 'bodies.sub_type as body_sub_type')
}

function missingStarRadius(ids) {
    return knex('bodies')
    .where('system_id','in', ids)
    .where('type', 'Star')
    .whereNull('radius')
    .distinct('system_id')
    .leftJoin('systems', 'systems.id', 'bodies.system_id')
    .select('systems.name as system_name', 'bodies.name as body_name', 'bodies.sub_type as body_sub_type', 'systems.x as x', 'systems.y as y', 'systems.z as z')
    .then(rows => {
        return _.map(rows, r => {
            return {
                system_name: r.system_name,
                reason: 'missing_star_radius',
                x: r.x,
                y: r.y,
                z: r.z
            };
        });
    });
}

function missingBodies() {
    let chunks = _.chunk(systems, tick);
    return newTorSessionNewIp()
        .then(() => {
            return async.eachLimit(chunks, 1, chunk  => {
                return handleChunk(chunk)
                    .then(out => out)
                    .catch(err => handleErrChunk(err, chunk));
            });
        }).then(() => {
            console.log('MISSING BODIES DONE =====');
            console.log(missing_bodies.length, 'missing_bodies');
            console.log(pre_fss.length, 'pre_fss');
            console.log(empty.length, 'empty');
            return pre_fss.concat(missing_bodies);
        }).catch(err => {
            console.log('MAIN CATCH, FATAL ERROR');
            console.log({err});
            process.exit(0);
        });
}

function timeout(w) {
    return new Promise((resolve, reject) => {
        console.log(`502 detected, waiting ${w / 1000}s`);
        setTimeout(() => {
            return resolve();
        }, w);
    });
}


function handleErrChunk(err, chunk) {
    return new Promise((resolve, reject) => {
        if (err == 429 || err == 502) {
            let cmds = [];
            if (err == 502) cmds.push(timeout(30000));
            return Promise.all(cmds)
            .then(() => newTorSessionNewIp())
            .then(() => {
                done = done - tick; // comptabilité :)
                console.log('RETRY');
                return handleChunk(chunk);
            }).then(() => resolve())
            .catch(err => {
                if (err == 502) {
                    timeout(45000)
                    .then(() => {
                        handleChunk(chunk)
                    }).then(() => newTorSessionNewIp())
                    .then(() => resolve())
                    .catch(err => reject(err));
                } else {
                    reject(err)
                }
            });
        } else {
            return reject(err);
        }
    });
}

function handleChunk(chunk) {
    return async.eachLimit(chunk, tick, sys => {
        return new Promise((resolve, reject) => {
            return edsm.systemBodies(sys.name)
            .then(data => {
                let o = {
                    system_name: sys.name,
                    x: sys.x,
                    y: sys.y,
                    z: sys.z
                };
                done++;
                if (done % 800 === 0 && done > 0) {
                    console.log(`~~~~~~~~${done}~~~~~~`);
                    console.log(((done / systems.length) * 100).toFixed(2), '% done');
                    console.log(missing_bodies.length, 'missing_bodies', _.get(_.last(missing_bodies), 'system_name'));
                    console.log(pre_fss.length, 'pre_fss', _.get(_.last(pre_fss), 'system_name'));
                    console.log(empty.length, 'empty', _.last(empty));
                    console.log('ok', done - (missing_bodies.length + pre_fss.length));
                }
                if (data.bodyCount === null || data.bodyCount === undefined) {
                    o.reason = 'pre_fss';
                    pre_fss.push(o);
                } else if (sysHasMissingBodies(data)) {
                    o.reason = 'missing_bodies';
                    missing_bodies.push(o);
                }
                return resolve(1);
            }).catch(err => {
                if (err === 'empty') {
                    empty.push(sys.name);
                    return resolve();
                }
                return reject(err);
            });
        });
    });
}

function sysHasMissingBodies(data) {
    let count = data.bodyCount;
    let bodies = _.get(data, 'bodies') || [];
    let all_have_bodyId = _.find(bodies
        , b => b.bodyId === null || b.bodyId === undefined) === undefined;
    let l;
    if (all_have_bodyId)
        l = _.uniqBy(bodies, b => b.bodyId);
    else
        l = _.uniqBy(bodies, b => b.name);

    return count > l;
}

function newTorSessionNewIp(level = 0) {
    return new Promise((resolve, reject) => {
        if (level > 10) return reject('MAX TOR LEVEL IP SEARCH REACHED');
        edsm.newTorSession()
        .then(() => {
            return getIp();
        }).then(ip => {
            let exists = used_ips.indexOf(ip) > -1;
            console.log(`ip [${ip}] already used :`, exists);
            let cmds = []
            if (exists) cmds.push(newTorSessionNewIp(level ++));
            else used_ips.push(ip);
            return Promise.all(cmds);
        }).then(() => resolve())
        .catch(err => reject(err));
    });
}

function getIp() {
    return new Promise((resolve, reject) => {
        return edsm.rq.request('https://api.ipify.org', (err, res, body) => {
            if (err) return reject(err);
            return resolve(body);
        });
    });
}


