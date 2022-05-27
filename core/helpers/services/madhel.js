'use strict';

const axios = require('axios');
const config = require('../../../config/madhel');
const P = require('bluebird');
const errors = require('http-errors');
const https = require('https');

class MadhelService {
    getAirport (target) {
        this.targetAirport = target; // 3 letter code of the airport

        const context = {
            rawData: [],
        };

        return P.bind(this)
            .then(() => this.fetchData(context))
            .then(() => this.parseAirport(context));
    }

    fetchData (context) {
        const url = config.baseUrl + this.targetAirport;

        return axios.get(url, {
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        })
            .then(response => {
                if (response.data.length === 0) {
                    throw new errors.NotFound('No se encontraron datos para el aeropuerto');
                }
                context.rawData = response.data;
            })
            .catch(error => {
                throw new errors.InternalServerError('Error al obtener los datos', error);
            });
    }

    parseAirport (context) {
        const airport = context.rawData;
        const airportData = {
            name: airport.human_readable_identifier,
            localCode: airport.data.local,
            runways: airport.data.rwy,
            telephones: airport.data.telephone,
            fuel: airport.data.fuel,
            workingHours: airport.data.service_schedule,
            humanReadableLocation: airport.data.human_readable_localization,
            helpers: airport.data.helpers_system ? airport.data.helpers_system : [],
            norms: airport.data.norms ? airport.data.norms : [],
            ats: airport.data.ats,
            atz: airport.data.atz,
            thr: airport.data.thr,
            twy: airport.data.twy,
            runwayDistaces: airport.data.rwy_declared_distances,
            apron: airport.data.apn,
            status: airport.metadata.status,
            type: airport.type,
            updatedAt: airport.updated_at,
        };

        return airportData;
    }
}

module.exports = MadhelService;
