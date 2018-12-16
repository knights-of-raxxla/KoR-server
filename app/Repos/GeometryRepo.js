// 1 astronomica unit = 499.005 light seconds
//
const $au_ls = 499.005;

module.exports = class GeometryRepo {
    semiMinorAxis(semi_major_axis, eccentricity, opts = {}) {
        let small_axis = semi_major_axis * Math.sqrt(1 - Math.pow(eccentricity, 2));
        if (opts.unit === 'ls') return this.auToLs(small_axis);
        return small_axis; // in astronomical unit
    }

    auToLs(au) {
        return au * $au_ls;
    }
}
