
"use strict";
/**
 * @class
 * @singleton
 * @memberof module:Services/Auth
 * @description Factory de Tokens JWT
 * voir https://wikipedia.org/wiki/JSON_Web_Token
 */
class JWTFactory {

    /**
     * @constructor
     * @param {Jsonwebtoken} engine, jsonwebtoken lib
     * @param {SessionException} Exception
     */
    constructor(engine, sessionException) {
        this.engine           = engine; //jsonwebtoken
        this.sessionException = sessionException;
        this.JWT              = require("./JWT");
    }

	/**
	 * Renvoie un token décodé OU encodé en fonction
	 * des arguments passés
	 * @param les deps + paramètres
	 * @return {Promise}
	 */
	make(params) {
	    return new this.JWT(this.engine, this.sessionException, params);
    }
}

/**
 * singleton Stuff
 */
var instance;
var instantiator = {
    getInstance : function(engine, sessionException) {
        if (!instance) {
            instance = new JWTFactory(engine, sessionException);
        }
        return instance;
    }
};

module.exports = instantiator;
