'use strict';

const axios = require('axios');
const config = require('../../../config/madhel');
const P = require('bluebird');
const errors = require('http-errors');
const https = require('https');
const _ = require('lodash');
const FormData = require('form-data');

function telephoneParser (telephones) {
    if (telephones.length === 0) { return null; }
    const result = _.flatMap(telephones, (telephone, index) => {
        if(!telephone){return []}

        let type = 'No Especificado';
        let number = telephone;

        if(telephone.indexOf('-') > -1){
            number = telephone.split('-')[0];
            type = telephone.split('-')[1];
        }
        const reg = new RegExp('^[( 0 -9 )]+$');
        if(!reg.test(telephone) && reg.test(telephones[index + 1])){
            number = _.cloneDeep(telephones[index + 1]);
            type = telephone;
            telephones[index + 1] = null;
        }
        else if(!reg.test(telephone)){
            type = telephone.replace(/[-(0-9)]/g, '');
            number = telephone.replace(/[^ (0-9).]/g, '').replace(/\(.\s*\)/g, "");
        }
        return{
            type,
            number
        };
    })
    return result;
}

function parseNorms (norms) {
    if (norms.length === 0) { return null; }
    const result = [];
    const keys = Object.keys(norms);
    _.each(keys, (key) => {
        // get the content of the key
        const type = _.startCase(_.toLower(key)); // to upper;
        const content = norms[key].content;
        // get the related documents of the key
        const relatedDocuments = norms[key].related_documents;
        // create the object
        const obj = {
            type,
            content,
            relatedDocuments,
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
            helpers: rules,
        };
        // push the object to the result array
        result.push(obj);
    });
    if (result.length === 0) { return ''; }
    return result;
}

function parseAts (ats) {
    const result = _.map(ats, string => {   
        const frequency = string.match('[0-9][0-9][0-9][,][0-9][0-9]')[0];
        const dependency = string.substring(0,string.indexOf('-')).replace(frequency, '').replace('\t', ' ').replaceAll(/[^\w\sÁÉÍÓÚáéíóúñÑ]|MHz/gi,'').trim();
        const description = string.substring(string.indexOf('-') + 1, string.length).trim();
        return {
            frequency,
            dependency,
            description
        }
    });
    return result;
}

function parseAprons (aprons, taxiways) {
    const apns = [];
    const twys = [];

    _.each(aprons, (selected) => {
        _.each(selected.split('.'), (ap) => {
            const apn = ap.replace(/\//g, ' ').replace(/"/g, '');
            if (apn.length) {
                apns.push(apn);
            }
        });
    });

    _.each(taxiways, (selected) => {
        // replace the /n with spaces and remove backslashes, quotes and \t
        const taxiway = selected.replace(/\\/g, '').replace(/\t/g, ' ');
        twys.push(taxiway);
    });
    // merge the arrays
    const apronTwy = {
        taxiways: twys,
        aprons: apns,
    };
    return apronTwy;
}

function parseNotamDescription (notam) {
    /**
     * "IN IAC 1 ILS ILS Z RWY 11 AND IAC 2 ILS Y RWY 11 AMDT AIRAC 1/22 WEF 21 APR 2022, IAC 3 ILS X RWY 11 AND IAC 4 ILS W RWY 11 AMDT A 1/16 WEF 07 JAN 2016 IN PLAN VIEW AND PROFILE VIEW OM AND MM NOT AVBL <span id=\"versionbreak\">Versión en Español:</span>EN IAC 1 ILS ILS Z RWY 11 Y IAC 2 ILS Y RWY 11 AMDT AIRAC 1/22 WEF 21 APR 2022, IAC 3 ILS X RWY 11 Y IAC 4 ILS W RWY 11 AMDT A 1/16 WEF 07 JAN 2016 EN VISTA DE PLANTA Y PERFIL OM Y MM NO AVBL"
     */
    // split the string where the word Versión en Español appears
    if (notam.indexOf('Versión en Español:') < 1) {
        return notam;
    }

    const split = notam.split('<span id="versionbreak">');
    const firstPart = split[0];
    const secondPart = split[1].replace('</span>', '').replace('Versión en Español', 'Version en Español ');

    return {
        english: firstPart,
        spanish: secondPart,
    };
}

function parseRunways (runways) {
    const result = [];
    const parsedRunways = [];
    _.each(runways, (runway) => {
        // const regex = /(\d{2}[R|L]?\/\d{2}[R|L]?)/g;
        // same as above, but having in account that after the numbers and before the R L could be a space
        const regex = /(\d{2}[ ]?[R|L]?\/\d{2}[ ]?[R|L]?)/g;
        let runwayNumbers = runway.match(regex);

        // check if runwayNumbers is an array
        if (runwayNumbers instanceof Array) {
            runwayNumbers = runwayNumbers[0];
        }

        if (runwayNumbers === null) { return; }
        if (runway.search(/(\d{2}\/\d{2})/g) > 3) { return; }

        const runwayWidth = runway.split(' ')[1] || '';
        const runwayType = runway.split('-')[1] || '';

        // check if runwaynumbers is already in the array
        const prevIndex = parsedRunways.indexOf(runwayNumbers);
        if (prevIndex > -1) {
            // if it is, add the width and the runway type to the existing object
            result[prevIndex].surface += runwayType;
            return;
        }
        // remove all spaces from the runway numbers
        const _runwayNumbers = runwayNumbers.replace(/\s/g, '');

        parsedRunways.push(runwayNumbers);
        result.push({
            numbers: _runwayNumbers.toString(),
            width: runwayWidth,
            surface: runwayType,
        });
    });
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
            .then(() => this.fetchNotam(context))
            .then(() => this.parseNotam(context))
            .then(() => this.parseAirport(context))
            .catch(() => {
                return null;
            });
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
        .catch(() => {
            return P.resolve();
        });
    }

    fetchNotam (context) {
        const formData = new FormData();
        formData.append('indicador', this.targetAirport);

        return axios.post(config.notamUrl, formData, {
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        })
            .then(response => {
                context.notam = response.data;
            })
            .catch(() => {
                return P.resolve();
            });
    }

    parseNotam (context) {
        const notam = context.notam;
        const notamArray = [];

        _.each(notam, (notamItem) => {
            const notamObj = {
                ad: notamItem.ad,
                indicador: notamItem.indicador,
                number: notamItem.notam,
                valid: {
                    desde: notamItem.desde,
                    hasta: notamItem.hasta,
                },
                description: parseNotamDescription(notamItem.novedad),
            };
            notamArray.push(notamObj);
        });
        context.notam = notamArray;
    }

    parseAirport (context) {
        const airport = context.rawData;
        const airportData = {
            name: airport.human_readable_identifier,
            localCode: airport.data.local,
            runways: parseRunways(airport.data.rwy),
            telephones: telephoneParser(airport.data.telephone),
            fuel: airport.data.fuel,
            workingHours: airport.data.service_schedule,
            humanReadableLocation: airport.data.human_readable_localization,
            helpers: parseHelpers(airport.data.helpers_system),
            norms: parseNorms(airport.data.norms),
            ats: parseAts(airport.data.ats),
            atz: airport.data.atz,
            thr: airport.data.thr,
            runwayDistaces: airport.data.rwy_declared_distances,
            apronTwy: parseAprons(airport.data.apn, airport.data.twy),
            status: airport.metadata.status,
            type: airport.type,
            updatedAt: airport.updated_at,
            notam: context.notam,
        };
        return airportData;
    }
}

module.exports = MadhelService;
