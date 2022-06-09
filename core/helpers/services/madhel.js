'use strict';

const axios = require('axios');
const config = require('../../../config/madhel');
const P = require('bluebird');
const errors = require('http-errors');
const https = require('https');
const _ = require('lodash');

function telephoneParser (telephones) {
    if (telephones.length === 0) { return null; }

    const result = [];
    _.each(telephones, (telephone) => {
        const telephoneData = {
            number: telephone.split(' - ')[0],
            type: telephone.split(' - ')[1] || 'Contacto',
        };
        result.push(telephoneData);
    });
    return result;
}

function parseNorms (norms) {
    
            if (norms.length === 0) { return null; }
            let result = [];
            const keys = Object.keys(norms);
            _.each(keys, (key) => {
                // get the content of the key
                const type = _.startCase(_.toLower(key)); // to upper;
                const content = norms[key].content;
                // get the related documents of the key
                const related_documents = norms[key].related_documents;
                // create the object
                const obj = {
                    type,
                    content,
                    related_documents,
                };
                // push the object to the result array
                result.push(obj);
            });
            return result;
}

function parseHelpers (helpers) {
    if (helpers.length === 0) { return null; }
    // { visual: '', radio: [] }
    // thats a response from the api. in that case, result should be empty


    
    const result = [];
    const keys = Object.keys(helpers);
    _.each(keys, (key) => {
        // get the content of the key
        const type = _.startCase(_.toLower(key)); // to upper;
        let rules = helpers[key];
        if (rules.length === 0) { return null; }
        // if rules is text
        if (typeof rules === 'string') {
            // split in /n and save in array
            rules = rules.split('\r\n');
        }
        const obj = {
            type,
            helpers : rules,
        };
        // push the object to the result array
        result.push(obj);
    });
    if (result.length === 0) { return ""; }
    return result;
}

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
            telephones: telephoneParser(airport.data.telephone),
            fuel: airport.data.fuel,
            workingHours: airport.data.service_schedule,
            humanReadableLocation: airport.data.human_readable_localization,
            helpers: parseHelpers(airport.data.helpers_system),
            norms: parseNorms(airport.data.norms),
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
