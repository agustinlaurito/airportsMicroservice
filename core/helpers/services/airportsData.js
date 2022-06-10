'use strict';

const P = require('bluebird');
const csvToJson = require('convert-csv-to-json');
const _ = require('lodash');
const errors = require('http-errors');
const fs = require('fs');

const parseFir = (fir) => {
    let name = '';

    switch (fir) {
        default:
            name = fir;
            break;
        case 'SAVF':
            name = 'FIR Comodoro Rivadavia';
            break;
        case 'SACF':
            name = 'FIR Córdoba';
            break;
        case 'SAEF':
            name = 'FIR Ezeiza';
            break;
        case 'SAMF':
            name = 'FIR Mendoza';
            break;
        case 'SARR':
            name = 'FIR Resistencia';
            break;
    }

    return {
        name,
        code: fir
    };
};

class AirportsData {
    fetch (options) {
        this.options = options;

        const context = {
            rawData: [],
        };

        return P.bind(this)
            .then(() => this.readJson(context))
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

    readJson (context) {
        const jsonFilePath = './data/airports.json';
        const jsonArray = JSON.parse(fs.readFileSync(jsonFilePath));
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
                shortName: airport.denominacion.replace(/\\/g, '').replace(/\//g, ' ').replace(/"/g, ''),
                name: airport.denominacion.replace(/\\/g, '').replace(/\//g, ' ').replace(/"/g, ''),
                coordinates: [
                    airport.coordenadas.replace(/\\/g, '').replace(/\//g, ' ').replace(/"/g, '').split('  ')[0],
                    airport.coordenadas.replace(/\\/g, '').replace(/\//g, ' ').replace(/"/g, '').split('  ')[1],
                ],
                geometry: {
                    type: 'Point',
                    coordinates: {
                        lat: parseFloat(airport.longitud),
                        lng: parseFloat(airport.latitud),
                    }
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
                fir: parseFir(airport.fir),
                use: airport.uso,
                traffic: airport.trafico,
                province: airport.provincia,
                isActive: airport.inhab !== 'NO',
                closestAirport: airport.closestAirport || null,

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
