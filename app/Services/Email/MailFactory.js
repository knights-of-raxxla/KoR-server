const env = require('../../../env.js');
const $from = `"Raxxla Research Program" <${env.smtp.login}>`;

module.exports = class MailFactory {
    passwordReset({name, email, reset_endpoint}) {
        let timestamp = Date.now();
        let to = email;
        let subject = `Password reset #${timestamp}`;
        let text =
`Dear Commander ${name},

It appears you have requested to reset your password. Please click the link below :
${reset_endpoint}.

Fly Dangerously o7,

The Raxxla Research Program Team
`;
        return {from: $from, to, subject, text};
    }
}
