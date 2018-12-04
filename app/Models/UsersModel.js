
const Bookshelf = require('../Framework/Bookshelf.js');
module.exports = Bookshelf.model('Users', {
    tableName: 'users',
    idAttribute: 'id',
});
