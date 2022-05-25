'use strict';

const bluebird = require('bluebird');
const lodash = require('lodash');
const axios = require('axios');
const config = require('../../../config/airportsApi');
const P = require('bluebird');

class AirportsApi {
    constructor() {
        this.airports = [];
    }

    async getAirports() {

        const baseUrl = config.baseUrl;

        return axios.get(baseUrl, {
            params: {
                f: 'json',
                where: '1=1',
                outFields: '*',
                outSR: 4326,
            }
        })
            .then(response => {
                console.log(response.data);
            })

    }

}

module.exports = AirportsApi;