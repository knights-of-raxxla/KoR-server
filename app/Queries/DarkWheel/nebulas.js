const $nebulas = require('./nebulas_data');
let container = require('../../Container.js')
    .getInstance();
const knex = container.get('knex');
const expeRepo = container.get('ExpeditionsRepo');
const geoRepo = container.get('GeometryRepo');
const helper = container.get('HelperRepo');
const async = container.get('async');
const _ = container.get('lodash');
const fs = require('fs');
const os = require('os');
const {query_all} = require('./utils.js');
const $prefix = 'dw-neb';
const $sep = ',';

let $summary = "";

let $buffer = [
    "Nebula",
    "System Name",
    "Body",
    "Has TT or M",
    "Body distance to arrival",
    "Ref Star Name",
    "Ref Star Sub Type",
    "Ref Star Radius",
    "Ref Star Temperature",
    "Ref Star Luminosity",
].join($sep) + os.EOL;

async.eachLimit($nebulas, 1, (nebula) => {
    let {name, x, y, z, range} = nebula;
    let coords = {
        x: x * 32,
        y: y * 32,
        z: z * 32
    };
    return expeRepo.findSystemsAround(coords, range)
        .then(systems => {
            console.log(systems.length, 'around', range, 'of', name);
            write_import_star(nebula, systems);
            return query_all(_.map(systems, s => s.id));
        }).then(({res_a, res_b}) => {
            let systems = res_a.concat(res_b);
            $buffer = writeMain($buffer, nebula, systems);
            return 1;
        });
}).then(() => {
    fs.writeFileSync(`${$prefix}-main.csv`, $buffer);
    fs.writeFileSync(`${$prefix}-summary.csv`, $summary);
    process.exit(1);
}).catch(err => {
    console.log({err});
    process.exit(1);
});

function writeMain(buffer, nebula, systems) {
    $summary += `${nebula.name}: ${systems.length} systems in ${nebula.range}ly range ${os.EOL}`;
    systems.forEach(sys => {
        buffer += [
            sys.system_name,
            sys.body_name,
            sys.body_distance_from_arrival,
            sys.possible_star.name,
            sys.possible_star.sub_type,
            sys.possible_star.radius,
            sys.possible_star.temp,
            sys.possible_star.luminosity
        ].join($sep) + os.EOL;
    });
    buffer += `==============${os.EOL}`;
    return buffer;
}

function write_import_star(nebula, systems) {
    let buff = "";
    systems.forEach(sys => {
        buff += sys.name + os.EOL;
    });
    return fs.writeFileSync(`${$prefix}-${nebula.name.replace(' ', '_')}-ImportStars.txt`, buff);
}

