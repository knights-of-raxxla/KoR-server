module.exports = class ExpeditionRepo {
    constructor(knex, mutationReporter) {
        this.knex = knex;
        this.mutationReporter = mutationReporter;
    }

    getSystem(name) {
        return this.knex('systems')
        .where({name})
        .first();
    }

    searchSystemByName(name) {
        return this.knex('systems')
            .where('name', 'like' `%${name}%`);
    }

    /**
     * @public
     * Find system around center at $distance ly
     * @param {Object} center
     * @param {Integer} center.x
     * @param {Integer} center.y
     * @param {Integer} center.z
     * @param {Float} distance
     */
    findSystemsAround(center, distance) {
        let cy = center.y;
        let cx = center.x;
        let cz = center.z;
        let having_pow = `POW(systems.x - ${cx}, 2) + POW(systems.y - ${cy}, 2) + POW(systems.z - ${cz}, 2) <= POW(${distance}, 2)`;
        return this.knex('systems')
            .havingRaw(having_pow);
    }

    createSystem({name, edsm_id, eddb_id, x, y, z}) {
        let created_at = new Date();
        return this.knex('systems')
            .insert({name, edsm_id, eddb_id, x, y, z, created_at});
    }

    /**
     * @param {Object} bag
     * @param {String} bag.name
     * @param {String} bag.description -> should be html
     * @param {Integer[]} bag.systems_ids id of selected systems
     * @param {Integer} bag.created_by user id
     *
     */
    createExpedition({name, description, system_ids, created_by}) {
        let created_at = Date.now();
        this.knex('expeditions')
            .insert({name, description, created_at})
            .then(([expedition_id]) => {
                let ins = [];
                system_ids.forEach(system_id => {
                    ins.push({
                        expedition_id,
                        system_id,
                        created_by,
                        created_at,
                    });
                });
                return this.knex('expeditions_systems_users')
                .insert(ins)
            }).then(() => {
                return this.mutationReporter.make({
                    success: 1,
                    event: 'expedition created',
                    context: {system_ids, name, description}
                });
            });
    }
}
