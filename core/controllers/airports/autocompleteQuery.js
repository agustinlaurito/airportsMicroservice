'use strict';

const P = require('bluebird');
const AirportsData = require('../../helpers/services/airportsData');
const Base = require('../../helpers/route');
const _ = require('lodash');

class Autocomplete extends Base {
    handler () {
        const context = {};

        return P.bind(this)
            .then(() => this.fetchCsv(context))
            .then(() => this.getIndexes(context));
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
            return {
                id: index++,
                localCode: airport.localCode,
                iataCode: airport.iataCode,
                oaciCode: airport.oaciCode,
                name: airport.name,
                description
            };
        });

        context.indexes = indexes;
        return context.indexes;
    }
}

module.exports = new Autocomplete().handlerize();
