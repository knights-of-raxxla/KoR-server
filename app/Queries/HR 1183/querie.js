let container = require('../../Container.js')
    .getInstance();
const expeRepo = container.get('ExpeditionsRepo');
const os = require('os');
const fs = require('fs');
const _ = require('lodash');

// Triangulation 1
// let system = "HR 1183";
// let system_2 = "HIP 19847"
// let system_2 = "Pleiades sector HR-W D1-79";
// let distance = 58.5; //al
// let distance_2 = 16.5;
// let distance_2 = 62.5;

// Triangulation 2
let system = "Pleione";
let system_2 = "HIP 19072";
let distance = 45; //al
let distance_2 = 40.5;

let obj_system, obj_system_2, obj_system_3;
let range = 2.5
let sys_1, sys_2, sys_3;
let sys_tri_1, sys_tri_2;

expeRepo.getSystem(system)
.then(_nefertem => {
    console.log(`Fetched ${system} system coordinates`);
    obj_system = _nefertem;
    return expeRepo.findSystemsAround(obj_system, distance + range);
}).then(_systems => {
    console.log(`${_systems.length} systems around ${system} within ${distance + range} ly`);
    systems = _systems;
    return expeRepo.findSystemsAround(obj_system, distance - range);
}).then(_systems => {
    console.log(`${_systems.length} systems around ${system} within ${distance - range} ly`);
    let sys_min = _systems.map(_sys => _sys.edsm_id);
    sys_1 = systems.filter(_sys => sys_min.indexOf(_sys.edsm_id) === -1);
    console.log(`${sys_1.length} systems around ${system} within ${distance - range} to ${distance + range} ly`);
    return expeRepo.getSystem(system_2);
}).then(_nefertem => {
    console.log(`Fetched ${system_2} system coordinates`);
    obj_system_2 = _nefertem;
    return expeRepo.findSystemsAround(obj_system_2, distance_2 + range);
}).then(_systems => {
    console.log(`${_systems.length} systems around ${system_2} within ${distance_2 + range} ly`);
    systems = _systems;
    return expeRepo.findSystemsAround(obj_system_2, distance_2 - range);
}).then(_systems => {
    console.log(`${_systems.length} systems around ${system_2} within ${distance_2 - range} ly`);
    let sys_min = _systems.map(_sys => _sys.edsm_id);
    sys_2 = _.filter(sys_2, _sys => sys_min.indexOf(_sys.edsm_id) === -1);
    console.log(`${sys_2.length} systems around ${system} within ${distance - range} to ${distance + range} ly`);
    let sys_2_id = sys_2.map(_sys => sys.edsm_id);

    sys_tri_1 = _.filter(sys_1, _sys => sys_2_id.indexOf(_sys.edsm_id) > -1);

    console.log(`${sys_tri_1.length} systems triangulé`);

    saveFile(sys_tri_1, `systems_triangulation.txt`);
});

function saveFile(data, file) {
    let str = "";
    data.forEach(row => {
        str += row.name + '\r\n';
    })
    fs.writeFileSync(file, str);
};
