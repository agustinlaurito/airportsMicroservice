'use strict';

const P = require('bluebird');
const AirportsData = require('../../helpers/services/airportsData');
const Base = require('../../helpers/route');
const _ = require('lodash');
const Madhel = require('../../helpers/services/madhel');
const Smn = require('../../helpers/services/smn');
const coordinateHelper = require('../../helpers/coordinates');

class Autocomplete extends Base {

    handler () {
        const context = {};

        return P.bind(this)
            .then(() => this.fetchCsv(context))
            .then(() => this.getIndexes(context))
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
        // make a list to search in for any airport using localCode, iataCode, icaoCode or name
        const indexes = _.map(context.parsedAirports, (airport) => {
            return {
                localCode: airport.localCode,
                iataCode: airport.iataCode,
                icaoCode: airport.icaoCode,
                name: airport.name
            };
        });

        context.indexes = indexes;
        return context.indexes;
    }



        
}

module.exports = new Autocomplete().handlerize();
