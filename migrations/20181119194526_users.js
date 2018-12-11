
const $platforms = ['ps4', 'xbox_one', 'pc'];
exports.up = function(knex, Promise) {
    let ups = [
        knex.schema.createTable('users', function(table) {
            table.increments();
            table.string('name');
            table.string('email')
            table.string('password');
            table.boolean('confirmed').default(0);
            table.string('reset');
            table.datetime('reset_at');
            table.text('groups');
            table.text('permissions');
            table.enum('platform', $platforms);

            table.dateTime('created_at');
            table.dateTime('updated_at');
            table.boolean('archive').default(0);
        }),
        knex.schema.createTable('expeditions', function(table) {
            table.increments();
            table.string('name').notNullable();
            table.text('description');
            table.string('type'); // for later
            table.string('status'); // 'complete' 'in_progress' 'paused'
            table.date('ignore_visitables_before');

            table.integer('created_by').unsigned();

            table.dateTime('created_at');
            table.dateTime('updated_at');
            table.boolean('archive').default(0);

            table.foreign('created_by')
                .references('users.id');

        }),

        knex.schema.createTable('expeditions_systems_users', function(table) {
            table.increments();
            table.integer('system_id').notNullable().unsigned();
            table.integer('expedition_id').notNullable().unsigned();
            table.integer('user_id').unsigned();

            table.dateTime('created_at');
            table.dateTime('updated_at');
            table.boolean('archive');

            table.foreign('system_id')
                .references('systems.id');

            table.foreign('expedition_id')
                .references('expeditions.id');

            table.foreign('user_id')
                .references('users.id');
        }),

        knex.schema.createTable('visitables', function(table) {
            table.increments();
            table.enum('visitable_type', ['body', 'station'])
            table.integer('visitable_id').notNullable().unsigned();
            table.integer('user_id');
            table.text('comment');
            table.datetime('date').notNullable();
            table.enum('platform', $platforms);
            table.enum('report_method', ['dump', 'parse', 'manual']);

            table.dateTime('created_at');
            table.dateTime('updated_at');
            table.boolean('archive');
        }),
    ];

    return Promise.all(ups);

};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTableIfExists('visitables'),
        knex.schema.dropTableIfExists('expeditions_systems_users'),
        knex.schema.dropTableIfExists('expeditions'),
        knex.schema.dropTableIfExists('users'),
    ]);
};


