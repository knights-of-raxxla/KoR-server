const Controller = require('../../Framework/Controller.js');
module.exports = class UserController extends Controller {
    authenticate(req, res) {
        if (!req.jwt_decoded) {
            return res.send(false).status(200);
        } else {
            let email = req.jwt_decoded.email;
            if (!email) return res.send(`UserController::authenticate failed, unknown`).status(503);
            this.container.get('knex')('users')
                .where({email})
                .select([
                    'groups',
                    'permissions',
                    'id',
                    'platform',
                    'email',
                    'name'
                ]).first()
                .then(data => {
                    res.send({session: data}).status(200);
                });
        }
    }

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
            if (err.match('02:cant find user with email')) res.status(401).send(err);
            else res.sendStatus(501);
            return;
        });
    }

    createUser(req, res) {
        let params = req.body;
        this.container.get('UserManager')
        .createUser(params)
        .then(out => {
            return res.status(200).send({user_id: out});
        }).catch(err => {
            console.log({err})
            if (err && err.toString)
                err = err.toString();
            res.status(501).send(err);
        });
    }

    archiveUser(req, res) {
        let params = req.body;
        this.container.get('UserManager')
            .archiveUser(params.user_id)
            .then(out => {
                return res.status(200).send({out});
            }).catch(err => {
                if (err && err.toString)
                    err = err.toString();
                res.status(501).send(err);
            });
    }

    getUser(req, res) {
        let {user_id} = this._parseQueryString(req.url);
        return this.container.get('UserManager')
        .getUser(user_id)
        .then(userData => {
            if (!userData) return res.status(501).send(null);
            return res.status(200).send(userData);
        }).catch(err => {
            return res.status(501).send(err);
        });
    }

    resetUserPassword(req, res) {
        let params = req.body;
        return this.container.get('UserManager')
        .startPasswordReset(params.email)
        .then(out => {
            return res.status(200).send({out});
        }).catch(err => {
            return res.status(501).send(err);
        });
    }
};
