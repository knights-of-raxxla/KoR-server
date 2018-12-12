let file = process.argv[2];
const _ = require('lodash');
const fs = require('fs');
let cwd = process.cwd();
let data = require(cwd + '/' + file);
let res = _.orderBy(data, row =>  row.distance_from_arrival);
fs.writeFileSync('dark-wheel-sorted.json', JSON.stringify(res, null, 4));
