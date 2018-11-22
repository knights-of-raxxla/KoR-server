module.exports = class ExpeditionRepo {
    constructor(knex) {
        this.knex = knex;
    }

    getSystem(name) {
        return this.knex('systems')
        .where({name})
        .first();
    }

    /*
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
}
