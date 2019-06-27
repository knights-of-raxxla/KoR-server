
exports.up = function(knex, Promise) {
    let ups = [
        knex.schema.createTable('systems', function(table) {
            table.increments();
            table.string('name').notNullable().index();
            table.integer('edsm_id').unsigned().index();
            table.integer('eddb_id').unsigned();
            table.integer('x');
            table.integer('y');
            table.integer('z');
            table.boolean('is_populated').default(0);
            table.dateTime('created_at');
            table.dateTime('updated_at');
            table.boolean('archive');
        }),
        knex.schema.createTable('bodies', function(table) {
            // common
            table.increments();
            table.string('name').notNullable().index();
            table.integer('body_id').unsigned();
            table.integer('edsm_id').unsigned().index();
            table.integer('eddb_id').unsigned();
            table.float('distance_from_arrival', 15, 4).notNullable().unsigned();
            table.boolean('is_landable').default(0);
            table.integer('system_id').notNullable().unsigned();
            table.string('type').index();
            table.string('sub_type').index();
            table.text('parents');
            table.float('mass', 15, 4).unsigned();
            table.float('radius', 15, 4).unsigned();
            table.float('surface_temperature', 15, 4);
            table.integer('offset');
            table.float("orbital_period", 40, 4);
            table.float('semi_major_axis', 15, 4);
            table.float("orbital_eccentricity", 15, 4);
            table.float("orbital_inclination", 15, 4);
            table.float("arg_of_periapsis", 15, 4);
            table.float("rotational_period", 40, 4);
            table.boolean("rotational_period_tidally_locked");
            table.float("axial_tilt", 15, 4);

            // stars
            table.boolean('is_main_star');
            table.boolean("is_scoopable");
            table.integer("age").unsigned();
            table.text('spectral_class');
            table.text("luminosity");
            table.text("absolute_magnitude");

            // planets
            table.float('gravity', 15, 4).unsigned();
            table.float('surface_pressure', 15, 4);
            table.string("volcanism_type");
            table.text('atmosphere_type');
            table.text('atmosphere_composition');
            table.text('solid_composition');
            table.string("terraforming_state");

            // sql
            table.dateTime('created_at');
            table.dateTime('updated_at');
            table.boolean('archive');

            table.foreign('system_id')
            .references('systems.id');
        }),
        knex.schema.createTable('stations', function(table) {
            table.increments();
            table.string('name').notNullable();
            table.integer('system_id').notNullable().unsigned();
            table.string('type');
            table.string('location').notNullable();
            table.text('faction');
            table.float('distance_from_arrival');

            table.dateTime('created_at');
            table.dateTime('updated_at');
            table.boolean('archive');

            table.foreign('system_id')
                .references('systems.id');
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
