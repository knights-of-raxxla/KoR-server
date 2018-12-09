const _ = require('lodash');
const async = require('async-q');
module.exports = class ExpeditionRepo {
    constructor(knex, async, mutationReporter, ExpeditionsModel, ExpePivot, SystemsModel, BodyRepo) {
        this.knex = knex;
        this.async = async;
        this.bodyRepo = BodyRepo;
        this.mutationReporter = mutationReporter;
        this.ExpeditionsModel = ExpeditionsModel;
        this.ExpePivot =  ExpePivot;
        this.SystemsModel = SystemsModel;
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

    searchSystemByName(name, expedition) {
        if (!expedition)
            return this.knex('systems')
                .where('name', 'like', `${name}%`)
                .orderBy('name', 'ASC')
                .limit(10);
         else return this.knex('expeditions_systems_users as pivot')
            .where('expedition_id', '=', expedition)
            .leftJoin('systems', 'pivot.system_id', 'systems.id')
            .where('systems.name', 'like', `${name}%`)
            .orderBy('name', 'ASC')
            .limit(10);

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
        let system_ids;
        let action = 'insert';
        if (params.id) action = 'update';
        if (action === 'update')
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
                }).then(_system_ids => {
                    system_ids = _system_ids;
                    return this.knex('systems')
                        .where('id', 'in', system_ids);
                }).then(systems => {
                    return this._checkAndFetchAllBodies(systems);
                }).then(() => {
                    return this._attachSystemsToExpeditions(system_ids, expedition_id);
                }).then(res => {
                    return expedition_id;
                });
        }
    }
    _checkAndFetchAllBodies(systems) {
        return this.async.each(systems, system => {
            return new Promise((resolve, reject) => {
                this.bodyRepo.checkHasBodies(system.id)
                .then(has => {
                    if (has) return;
                    return this.bodyRepo.getAndInsertBodies(system);
                }).then(out => resolve(out))
                .catch(err => reject(err));
            });
        })
    }

    fetchExpedition(id, offset, partial = false) {
        let cmds = [
            this._fetchSystemsOfExpedition(id, offset)
        ];
        if (!partial) cmds = cmds.concat([
            this._fetchExpeditionInfo(id),
            this._fetchExpeditionTotalBodies(id),
            this._fetchExpeditionTotalExplored(id),
            this._fetchExpeditionTotalSystems(id)
        ]);
        return Promise.all(cmds)
            .then(out => {
                let o = {};
                if (!partial) {
                    let infos = out[1];
                    if (infos && infos.serialize)
                        infos = infos.serialize();
                    o = infos;
                    o.stats = {
                        bodies_count: out[2],
                        bodies_explored_count: out[3],
                        systems_count: out[4]
                    };
                }
                if (out[0] && out[0].serialize)
                    out[0] = out[0].serialize();
                o.systems = out[0];
                return o;
            });
    }

    fetchCurrentExpeditions() {
        return this.knex('expeditions')
            .where('status', 'Active')
            .where('archive', 0)
            .then(expeditions => {
                let ids = _.map(expeditions, ex => ex.id);
                return async.each(ids, id => {
                    let cmds = [
                        this._fetchExpeditionInfo(id),
                        this._fetchExpeditionTotalBodies(id),
                        this._fetchExpeditionTotalExplored(id),
                        this._fetchExpeditionTotalSystems(id)
                    ];
                    return Promise.all(cmds)
                        .then(out => {
                            let o = out[0];
                            if (o && o.serialize)
                                o = o.serialize();
                            o.stats = {
                                bodies_count: out[1],
                                bodies_explored_count: out[2],
                                systems_count: out[3]
                            };
                            return o;
                        });
                });
            });
    }

    insertVisitable(visitable) {
        visitable.date = new Date();
        visitable.created_at = new Date();
        return this.knex('visitables')
            .insert(visitable);
    }

    findExpeditionsAroundRef(system_id) {
        let found_systems = [];
        let ref_system;
        return this.knex('systems')
        .where({id: system_id})
        .first()
        .then(_ref_system => {
            ref_system = _ref_system;
            let distance = 60;
            let cy = ref_system.y;
            let cx = ref_system.x;
            let cz = ref_system.z;
            let having_pow = `POW(systems.x - ${cx}, 2) + POW(systems.y - ${cy}, 2) + POW(systems.z - ${cz}, 2) <= POW(${distance}, 2)`;

            return this.knex('expeditions_systems_users as pivot')
            .leftJoin('systems', 'systems.id', 'pivot.system_id')
            .leftJoin('expeditions', 'expeditions.id', 'pivot.expedition_id')
            .select('pivot.expedition_id as expedition_id')
            .select('pivot.system_id as system_id')
            .select('expeditions.name as expedition_name')
            .select('systems.name as system_name')
            .select('expeditions.status as expedition_status')
            .select('systems.x')
            .select('systems.y')
            .select('systems.z')
            .havingRaw(having_pow)
            .limit(75);
        }).then(rows => {
            return _.chain(rows)
                .map(row => {
                let distance_2 = Math.pow(row.x - ref_system.x, 2) +
                Math.pow(row.y - ref_system.y, 2) +
                Math.pow(row.z - ref_system.z, 2);
                let distance = Math.sqrt(distance_2);
                row.distance = distance;
                return row;
            }).orderBy('distance', 'asc')
            .value();
        })
    }

    fetchSingleSystemInfo(system_id) {
        return new this.SystemsModel().where({id: system_id})
        .fetch({withRelated: [
            'bodies',
            'bodies.visitables',
            'bodies.visitables.user'
        ]});
    }

    _fetchExpeditionInfo(id) {
        return new this.ExpeditionsModel().where({id})
            .fetch({withRelated: [
                'creator'
            ]});
    }

    _fetchExpeditionTotalBodies(id) {
        return this.knex('expeditions_systems_users as pivot')
            .where('pivot.expedition_id', '=', id)
            .leftJoin('systems', 'pivot.system_id', 'systems.id')
            .leftJoin('bodies', 'bodies.system_id', 'systems.id')
            .count().then(res => {
                return res[0]['count(*)'];
            });
    }

    _fetchExpeditionTotalSystems(id) {
        return this.knex('expeditions_systems_users as pivot')
            .where('pivot.expedition_id', '=', id)
            .leftJoin('systems', 'pivot.system_id', 'systems.id')
            .count().then(res => {
                return res[0]['count(*)'];
            });
    }

    _fetchExpeditionTotalExplored(id) {
        return this.knex('expeditions_systems_users as pivot')
        .where('pivot.expedition_id', '=',  id)
        .leftJoin('systems', 'pivot.system_id', 'systems.id')
        .leftJoin('bodies', 'bodies.system_id', 'systems.id')
        .select('bodies.id as body_id')
        .then(rows => {
            let ids = _.chain(rows)
                .map(row => row.body_id)
                .compact()
                .value();
            return this.knex('visitables')
                .where('visitable_type', 'body')
                .whereIn('visitable_id', ids)
                .distinct('visitable_id', 'visitable_type');
        }).then(dis => {
            return dis.length;
        });
    }

    /**
     * Retrieves the systems that belong to an expedition
     * with an offset, they will be returned alphabetically
     * taking into account the offset
     * @param {Number} id expedition_id
     * @param {Number} offset query offset
     */
    _fetchSystemsOfExpedition(id, offset) {
        let limit = 15;
        let system_ids;
        return this.knex('expeditions_systems_users as pivot')
        .where('expedition_id', id)
        .leftJoin('systems', 'systems.id', 'pivot.system_id')
        .orderBy('systems.name', 'asc')
        .limit(limit)
        .offset(offset)
        .select('systems.id as id')
        .then(ids => {
            ids = _.map(ids, item => item.id);
            return this.SystemsModel.query(q => {
                return q.whereIn('id', ids)
            }).orderBy('name')
            .fetchAll({withRelated: [
                'bodies',
                'bodies.visitables',
                'bodies.visitables.user'
            ]});
        }).then(systems => {
            if (systems && systems.serialize)
                systems = systems.serialize();
            return systems;
        });
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
