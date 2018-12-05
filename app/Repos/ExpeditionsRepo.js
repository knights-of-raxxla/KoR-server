const _ = require('lodash');

module.exports = class ExpeditionRepo {
    constructor(knex, async, mutationReporter, BodyRepo) {
        this.knex = knex;
        this.async = async;
        this.bodyRepo = BodyRepo;
        this.mutationReporter = mutationReporter;
    }

    getSystem(name) {
        return this.knex('systems')
        .where({name})
        .first();
    }

    getSystemById(id) {
        return this.knex('systems')
        .where({id})
        .first();
    }

    searchSystemByName(name) {
        return this.knex('systems')
            .where('name', 'like', `%${name}%`);
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
     * Insert or update an expedition
     * @param {ExpeditionsForm} params
     */
    manageExpedition(params, creator_email) {
        let action = 'update';
        if (params.id) action = 'insert';
        if (action === 'insert')
            return this._updateBasicExpeditionInfo(params)
        else {
            let expedition_id;
            return this._findUser(creator_email)
                .then(user => {
                    let created_by;
                    if (user.id) created_by = user.id;
                    return this._insertBaseExpedition(params, created_by);
                }).then(res => {
                    expedition_id = res[0];
                    return this._findSystemsForCreation(params);
                }).then(system_ids => {
                    return this._attachSystemsToExpeditions(system_ids, expedition_id);
                }).then(res => {
                    return expedition_id;
                });
        }
    }

    /**
    * create expedition with system in args
    *
    * @access public
    * @param {Systems[]} systems collection of systems
    * @returns {Promise<?>} /
    */
    createExpedition(systems) {
        this._checkAndFetchAllBodies(systems)
        .then(out => {
            // wip @TODO
        })
    }

    fetchExpedition() {
        // TODO
        // rels :
        // systems
        // created_by
        // systems.bodies
        // systems.bodies.visitables
        //
    }

    _checkAndFetchAllBodies(systems) {
        return this.async.each(systems, system => {
            return new Promise((resolve, reject) => {
                this.bodyRepo.CheckHasBodies(system.id)
                .then(has => {
                    if (!has) return;
                    return this.bodyRepo.getAndInsertBodies(system);
                }).then(out => resolve(out))
                .catch(err => reject(err));
            });
        })
    }

    /**
     * @param {ExpeditionsForm} params
     */
    _findSystemsForCreation(params) {
        return new Promise((resolve, reject) => {
            if (params.systems.method === 'manual')  {
                let system_ids = _.map(params.systems.selected, system => {
                    return system.id
                });
                return resolve(system_ids);
            } else if (params.systems.method === 'center'){
                let {radius, center} = params.systems;
                this.getSystemById(center)
                .then(system => {
                    return this.findSystemsAround(system, radius)
                }).then(systems => {
                    let system_ids = _.map(systems, system => {
                        return system.id
                    });
                    return resolve(system_ids);
                });
            } else {
                return reject(`unknown method ${params.systems.method}`);
            }
        });
    }

    _attachSystemsToExpeditions(system_ids, expedition_id) {
        let ins = [];
        let created_at = new Date();
        system_ids.forEach(system_id => {
            ins.push({
                expedition_id,
                system_id,
                created_at,
            });
        });
        return this.knex('expeditions_systems_users')
        .insert(ins)
    }

    _findUser(email) {
        return this.knex('users')
        .where({email})
        .first();
    }

    /**
     * @param {ExpeditionsForm} params
     */
    _updateBasicExpeditionInfo(params) {
        let now = new Date();
        return this.knex('expeditions')
        .where({id})
        .update({
            name: params.name,
            description: params.description,
            status: params.status,
            updated_at: now
        });
    }

    /**
     * @param {ExpeditionsForm} params
     */
    _insertBaseExpedition(params, created_by) {
        let now = new Date();
        let ignore_visitables_before;
        if (params.ignore_before_toggle)
            ignore_visitables_before = params.ignore_before;
        return this.knex('expeditions')
        .insert({
            name: params.name,
            description: params.description,
            status: params.status,
            ignore_visitables_before,
            created_by,
            created_at: now
        });
    }
}
