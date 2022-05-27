'use strict';

const P = require('bluebird');
const AirportsData = require('../../helpers/services/airportsData');
const Base = require('../../helpers/route');
const _ = require('lodash');
const Madhel = require('../../helpers/services/madhel');
const Smn = require('../../helpers/services/smn');

class Update extends Base {
    handler () {
        const context = {};

        return P.bind(this)
            .then(() => this.fetchCsv(context))
            .then(() => this.fetchMadhel(context))
            .then(() => this.fetchMetar(context));
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

    fetchMadhel (context) {
        if (!this.options.query.with || this.options.query.with.indexOf('madhel') === -1) {
            context.result = context.parsedAirports;
            return context.parsedAirports;
        }

        const resultAirports = [];
        const promises = [];

        _.each(context.parsedAirports, (airport) => {
            const madhelService = new Madhel();
            promises.push(madhelService.getAirport(airport.localCode)
                .then((madhelData) => {
                    const mergedAirport = _.merge(airport, madhelData);
                    resultAirports.push(mergedAirport);
                })
            );
        });
        return P.all(promises)
            .then(() => {
                context.result = resultAirports;
                return resultAirports;
            });
    }

    fetchMetar (context) {
        if (!this.options.query.with || this.options.query.with.indexOf('metar') === -1) {
            context.result = context.result;
            return context.result;
        }

        const resultAirports = [];
        const promises = [];

        _.each(context.result, (airport) => {
            const smnService = new Smn();
            promises.push(smnService.getByOaciCode(airport.oaciCode)
                .then((metar) => {
                    // create attribute metar
                    airport.metar = metar;
                    resultAirports.push(airport);
                })
            );
        });
        return P.all(promises)
            .then(() => {
                context.result = resultAirports;
                return resultAirports;
            });
    }
}

module.exports = new Update().handlerize();
