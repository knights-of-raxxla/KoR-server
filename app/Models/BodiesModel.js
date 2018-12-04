const Bookshelf = require('../Framework/Bookshelf.js');
module.exports = Bookshelf.model('Bodies', {
    tableName: 'bodies',
    idAttribute: 'id',

    visitables() {
        return this.morphMany('Visitables', 'visitable'
        , ['visitable_type', 'visitable_id'], 'body');
    }

});
