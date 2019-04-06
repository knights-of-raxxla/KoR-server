let container = require('../../Container.js')
    .getInstance();
const expeRepo = container.get('ExpeditionsRepo');
const process = require('process');
const os = require('os');
const fs = require('fs');
const _ = require('lodash');

// let system = "Nefertem";
let system = "LP 29-188";
// let distance = 15; //al
// let distance = 298; //al
let distance = 20;
let nefertem;

expeRepo.getSystem(system)
.then(_nefertem => {
    console.log(`Fetched ${system} system coordinates`);
    nefertem = _nefertem;
    return expeRepo.findSystemsAround(nefertem, distance);
}).then(_systems => {
    console.log(`${_systems.length} systems around ${system} from ${distance} ly`);
    saveFile(_systems, `systems_list_around_${system.replace(' ', '_')}_${distance}_al.txt`);
    process.exit();
});

function saveFile(data, file) {
    let str = "";
    data.forEach(row => {
        str += row.name + '\r\n';
    })
    fs.writeFileSync(file, str);
};
