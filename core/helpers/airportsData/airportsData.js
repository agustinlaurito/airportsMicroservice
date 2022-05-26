'use strict';

const bluebird = require('bluebird');
const lodash = require('lodash');
const axios = require('axios');
const config = require('../../../config/airportsApi');
const P = require('bluebird');
const errors = require('http-errors');
const csvToJson = require('convert-csv-to-json');

class AirportsData {

    fetch () {
        const context = {
            rawData: [],
        };

        return P.bind(this)
            .then(() => this.readCsv(context))
            .then(() => this.parseAirports(context))
            .then(() => {
                return context.parsedAirports;
            });
    }

    readCsv (context) {

        const csvFilePath = './data/airports.csv';
        const jsonArray = csvToJson.fieldDelimiter(';').getJsonFromCsv(csvFilePath);
        context.rawData = jsonArray;
        return context;
    }

    parseAirports (context) {

        const airportsList = context.rawData;
        const airports = [];

        airportsList.forEach((airport) => {
            const airportData = {
                localCode: airport.local,
                oaciCode: airport.oaci,
                iataCode: airport.iata,
                type: airport.type,
                name: airport.denominacion,
                coordinates: airport.coordenadas,
                geometry: {
                    type: 'Point',
                    coordinates: [
                        airport.latitud,
                        airport.longitud,
                    ],
                },
                elevation: airport.elev,
                elevationUnit: airport.uom_elev,
                reference: airport.ref,
                distanceToReference: airport.distancia_ref,
                directionToReference: airport.direccion_ref,
                public: airport.condicion === 'PUBLICO' ? true : false,
                private: airport.condicion === 'PRIVADO' ? true : false,
                controlled: airport.control === 'CONTROL' ? true : false,
                region: airport.region,
                fir: airport.fir,
                use: airport.uso,
                traffic: airport.trafico,
                province: airport.provincia,
                isActive: airport.inhab == 'NO' ? false : true,
                
            };
            airports.push(airportData);
        });

        context.parsedAirports = airports;
        console.log(context.parsedAirports);
        return context;
    }


}

module.exports = AirportsData;
