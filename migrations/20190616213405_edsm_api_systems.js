
exports.up = function(knex, Promise) {
    let ups = [
        knex.schema.createTable('edsm_api_systems', function(table) {
            table.increments();
            table.integer('system_id');
            table.string('request_uri');
            table.text('data', 'longtext');
            table.boolean('is_complete');
            table.string('chunk');
            table.date('date');

            table.foreign('system_id').references('systems.id');
        }),
    ]
    return Promise.all(ups);

};

exports.down = function(knex, Promise) {
    exports.down = function(knex, Promise) {
        return Promise.all([
            knex.schema.dropTableIfExists('edsm_api_systems'),
        ]);
    };
};
