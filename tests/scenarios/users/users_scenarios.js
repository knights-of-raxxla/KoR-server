const container = require('../../../app/Container.js')
    .getInstance();
const userManager = container.get('UserManager');

module.exports = {
    createUser({name, password, email}) {
        return userManager.createUser({name, password, email})
    }
}

