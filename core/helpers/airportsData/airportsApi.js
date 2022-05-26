'use strict';

const bluebird = require('bluebird');
const lodash = require('lodash');
const axios = require('axios');
const config = require('../../../config/airportsApi');
const P = require('bluebird');
const errors = require('http-errors');

class AirportsApi {

    fetchData () {
        const context = {
            airportsList: [],
        };

        return P.bind(this)
            .then(() => this.getAirports(context))
            .then(() => this.parseAirports(context));
    }

    getAirports (context) {
        const baseUrl = config.baseUrl;
        const opts = {
            params: {
                where: '1=1',
                outFields: '*',
                f: 'json',
            }
        };
        return axios.get(baseUrl, opts)
            .then(response => {
                context.airportsList = response.data.features;
            })
            .catch(error => {
                throw new errors.InternalServerError('Error al obtener los aeropuertos', error);
            });
    }

    parseAirports (context) {
        //console.log(context.airportsList);
    }
}

module.exports = AirportsApi;
