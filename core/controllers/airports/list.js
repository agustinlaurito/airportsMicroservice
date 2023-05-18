'use strict';

const P = require('bluebird');
const AirportsData = require('../../helpers/services/airportsData');
const Base = require('../../helpers/route');
const _ = require('lodash');
const Madhel = require('../../helpers/services/madhel');
const Smn = require('../../helpers/services/smn');
const CoordinateHelper = require('../../helpers/coordinates');
const Aip = require('../../helpers/services/aip');
const GeoJSON = require('geojson');

class Route extends Base {
    handler () {
        const context = {};

        console.log(`Requested ${this.options.query.filters.localCode}`);
        return P.bind(this)
            .then(() => this.fetchCsv(context))
            .then(() => this.populateAirports(context))
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

    async populateAirports (context) {
        const promises = [];

        if (!this.options.query.with) { return context.result; };
        _.each(context.parsedAirports, (airport) => {
            if (this.options.query.with.toUpperCase().indexOf('MADHEL') > -1) {
                const madhelService = new Madhel();
                promises.push(madhelService.getAirport(airport.localCode)
                    .then((madhelAirport) => {
                        _.merge(airport, madhelAirport);
                    }));
            }

            if (this.options.query.with.toUpperCase().indexOf('METAR', ) > -1) {
                const smnService = new Smn();
                promises.push(smnService.getByOaciCode(airport.oaciCode)
                    .then((metar) => {
                        airport.metar = metar;
                        return airport;
                    }));
            }

            if (this.options.query.with.toUpperCase().indexOf('TAF') > -1) {
                const smnService = new Smn();
                promises.push(smnService.getTafByOaciCode(airport.oaciCode)
                    .then((taf) => {
                        airport.taf = taf;
                        return airport;
                    }));
            }

            if (this.options.query.with.toUpperCase().indexOf('AIP') > -1) {
                const aipService = new Aip();
                promises.push(aipService.getCharts(airport.oaciCode)
                    .then((aip) => {
                        airport.aip = aip;
                        return airport;
                    })); 
            }

            if (this.options.query.with.toUpperCase().indexOf('DIRECTIONS') > -1) {
                const aiportCoordinates = airport.geometry.coordinates;
                if (aiportCoordinates) {
                    const coordinator = new CoordinateHelper(aiportCoordinates, { lat: this.options.query.lat, lng: this.options.query.lng });
                    const directions = coordinator.getDirections();
                    airport.directions = directions;
                }
            }
        });

        return P.all(promises)
            .then(() => {
                context.result = context.parsedAirports;
                return context.result;
            });
    }

    parseToGeoJSON(context) {
        
        if (!this.options.query.as || !this.options.query.as.toUpperCase().indexOf('GEOJSON') < -1) return context.result;

        context.result = context.result.map(airport => {
            const options = {
                Point: ['geometry.coordinates.lat', 'geometry.coordinates.lng'],
                include: ['name', 'shortName', 'localCode', 'oaciCode', 'iataCode']
            }
            const object = GeoJSON.parse(airport, options);
     
            object.extra = {};
     
            Object.keys(airport).forEach(key => {
                if (!options.include.includes(key) && key !== 'geometry') {
                    object.extra[key] = airport[key];
                }
            });
            return object;
        })

        return context.result;
    }
}

module.exports = new Route().handlerize();
