'use strict';

const P = require('bluebird');
const csvToJson = require('convert-csv-to-json');
const _ = require('lodash');
class AirportsData {

    fetch (options) {

        this.options = options;
        
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
            
            if(this.options.filters){
                _.each(this.options.filters, (filterValue, filterKey) => {
                    if(airportData[filterKey] !== filterValue) {
                        return;
                    }
                    airports.push(airportData);
                });
            }else{
                airports.push(airportData);
            }
        
        });
        
        context.parsedAirports = airports.slice(this.options.pageSize * (this.options.page - 1), this.options.pageSize * this.options.page);
        return context;
    }
}

module.exports = AirportsData;
