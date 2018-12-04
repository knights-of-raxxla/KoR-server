const Bookshelf = require('../Framework/Bookshelf.js');
module.exports = Bookshelf.model('Visitables', {
    tableName: 'visitables',
    idAttribute: 'id',

    user() {
        return this.belongsTo('Users', 'user_id').query(q => {
            return q.select(['id', 'name', 'email', 'platform', 'archive'])
        });
    }
});
