let process = require('child_process');
const url_eddb_body = "https://eddb.io/system/bodies/";
module.exports = class BodyRepo {
    constructor(request, cheerio, knex, mutationReporter) {
        this.cheerio = cheerio;
        this.request = request;
        this.knex = knex;
        this.mutationReporter = mutationReporter;
    }
    checkHasBodies(system_id) {
        return this.knex('bodies').where({system_id})
        .then(out => {
            if (out && out.length) return true;
            return false;
        });
    }

    getAndInsertBodies(system) {
        return this.getBodiesFromEDDB(system)
        .then(bodies => {
            console.log({bodies});
            return this.insertBodies(bodies);
        });
    }

    getBodiesFromEDDB(system) {
        return new Promise((resolve, reject) => {
            if (!system.eddb_id)
                return reject('BodyRepo::getBodiesFromEDDB::system havent eddb_id');

            let bodies = [];
            this.request({method: 'GET', url: url_eddb_body + system.eddb_id},
                (err, res, html) => {
                let $ = this.cheerio.load(html);
                $('body').find('.body-content-wrapper').each((i, body) => {
                    // forEach .body-content-wrapper
                    //  >id first a href /body/${id}
                    //  > name .body-name > innerHTML first a
                    //    > small
                    //      > entre les premiers "-" => type
                    //      > is_landable body-property-icon-list > has-feature (coll) > class = fa-rocket
                    //  > .body-property-list
                    //    > forEach tr si td.body-property-label = Distance To Arrival,
                    //          td.body-property-value = distance_from_arrival
                    let el_name = $(body).find('.body-name')[0];
                    let a = $(el_name).find('a');

                    // ID
                    let id;
                    let href = $(a).attr('href');
                    if (href) {
                        id = href.split('/')[2];
                    }

                    // NAME
                    let name = $(a).text();

                    // TYPE
                    let type;
                    let text_name = $(el_name).find('small').text();
                    if (text_name) {
                        type = text_name.split('-')[1].trim();
                    }
                    // LANDABLE
                    let is_landable = false;
                    let features = $(el_name).find('small').find('.has-feature');
                    features.each((i, feature) => {
                        let fclass = $(feature).find('i').attr('class');
                        if (fclass === 'fa fa-rocket') is_landable = true;
                    });
                    let properties = $(body).find('.body-property-list tr');
                    let distance_from_arrival;
                    properties.each((i, property) => {
                        let label = $(property).find('td.body-property-label').text().trim();
                        if (label === 'Distance To Arrival:') {
                            let distance = $(property).find('td.body-property-value').text().trim();
                            distance = distance.split(' ')[0];
                            distance_from_arrival = distance.replace(',', '');

                        }
                    });

                    if (name) {
                        bodies.push({
                            eddb_id: id,
                            system_id: system.id,
                            type,
                            name,
                            is_landable,
                            distance_from_arrival
                        });
                        // console.log('id :', id);
                        // console.log('system_id :', system.id);
                        // console.log('name :', name);
                        // console.log('type :', type);
                        // console.log('is_landable :', is_landable);
                        // console.log('distance_from_arrival :', distance_from_arrival);
                        // console.log('--------')
                    }
                });
                resolve(bodies);
            });
        });

    }

    /**
     * Insert les bodies
     * @access public
     * @param {Object[]} bodies collection de body
     * @param {number} bodies[].eddb_id id eddb du body
     * @param {number} bodies[].system_id id du system (de notre db) du body
     * @param {number} bodies[].name nom du body
     * @param {number} bodies[].type type du body
     * @param {number} bodies[].is_landable body landable
     * @param {number} bodies[].distance_from_arrival body distance to arrival
     * @returns {Promise<knex>} retour knex
     */
    insertBodies(bodies) {
        return this.knex('bodies').insert(bodies);
    }
};
