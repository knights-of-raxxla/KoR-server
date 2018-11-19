var Knex = require('./Knex').getInstance();

// inits bookshelf with registry plugin
var Bookshelf = require('bookshelf')(Knex);
Bookshelf.plugin('registry');
module.exports = Bookshelf;


