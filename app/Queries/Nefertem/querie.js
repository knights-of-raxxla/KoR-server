let container = require('../../Container.js')
    .getInstance();
const expeRepo = container.get('ExpeditionsRepo');
const os = require('os');
const fs = require('fs');
const _ = require('lodash');

// let system = "Nefertem";
// let system = "Sol";
// let distance = 15; //al
// let distance = 298; //al
let nefertem;

expeRepo.getSystem(system)
.then(_nefertem => {
    console.log(`Fetched ${system} system coordinates`);
    nefertem = _nefertem;
    return expeRepo.findSystemsAround(nefertem, distance + 2);
}).then(_systems => {
    console.log(`${_systems.length} systems around ${system} within ${distance + 2} ly`);
    systems = _systems;
    return expeRepo.findSystemsAround(nefertem, distance - 2);
}).then(_systems => {
    console.log(`${_systems.length} systems around ${system} within ${distance - 2} ly`);
    sys_15 = _systems.map(_sys => _sys.edsm_id);
    let sys = systems.filter(_sys => sys_15.indexOf(_sys.edsm_id) === -1);
    sys.forEach(_sys => {
        console.log(
            _sys.name +
            Math.sqrt(Math.pow((_sys.x - nefertem.x)/32, 2) +
            Math.pow((_sys.y - nefertem.y)/32, 2) +
            Math.pow((_sys.z - nefertem.z)/32, 2)) + `ly from ${system}`
        );
    });
    console.log(`${sys.length} systems around ${system} within ${distance - 2} to ${distance + 2} ly`);
    saveFile(sys, 'systems_list_around_nefertem_13_to_17al.txt');
});

function saveFile(data, file) {
    let str = "";
    data.forEach(row => {
        str += row.name + '\r\n';
    })
    fs.writeFileSync(file, str);
};
