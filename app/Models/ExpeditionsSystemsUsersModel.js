const Bookshelf = require('../Framework/Bookshelf.js');
module.exports = Bookshelf.model('ExpeditionsSystemsUsers', {
    tableName: 'expeditions_systems_users',
    idAttribute: 'id',

    system() {
        return this.belongsTo('Systems');
    }
});
