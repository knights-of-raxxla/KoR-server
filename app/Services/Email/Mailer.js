const env = require('../../../env.js');
const $smtp = env.smtp;

module.exports = class Mailer {
    constructor(nodemailer) {
        this.nodemailer = nodemailer;
    }

    createTransport() {
        return this.nodemailer.createTransport({
            host: $smtp.host,
            port: $smtp.port,
            secure: true, // true for 465, false for other ports
            auth: {
                user: $smtp.login, // generated ethereal user
                pass: $smtp.password // generated ethereal password
            }
        });
    }

    createEnvelop(params) {
        let p = {
            from: params.from,
            to: params.to,
            subject: params.subject,
            text: params.text,
            html: params.html
        };
        return p;
    }

    send(opts) {
        return new Promise((resolve, reject) => {
            let trans = this.createTransport();
            let envelop = this.createEnvelop(opts);
            return trans.sendMail(envelop, (err, res) => {
                if (err) return reject(err);
                return resolve(res);
            });
        });
    }
}
