const Controller = require('../../Framework/Controller.js');
module.exports = class UserController extends Controller {

    handleLogin_v1(req, res) {
        let {email, password} = this._parseQueryString(req.url);
        this.container.get('UserManager')
        .userCanLogin(email, password)
        .then(can => {
            if (!can) return res.sendStatus(401);
            this.container.get('JwtFactory')
            .make({payload: {email}})
            .then(token => {
                return res.status(200).send({token});
            });
        }).catch(err => {
            if (err.match('02:cant find user with email')) res.sendStatus(401);
            else res.sendStatus(501);
            return;
        });
    }
}
