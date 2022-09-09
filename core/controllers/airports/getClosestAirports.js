'use strict';

const P = require('bluebird');
const AirportsData = require('../../helpers/services/airportsData');
const Base = require('../../helpers/route');
const _ = require('lodash');
const CoordinateHelper = require('../../helpers/coordinates');

const FORBIDDEN_WORDS = ['heli', 'torcuato', 'copter'];

class Route extends Base {
    handler (req) {
        const context = {
            lat: req.query.lat,
            lng: req.query.lng,
            range: req.query.range,
        };

        return P.bind(this)
            .then(() => this.fetchCsv(context))
            .then(() => this.findClosest(context))
            .then(() => this.orderAirports(context))
            .then(() => this.filter(context));
    }

    fetchCsv (context) {
        const airportFetcher = new AirportsData();
        const opt = {
            pageSize: '2000',
        };
        return airportFetcher.fetch(opt)
            .then((parsedAirports) => {
                context.parsedAirports = parsedAirports;
                return context;
            });
    }

    findClosest (context) {
        const closestAirports = [];

        _.each(context.parsedAirports, airport => {
            const aiportCoordinates = airport.geometry.coordinates;
            if (!aiportCoordinates) { return; }

            const coordinator = new CoordinateHelper(aiportCoordinates, { lat: context.lat, lng: context.lng });
            const directions = coordinator.getDirections();
            airport.directions = directions;

            if (airport.directions.distanceNm > context.range) { return; };
            if (_.indexOf(airport.type, 'H') > 0) { return; };
            if (_.indexOf(airport.localCode, 'H') === 0) { return; };
            if (FORBIDDEN_WORDS.some(function (FORBIDDEN) { return _.toString(airport.name).toLowerCase().indexOf(FORBIDDEN) >= 0; })) {
                return;
            }
            if (_.toString(airport.name).toLowerCase().indexOf('heli') > -1) { return; }

            if (!closestAirports.length) {
                closestAirports.push(airport);
                return;
            }
            const sortedIndex = _.sortedIndex(_.map(context.closestAirports, (closest) => closest.directions.distanceNm), directions.airportNm);
            closestAirports.splice(sortedIndex, 0, airport);
        });

        context.closestAirports = closestAirports;
        return context.closestAirports;
    }

    orderAirports (context) {
        context.result = _.sortBy(context.closestAirports, apt => { return apt.directions.distanceNm; });
        return context;
    }

    filter (context) {
        const { pageSize, page } = this.options.query;
        return context.result.slice(pageSize * (page - 1), pageSize * page);
    }
}

module.exports = new Route().handlerize();
