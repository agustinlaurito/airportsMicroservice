'use strict';

const P = require('bluebird');
const AirportsData = require('../../helpers/airportsData/airportsData');
const Base = require('../../helpers/route');
const _ = require('lodash');
const Madhel = require('../../helpers/airportsData/madhel');

class Update extends Base {


    handler (req) {
        const context = {
            opts: _.merge({}, req.query || {}),
        };

        console.log(context);
        return P.bind(this)
            .then(() => this.fetchCsv(context))
            .then(() => this.fetchMadhel(context));

    }

    fetchCsv (context) {
        const airportFetcher = new AirportsData();

        return airportFetcher.fetch(context.opts)
            .then((parsedAirports) => {
                context.parsedAirports = parsedAirports;
                context.result = parsedAirports;
                return context;
            });
    }

    fetchMadhel (context) {
        // loop through the parsedAirports and fetch the madhel data using the local code
        const resultAirports = [];
        const promises = [];

        _.each(context.parsedAirports, (airport) => {
            const madhelService = new Madhel();

            promises.push(madhelService.getAirport(airport.localCode)
                .then((madhelData) => {
                    // merge both objects and add the madhel data to the airport
                    const mergedAirport = _.merge(airport, madhelData);
                    resultAirports.push(mergedAirport);
                })
                .catch((error) => {error}));
            });

            return P.all(promises)
                .then(() => {
                    context.result = resultAirports;
                    return resultAirports;
                });
    }
}

module.exports = new Update().handlerize();
