'use strict';

/**
 * @property {array} clients
 * les origines autorisées du clients
 */
var clients = [
    'http://extranet.sefima.local',
    'http://localhost'
];

/**
 * @property {array} public_routes
 * les routes dites de login, les routes
 * où le client n'a pas besoin d'être logué avec le serv node
 * pour pouvoir utiliser les sockets
 */
var public_routes = [
    '/login',
    '/password',
];

/**
 * @constructor
 * @class Gatekeeper
 * Middleware socketk.io qui gère les droits de connection du client
 * avec notre serveur nodejs via socket.io
 */
class Gatekeeper {
    /**
     * @constructor
     * @param app une instance app de express
     * @param io une instance de socekt.io io object
     */
    constructor(app, io, BusFactory, JWT, LoginAttempt) {
        this.io  = io;
        this.app = app;
        let BusFactory = require('../EventManager/EventBusFactory').getInstance();
        this.EventManager = BusFactory.get('session');
        this.JWT = require('./JWT');
        this.LoginAttempt = require('./LoginAttempt');
        this.registerEvents();
    }

    /**
     *
     * @returns {undefined}
     */
    registerEvents() {
        let that = this;
        this.io.on('connect', socket => {
            if (!this._isFromAuthorizedOrigin(socket)) {
                this._closeConnection(socket);
            }
            this.socketMiddleware(socket).then(function(next) {
                if (next.can) {
                    //emit event a laissé passé avec le token + id
                }
                if (!next.token) { //not logged in
                    next.socket.on('login', function(data){
                        new that.LoginAttempt(data).then(function(utilisateur) {
                            if (utilisateur) {
                                that._generateToken(utilisateur).then(token => {
                                    next.socket.emit('token available', token);
                                    that.EventManager.emit('user logged in', {
                                        utilisateur: utilisateur,
                                        socket:      socket,
                                        token:       token
                                    });
                                });
                            } else {
                                that._closeConnection(a_socket);
                            }
                        });
                    });
                }
            });
        });
    }

    /**
     *
     * @param socket une socket soket.io
     * @returns {undefined}
     */
    socketMiddleware(socket) {
        var str_token = socket.handshake.query.token;
        return new Promise((resolve, reject) => {
            if (this._isOnLoginRoute(socket)) {
                    return resolve({
                        can : true,
                        token : false,
                        socket : socket
                    });
            }

            new this.JWT(str_token).then( token => {
                if (token) {
                    this.EventManager.emit('connection authorized', socket);
                    socket.token = token;
                    return resolve({
                        can : true,
                        token : token,
                        socket : socket
                    });
                } else {
                    this._closeConnection(socket);
                    return resolve(false);
                }
            }).catch(err => {
                this._closeConnection(socket);
                resolve(false);
            });
        });
    }


    /**
     * Génère le token JWT
     * @param {object} utilisateur un retour ORM de la classe utilisateur
     * @return {Promise} une Promise avec  le token disponible
     */
    _generateToken(utilisateur) {
        return new Promise((resolve, reject) =>  {
            new this.JWT({
                payload : {
                    utilisateur_id : utilisateur.utilisateur_id
                }
            }).then(token => {
                resolve(token);
            });
        });
    }

    /**
     * Envoie un event pre-close au client
     * puis ferme la connection socket
     */
    _closeConnection(socket) {
        socket.emit('connection unauthorized');
        setTimeout(function() {
            ConnectionHandler.disconnect();
        }, 500);
    }



    /**
     *
     * @param socket une socket
     * @returns {boolean} true si le client est sur une route de login
     * les routes de login sont définies dans les props de cette classe
     */
    _isOnLoginRoute(socket) {
        var ref = socket.conn.request.headers.referer;
        var found = false;
        for (var i in clients) {
            for (var route of public_routes) {
                let m = clients[i]+route;
                if (ref.match(m)) {
                    return true;
                }
            }
        }
        return found;
    }

    /*
     * Check de base pour savoir si la requête provient
     * d'une origine acceptée
     */
    _isFromAuthorizedOrigin(socket) {
        let origin = socket.conn.request.headers.origin;
        for (var i in clients) {
            if (clients[i] == origin)  {
                return true;
            }
        }
        return false;
    }
}

module.exports = Gatekeeper;
