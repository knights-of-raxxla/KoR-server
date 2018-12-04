
const Bookshelf = require('../Framework/Bookshelf.js');
module.exports = Bookshelf.model('Systems', {
    tableName: 'systems',
    idAttribute: 'id',

    bodies() {
        return this.hasMany('Bodies');
    }
});
