'use strict';

const P = require('bluebird');
const AirportsData = require('../../helpers/services/airportsData');
const Base = require('../../helpers/route');
const _ = require('lodash');
const Madhel = require('../../helpers/services/madhel');
const Smn = require('../../helpers/services/smn');
const CoordinateHelper = require('../../helpers/coordinates');
const Aip = require('../../helpers/services/aip');

class Route extends Base {
    handler () {
        const context = {};

        return P.bind(this)
            .then(() => this.fetchCsv(context))
            .then(() => this.populateAirports(context));
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

    async populateAirports (context) {
        const promises = [];

        if (!this.options.query.with) { return context.result; };

        _.each(context.parsedAirports, (airport) => {
            if (this.options.query.with.indexOf('madhel') > -1) {
                const madhelService = new Madhel();
                promises.push(madhelService.getAirport(airport.localCode)
                    .then((madhelAirport) => {
                        _.merge(airport, madhelAirport);
                    }));
            }

            if (this.options.query.with.indexOf('metar') > -1) {
                const smnService = new Smn();
                promises.push(smnService.getByOaciCode(airport.oaciCode)
                    .then((metar) => {
                        airport.metar = metar;
                        return airport;
                    }));
            }

            if (this.options.query.with.indexOf('taf') > -1) {
                const smnService = new Smn();
                promises.push(smnService.getTafByOaciCode(airport.oaciCode)
                    .then((taf) => {
                        airport.taf = taf;
                        return airport;
                    }));
            }

            if (this.options.query.with.indexOf('aip') > -1) {
                const aipService = new Aip();
                promises.push(aipService.getOne(airport.oaciCode)
                    .then((aip) => {
                        airport.aip = aip;
                        return airport;
                    }));
            }

            if (this.options.query.with.indexOf('directions') > -1) {
                const aiportCoordinates = airport.geometry.coordinates;
                if (aiportCoordinates) {
                    const coordinator = new CoordinateHelper(aiportCoordinates, { lat: this.options.query.lat, lng: this.options.query.lng });
                    const directions = coordinator.getDirections();
                    airport.directions = directions;
                }
            }

            if (this.options.query.with.indexOf('metar') > -1) {
                if (!airport.closestAirport) {
                    return;
                }
                const smnService = new Smn();
                promises.push(smnService.getByOaciCode(airport.closestAirport.oaciCode)
                    .then((metar) => {
                        airport.closestAirport.metar = metar;
                        return airport;
                    }));
            }
        });

        return P.all(promises)
            .then(() => {
                context.result = context.parsedAirports;
                return context.result;
            });
    }
}

module.exports = new Route().handlerize();
