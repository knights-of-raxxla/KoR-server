const Controller = require('../../Framework/Controller.js');
module.exports = class UserController extends Controller {
    searchSystem(req, res) {
        let {system} = this._parseQueryString(req.url);
        return this.container.get('ExpeditionsRepo')
            .searchSystemByName(system)
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
                res.status(501).send({err});
            });
    }
}
