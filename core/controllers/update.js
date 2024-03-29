'use strict';

const P = require('bluebird');
const AirportsData = require('../helpers/services/airportsData');
const Base = require('../helpers/route');

class Update extends Base {
    handler () {
        const context = {};

        return P.bind(this)
            .then(() => this.fetchAirports(context));
    }

    fetchAirports (context) {
        const airportFetcher = new AirportsData();

        return airportFetcher.fetch()
            .then((parsedAirports) => {
                context.parsedAirports = parsedAirports;
                context.result = parsedAirports;
                return context;
            });
    }
}

module.exports = new Update().handlerize();
