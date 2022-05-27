'use strict';

const axios = require('axios');
const config = require('../../../config/smn');
const P = require('bluebird');
const errors = require('http-errors');
const cheerio = require('cheerio');

class Smn {
    testConnection () {
        return axios.get(config.url)
            .then(() => {
                return true;
            })
            .catch(() => {
                return false;
            });
    }

    getByOaciCode (oaciCode) {
        const url = `${config.metarBaseURL}${oaciCode}`;

        return axios.get(url)
            .then(response => {
                const $ = cheerio.load(response.data);
                const metar = $('form[name="imprimir"]').find('input[type="hidden"]').val();
                if (!metar) {
                    throw new errors.NotFound('Metar not found');
                }
                // get only the string that contains starting in METAR
                const metarString = metar.substring(metar.indexOf('METAR'));
                return metarString;
            })
            .catch(error => {
                console.log('Metar not found');
            });
    }
}

module.exports = Smn;
