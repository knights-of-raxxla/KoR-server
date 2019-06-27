
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
let filename = 'ImportStars.txt';
expeRepo.getSystem('Sol')
    .then(_sol => {
        console.log('got sol');
        sol = _sol;
        return expeRepo.findSystemsAround(sol, 300);
    }).then(systems => {
        console.log(systems.length, 'systems');
        str = '';
        systems.forEach(system => {
            str += system.name + os.EOL;
        });
        console.log('writing cache file');
        fs.writeFileSync(filename, str);
        console.log('done');
        process.exit(0);
    });

