const _ = require('lodash');
module.exports = class EDSM_API {
    constructor(rq)  {
        this.rq = rq;
        this.rq.setTorAddress('127.0.0.1', 9050);
        this.rq.TorControlPort.password = 'poiuyt';

        this.max_rq = 350;
        this.curr_rq = 0;
    }

    newTorSession() {
        console.log('new tor session init');
        this.curr_rq = 0;
        return new Promise((resolve, reject) => {
            this.rq.newTorSession(err => {
                if (err) return reject(err);
                setTimeout(() => resolve(1), 20000);
            });
        });
    }

    _systemBodiesRq(system_name) {
        return new Promise((resolve, reject) => {
            let url = `https://www.edsm.net/api-system-v1/bodies/?systemName=${system_name}`;
            this.rq.request({
                method: 'GET',
                url
            }, (err, res, body) => {
                let statusCode = _.get(res, 'statusCode') || 502;
                if (statusCode === 200) {
                    if (typeof body === 'string')
                        body = JSON.parse(body);
                    if (!body.id) return reject('empty');
                    return resolve(body);
                }
                return reject(statusCode);
            });
        });
    }

    systemBodies(system_name) {
        this.curr_rq++;
        return this._systemBodiesRq(system_name);
    }

    // systemBodies(system_name) {
    //     this.curr_rq++;
    //     let cmds = [];
    //     if (this.max_rq <= this.curr_rq)
    //         cmds.push(this.newTorSession());
    //     return Promise.all(cmds)
    //         .then(() => {
    //             return this._systemBodiesRq(system_name);
    //         });
    // }
}
