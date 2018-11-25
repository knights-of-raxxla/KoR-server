const Controller = require('../../Framework/Controller.js');
module.exports = class UserController extends Controller {

    handleLogin_v1(req, res) {
        let {email, password} = this._parseQueryString(req.url);
        this.userManager.userCanLogin(email, password)
        .then(can => {
            if (!can) return res.send(401);
            this.jwtFactory.make({payload: {email}})
            .then(token => {
                return res.send(200).with({token});
            });
        }).catch(err => {
            if (err.match('02:cant find user with email')) res.send(401);
            else res.send(501);
            return;
        });
    }
}
