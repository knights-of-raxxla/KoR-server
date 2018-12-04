const Bookshelf = require('../Framework/Bookshelf.js');
module.exports = Bookshelf.model('Expeditions', {
    tableName: 'expeditions',
    idAttribute: 'id',
    creator() {
        return this.belongsTo('Users', 'created_by').query(q => {
            return q.select(['id', 'name', 'email', 'platform', 'archive'])
        });
    },
    systems() {
        return this.belongsToMany('Systems'
        , 'expeditions_systems_users');
    }
});
