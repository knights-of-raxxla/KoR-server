const Controller = require('../../Framework/Controller.js');
module.exports = class ExpeditionsController extends Controller {
    searchSystem(req, res) {
        let {system, expedition} = this._parseQueryString(req.url);
        return this.container.get('ExpeditionsRepo')
            .searchSystemByName(system, expedition)
            .then(arr => {
                return res.status(200).send(arr);
            }).catch(err => {
                return res.sendStatus(501);
            });
    }

    /**
     * @typedef {Object} ExpeditionsForm
     * @property {Object} systems
     * @property {Number} [id]
     * @property {Object[]} [systems.selected]
     * @property {Number} [systems.center]
     * @property {Number} [systems.radius]
     * @property {String} name
     * @property {String} [description]
     * @property {String} status
     * @property {Boolean} ignore_before_toggle{
     * @property {String} ignore_before YYYY-MM-DD date
     */

    manage(req, res) {
        /**
         * @type ExpeditionsForm
         */
        let params = req.body;
        let user_email = this.getUserEmail(req);
        return this.container.get('ExpeditionsRepo')
            .manageExpedition(params, user_email)
            .then(expedition_id => {
                return res.status(200).send({expedition_id})
            }).catch(err => {
                console.log({err});
                res.status(501).send({err});
            });
    }

    fetchExpedition(req, res) {
        let expedition_id = req.params.id;
        let {offset, partial} = this._parseQueryString(req.url);
        offset = parseInt(offset);
        if (isNaN(offset)) offset = 0;

        if (partial === 'false') partial = false;
        if (partial === 'true') partial = true;

        return this.container.get('ExpeditionsRepo')
            .fetchExpedition(expedition_id, offset, partial)
            .then(data => {
                return res.status(200).send(data);
            }).catch(err => {
                console.log({err});
                return res.status(501).send({err});
            });
    }

    fetchCurrentExpeditions(req, res) {
        return this.container.get('ExpeditionsRepo')
            .fetchCurrentExpeditions()
            .then(data => {
                return res.status(200).send(data);
            }).catch(err => {
                console.log({err});
                return res.status(501).send({err});
            });
    }


    insertVisitable(req, res) {
        let visitable = req.body;
        let err;
        if (!visitable.visitable_type)
            err = `not found visitable_type`;
        else if (!visitable.visitable_id)
            err = `not found visitable_id`;
       else if (!visitable.user_id)
            err = `not found user_idd`;
        if (err) return res.status(501).send(err);
        return this.container.get('ExpeditionsRepo')
            .insertVisitable(visitable)
            .then(data => {
                return res.status(200).send(data);
            }).catch(err => {
                console.log({err});
                return res.status(501).send({err});
            });
    }

    fetchExpeditionsAround(req, res) {
        let {system_id} = this._parseQueryString(req.url);
        return this.container.get('ExpeditionsRepo')
            .findExpeditionsAroundRef(system_id)
            .then(data => {
                return res.status(200).send(data);
            }).catch(err => {
                console.log({err});
                return res.status(501).send({err});
            });
    }

    getSystemInfo(req, res) {
        let id = req.params.id;
        return this.container.get('ExpeditionsRepo')
            .fetchSingleSystemInfo(id)
            .then(data => {
                return res.status(200).send(data);
            }).catch(err => {
                console.log({err});
                return res.status(501).send({err});
            });

    }
}
