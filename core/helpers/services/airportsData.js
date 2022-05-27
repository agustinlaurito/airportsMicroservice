'use strict';

const P = require('bluebird');
const csvToJson = require('convert-csv-to-json');
const _ = require('lodash');
const errors = require('http-errors');

class AirportsData {
    fetch (options) {
        this.options = options;

        const context = {
            rawData: [],
        };

        return P.bind(this)
            .then(() => this.readCsv(context))
            .then(() => this.parseAirports(context))
            .then(() => this.filter(context))
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
                public: airport.condicion === 'PUBLICO',
                private: airport.condicion === 'PRIVADO',
                controlled: airport.control === 'CONTROL',
                region: airport.region,
                fir: airport.fir,
                use: airport.uso,
                traffic: airport.trafico,
                province: airport.provincia,
                isActive: airport.inhab !== 'NO',

            };
            airports.push(airportData);
        });
        context.parsedAirports = airports;
        return context;
    }

    filter (context) {
        const airports = context.parsedAirports;

        const filters = this.options.filters;
        let filteredAirports = [];
        if (filters) {
            filteredAirports = _.filter(airports, (airport) => {
                return _.every(filters, (value, key) => {
                    return airport[key] === value;
                });
            });

            if (filteredAirports.length === 0) {
                throw new errors.NotFound('No se encontraron aeropuertos con los filtros especificados');
            }
        }
        else {
            filteredAirports = airports;
        }

        context.parsedAirports = filteredAirports.slice(this.options.pageSize * (this.options.page - 1), this.options.pageSize * this.options.page);
        return context;
    }
}

module.exports = AirportsData;
