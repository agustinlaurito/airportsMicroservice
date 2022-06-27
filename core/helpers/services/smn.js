'use strict';

const axios = require('axios');
const config = require('../../../config/smn');
const errors = require('http-errors');
const cheerio = require('cheerio');
const metarParser = require('metar-parser');

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

    getTafByOaciCode (oaciCode) {
        const url = `${config.tafBaseURL}${oaciCode}`;

        return axios.get(url)
            .then(response => {
                const $ = cheerio.load(response.data);
                const taf = $('form[name="imprimir"]').find('input[type="hidden"]').val();
                if (!taf) {
                    throw new errors.NotFound('Taf not found');
                }
                // get only the string that contains starting in TAF
                const tafString = taf.substring(taf.indexOf('TAF') + 3).replace(/[^a-zA-Z0-9/]/g, ' '); // remove all except slash
                return tafString;
            })
            .catch(() => {
                console.log('Taf not found');
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
                const metarString = metar.substring(metar.indexOf('METAR') + 5).replace(/[^a-zA-Z0-9/]/g, ' '); // remove all except slash
                return metarString;
            })
            .then(metarString => {
                const metar = metarParser(metarString);
                return {
                    raw: metarString,
                    parsed: metar,
                    translated: this.translateMetar(metar)
                };
            })
            .catch((error) => {
                console.log('Metar not found');
            });
    }

    translateMetar (metar) {
        // function that converts metar model to an spanish string
        let str = '';
        const data = metar;
        const time = data.time;
        const wind = data.wind;
        str += 'Metar de las ' + ('0' + time.hour).slice(-2) + ':' + ('0' + time.minute).slice(-2) + ' del ' + time.day + '. ';
        str += 'Viento ' + wind.direction + ' a ' + wind.speedKt + ' nudos. ';
        if (wind.gust) {
            str += 'Rafagas a ' + wind.gust + ' nudos. ';
        }
        if (wind.variation !== null) {
            str += 'Variable de los ' + wind.variation.min + ' a ' + wind.variation.max + ' grados.';
        }
        if (data.visibility !== null) {
            str += 'Visibilidad ' + data.visibility.meters + ' metros. ';
        }
        if (data.temperature !== null) {
            str += ' Temperatura ' + data.temperature.celsius + ' grados. ';
        }
        if (data.dewpoint !== null) {
            str += 'Punto de rocio ' + data.dewpoint.celsius + ' grados. ';
        }
        if (data.clouds.length > 0) {
            str += 'Nubes ';
            data.clouds.forEach(function (cloud) {
                str += cloud.meaning + ' a ' + cloud.altitude + ' pies. ';
            });
        }
        if (data.altimeter !== null) {
            str += 'Altimetro ' + data.altimeter.millibars + ' hPa. ';
        }

        return str;
    }
}

module.exports = Smn;
