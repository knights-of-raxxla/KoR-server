
let container = require('../../Container.js')
    .getInstance();
const edsm = container.get('EDSM_API');
const knex = container.get('knex');
const async = container.get('async');
const rows = require('../../../storage/systemsWithCoordinates7days.json');
let failed = [];
let bodies_columns = require('../../../seeds/bodies_columns.js');
const _ = require('lodash');

console.log(`importing ${rows.length} systems`);

function getSystemByName(name) {
    return knex('systems')
    .where({name})
    .first();
}

function importSystem(row) {
    let imp  ={
        name: row.name,
        x: row.x,
        y: row.y,
        z: row.z,
        edsm_id: row.id
    };
    return new Promise((resolve, reject) => {
        return edsm.systemBodies(imp.name)
        .then(data => {
            console.log({data});
            let cmds = [];
            if (!data || !data.id) failed.push(row);
            else cmds.push(importFullData(imp, data));
            return Promise.all(cmds);
        }).then(out => {
            return resolve(1)
        }).catch(err => {
            console.log({err});
            failed.push(row);
            return resolve(0);
        });
    });
}

function importFullData(imp, data) {
    console.log('IMPORT FULL DATA');
    exit();
    return knex('systems')
    .insert(imp)
    .then(([system_id]) => {
        let bodies_ins = [];
        let bodies = data.bodies || [];
        let o = {system_id}
        let ins = [];
        bodies.forEach(body => {
            _.forIn(bodies_columns, (keys, col) => {
                // code pas beau
                if (keys.length === 1)
                    o[col] = body[keys[0]];
                else if (keys.length === 2)
                    o[col] = body[keys[0]] || body[keys[1]];
                else if (keys.length === 3)
                    o[col] = body[keys[0]] || body[keys[1]] || body[keys[2]];

                if (o[col] && typeof o[col] === 'object') o[col] = JSON.stringify(o[col]);
                o.created_at = Date.now();
                ins.push(o);
            });
        });
        console.log({ins});
        exit();

        return knex('bodies')
        .insert(ins);
    });
}

let chunks = _.chunk(rows, 400);

async.eachLimit(chunks, 1, rows => {
    return async.eachLimit(rows, 4, row => {
        return importSingle(row);
    });
}).then(() => {
    console.log(`${failed.length} failed`);
    process.exit(0);
}).catch(err => {
    console.log(`${failed.length} failed`);
    console.log({err});
    process.exit(1);
});

function importSingle(row) {
    return getSystemByName(row.name)
    .then(system => {
        let cmds = [];
        if (!system) cmds.push(importSystem(row));
        return Promise.all(cmds);
    });
}



