const env = require('../../env.js');
/**
 * @property
 * _instance l'instance singleton
 * sera stockée ici
 */
let _instance;
/**
 * Retourne des instances originales de knex
 * @access public
 */
class Knex {
    /**
     * Crée une nouvelle instance à chaque execution
     *
     * @access public
     * @static
     * @return {knex} instance de knex
     */
    static make() {
        return require('knex')({client: 'mysql', connection: env.mysql});
    }
    /**
     * Retourne la même instance de knex (singleton)
     *
     * @access public
     * @static
     * @return {knex} instance de knex
     */
    static getInstance() {
        if (!_instance) {
            _instance  = require('knex')({client: 'mysql', connection: env.mysql});
        }
        return _instance;
    }
}
module.exports = Knex;


