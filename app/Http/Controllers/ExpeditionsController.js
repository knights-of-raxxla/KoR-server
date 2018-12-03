const Controller = require('../../Framework/Controller.js');
module.exports = class UserController extends Controller {
    searchSystem(req, res) {
        let {system} = this._parseQueryString(req.url);
        return this.container.get('ExpeditionsRepo')
            .searchSystemByName(system)
            .then(arr => {
                console.log(arr);
                return res.status(200).send(arr);
            }).catch(err => {
                return res.sendStatus(501);
            });
    }

    createExpedition(req, res) {

    }
}
