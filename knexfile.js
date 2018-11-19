// Update with your config settings.
const env = require('./env.js');

module.exports = {
  development: {
    client: 'mysql',
    connection: env.mysql,
    migrations:  {
        tableName: 'knex_migrations'
    }
  },
};
