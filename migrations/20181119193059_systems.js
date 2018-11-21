
exports.up = function(knex, Promise) {
    let ups = [
        knex.schema.createTable('systems', function(table) {
            table.increments();
            table.string('name').notNullable();
            table.string('location');
            table.integer('edsm_id').unsigned();
            table.integer('eddb_id').unsigned();
            table.dateTime('created_at');
            table.dateTime('updated_at');
            table.boolean('archive');
        }),
        knex.schema.createTable('bodies', function(table) {
            table.increments();
            table.string('name').unique().notNullable();
            table.string('location').notNullable();
            table.float('distance_from_arrival').notNullable();
            table.boolean('is_landable').default(0);
            table.integer('system_id').notNullable().unsigned();
            table.string('type');

            table.dateTime('created_at');
            table.dateTime('updated_at');
            table.boolean('archive');

            table.foreign('system_id')
            .references('systems.id');
        }),
        knex.schema.createTable('stations', function(table) {
            table.increments();
            table.string('name').notNullable();
            table.integer('body_id').notNullable().unsigned();
            table.string('type');
            table.string('location').notNullable();

            table.dateTime('created_at');
            table.dateTime('updated_at');
            table.boolean('archive');

            table.foreign('body_id')
                .references('bodies.id');
        }),
        knex.schema.createTable('factions', function(table) {
            table.increments();
            table.string('name').notNullable();
            table.integer('system_id').notNullable().unsigned();

            table.dateTime('created_at');
            table.dateTime('updated_at');
            table.boolean('archive');

            table.foreign('system_id')
                .references('systems.id');
        }),
        knex.schema.createTable('factions_systems', function(table) {
            table.increments();
            table.integer('system_id').unsigned().notNullable();
            table.integer('faction_id').unsigned().notNullable();
            table.boolean('is_controlling').default(0);
            table.boolean('is_home').default(0);

            table.dateTime('created_at');
            table.dateTime('updated_at');
            table.boolean('archive');

            table.foreign('system_id')
                .references('systems.id');
            table.foreign('faction_id')
                .references('factions.id');
        }),
    ];

    return Promise.all(ups);

};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTableIfExists('factions_systems'),
        knex.schema.dropTableIfExists('factions'),
        knex.schema.dropTableIfExists('stations'),
        knex.schema.dropTableIfExists('bodies'),
        knex.schema.dropTableIfExists('systems'),
    ]);
};
