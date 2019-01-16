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

    getBodyInfoByName(body_name, system_name) {
        let has_multiple_stars = false;
        let stars = ['$main'];
        let suffix = body_name.split(system_name)[1] || "";
        if (suffix === "") {
            console.log('body suffix empty', {body_name, system_name});
        }
        suffix = suffix.trim();
        let parts = suffix.split(' ');

        if (parts.length >= 2) {
            let reg = new RegExp(`^[A-Z]+$`);
            if (reg.test(parts[0])) {
                stars = parts[0].split('');
                if (stars.length > 1) has_multiple_stars = true;
            }
        }
        return {
            has_multiple_stars,
            stars,
        };
    }

    smallestDistance(gaz_s_minor, moon_s_major, gaz_orbital_inclin, moon_orbital_inclin) {
        let agg_inclin = gaz_orbital_inclin + moon_orbital_inclin;
        let k = Math.cos(agg_inclin) * moon_s_major;
        let d = Math.sin(agg_inclin) * moon_s_major;

        let a = gaz_s_minor - k;
        let h = Math.sqrt(Math.pow(a, 2) + Math.pow(d, 2));
        return h;
    }

    getTypeMStarSubClass(temperature) {
        let sub = 9;
        if (temperature >= 2400) sub = 8;
        if (temperature >= 2500) sub = 7;
        if (temperature >= 2600) sub = 6;
        if (temperature >= 2800) sub = 5;
        if (temperature >= 3100) sub = 4;
        if (temperature >= 3250) sub = 3;
        if (temperature >= 3400) sub = 2;
        if (temperature >= 3600) sub = 1;
        if (temperature >= 3800) sub = 0;
        return sub;
    }

    getBodyPosition(system_name, body_name) {
        let ref_stars = '0', ref_stars_pos = 0, rest = '';
        let suffix = body_name.replace(system_name, '');
        suffix = suffix.trim();
        let parts = suffix.split(' ');

        if (parts.length > 0) {
            // une lettre ou un nombre
            if (parts.length === 1) {
                if (parts[0].match(/[A-Z]/)) {
                    ref_stars = parts[0];
                } else if (parts[0].match(/[0-9]/))
                    ref_stars_pos = parseInt(parts[0]);
            } else if (parts.length === 2) {
                // A 1
                // 1 a
                if (parts[0].match(/[A-Z]/)) {
                    ref_stars = parts[0];
                    ref_stars_pos = parseInt(parts[1])
                } else if (parts[0].match(/[0-9]/)) {
                    ref_stars_pos = parseInt(parts[0])
                    rest = parts[1];
                }

            } else if (parts.length >= 3) {
                // AB 1 a
                // 1 a a
                // 1 a a a
                if (parts[0].match(/[A-Z]/)) {
                    ref_stars = parts[0]
                    ref_stars_pos = parseInt(parts[1]);
                    rest = parts.slice(2).join(' ');
                } else if (parts[0].match(/[0-9]/)) {
                    ref_stars_pos = parseInt(parts[0]);
                    rest = parts.slice(1).join(' ');
                }
            } else throw new Error(`cant deal with ${body_name}`);
        }

        if (isNaN(ref_stars_pos))
            throw new Error(`pos is NaN ${body_name}`);
        //
        // if (parts.length === 0)
        //
        //
        //
        //
        // if (parts.length === 1) {
        //     ref_stars = parts[0];
        // } else {
        //     if (parts[0].match(/[A-Z]/)) {
        //         ref_stars = parts[0];
        //         ref_stars_pos = parseInt(parts[1]);
        //     } else if (parts[0].match(/[1-9]/)) {
        //         ref_stars_pos = parseInt(parts[0]);
        //     }
        // }
        //
        // if (isNaN(ref_stars_pos))
        //     ref_stars_pos = 0;
        //
        // if (parts.length > 2) {
        //     rest = parts.slice(2).join(' ');
        // }

        return {ref_stars, ref_stars_pos, rest};
}
};
