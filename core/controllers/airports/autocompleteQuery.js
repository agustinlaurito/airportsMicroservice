'use strict';

const P = require('bluebird');
const AirportsData = require('../../helpers/services/airportsData');
const Base = require('../../helpers/route');
const _ = require('lodash');
const GeoJSON = require('geojson');


class Autocomplete extends Base {
    handler () {
        const context = {};

        return P.bind(this)
            .then(() => this.fetchCsv(context))
            .then(() => this.getIndexes(context))
            .then(() => this.parseToGeoJSON(context))
    }

    fetchCsv (context) {
        const airportFetcher = new AirportsData();

        return airportFetcher.fetch(this.options.query)
            .then((parsedAirports) => {
                context.parsedAirports = parsedAirports;
                context.result = parsedAirports;
                return context;
            });
    }

    getIndexes (context) {
        let index = 0;
        // make a list to search in for any airport using localCode, iataCode, icaoCode or name
        const indexes = _.map(context.parsedAirports, (airport) => {
            let description = `${airport.name} - ${airport.localCode}`;
            // airport.oaciCode ? (description += ` - ${airport.oaciCode}`) : null;
            if (airport.oaciCode) {
                description += ` - ${airport.oaciCode}`;
            }
            const object = {
                id: index++,
                localCode: airport.localCode,
                iataCode: airport.iataCode,
                oaciCode: airport.oaciCode,
                name: airport.name,
                geometry: airport.geometry,
                description
            };

            if (this.options.query.as && this.options.query.as.toUpperCase().indexOf('GEOJSON') > -1) {
                object.shortName = airport.shortName;
                object.geometry = airport.geometry;
            }

            return object;
        });

        context.indexes = indexes;
        return context.indexes;
    }

    parseToGeoJSON(context) {
        if (!this.options.query.as || !this.options.query.as.toUpperCase().indexOf('GEOJSON') < -1) return context.indexes;

        return context.indexes.map(airport => {
        const options = {
            Point: ['geometry.coordinates.lat', 'geometry.coordinates.lng'],
            include: ['name', 'shortName', 'localCode', 'oaciCode', 'iataCode']
        }

            return GeoJSON.parse(airport, options);


        })

    }
}

module.exports = new Autocomplete().handlerize();
