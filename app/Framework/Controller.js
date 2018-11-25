const bodyParser = require('body-parser');
module.exports = class Controller {
    constructor(container) {
        this.container = container;
        this.bodyParser = bodyParser;
    }
    _parseQueryString(base, str) {
        let params = decodeURI(base.split('?')[1]);
        let couples = params.split('&');
        let o = {};
        couples.forEach(couple => {
            let spl = couple.split('=');
            o[spl[0]] = spl[1];
        });
        return o;
    }
}
