const _ = require('lodash');
module.exports = class HelperRepo {
    /**
     * @param {Body} center
     * @param {Body[]} bodies
     */
    findNthMoon(center, bodies) {
        // let letter;
        // let needle_key = "Null";
        // if (center.type === 'Star') needle_key = 'Star';
        // let needle = {};
        // needle[needle_key] = center.body_body_id || center.body_id;
        // let 8th_moon = _.chain(bodies)
        //     .filter(body => {
        //         let parents = JSON.parse(body.parents);
        //         return _.find(parents, needle); // center fait partie des parents du body
        //     })
        //     .orderBy(b => b.name, 'asc')
        //     .get('[8]')
        //     .value() || false;
    }

    findNthMoonLike(center, bodies) {
        let base = center.name;
        let regex_str = `^${base} `;
        let reg = new RegExp(regex_str);
        let vals = _.chain(bodies)
            .filter(b => {
                return b.name !== base && reg.test(b.name);
            }).orderBy(b => b.name, 'ASC')
        .value();
        return _.get(vals, '[7]') || false;
    }
};
