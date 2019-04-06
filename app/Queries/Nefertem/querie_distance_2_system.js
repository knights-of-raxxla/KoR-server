let container = require('../../Container.js')
    .getInstance();
const expeRepo = container.get('ExpeditionsRepo');
const process = require('process');
const _ = require('lodash');

let system_name_1 = "LP 29-188";
let system_name_2 = "Cephei Sector MC-V b2-2";
let system_1;

expeRepo.getSystem(system_name_1)
.then(_system => {
    console.log(`Fetched ${system_name_1} system coordinates`);
    system_1 = _system;
    return expeRepo.getSystem(system_name_2);
}).then(_system_2 => {
    let distance = Math.sqrt(Math.pow(system_1.x - _system_2.x, 2) +
        Math.pow(system_1.y - _system_2.y, 2) +
        Math.pow(system_1.z - _system_2.z, 2)) / 32;
    distance = distance.toFixed(2);
    console.log(`${distance} al between ${system_name_1} and ${system_name_2}`);
    process.exit();
});
