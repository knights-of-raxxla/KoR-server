
exports.up = function(knex, Promise) {
    let ups = [
        knex.schema.createTable('rings', function(table) {
            table.increments();
            table.string('name').notNullable();
            table.integer('body_id').unsigned();
            table.string('type');
            table.float('mass', 15, 4);
            table.float('inner_radius', 15, 4);
            table.float('outer_radius', 15, 4);
            table.dateTime('created_at');
            table.dateTime('updated_at');
            table.boolean('archive').default(0);
            table.foreign('body_id').references('bodies.id');
        }),
    ]
    return Promise.all(ups);

};

exports.down = function(knex, Promise) {
    exports.down = function(knex, Promise) {
        return Promise.all([
            knex.schema.dropTableIfExists('rings'),
        ]);
    };
};
