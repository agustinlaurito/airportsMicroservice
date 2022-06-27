'use strict';

const P = require('bluebird');
const AirportsData = require('../../helpers/services/airportsData');
const Base = require('../../helpers/route');
const _ = require('lodash');
const Madhel = require('../../helpers/services/madhel');
const Smn = require('../../helpers/services/smn');
const CoordinateHelper = require('../../helpers/coordinates');
const Aip = require('../../helpers/services/aip');

class Update extends Base {
    handler () {
        const context = {};

        return P.bind(this)
            .then(() => this.fetchCsv(context))
            .then(() => this.populateAirports(context))
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
        let resultAirports = [];
        let promises = [];

        if(!this.options.query.with) { return context.result;};

        _.each(context.parsedAirports, (airport) => {
            
            if(this.options.query.with.indexOf('madhel') > -1) {
                const madhelService = new Madhel();
                promises.push(madhelService.getAirport(airport.localCode)
                    .then((madhelAirport) => {
                        _.merge(airport, madhelAirport);
                    }));
            }

            if(this.options.query.with.indexOf('metar') > -1) {
                const smnService = new Smn();
                promises.push(smnService.getByOaciCode(airport.oaciCode)
                    .then((metar) => {
                        airport.metar = metar;
                        return airport;
                    }));
            }

            if(this.options.query.with.indexOf('taf') > -1) {
                const smnService = new Smn();
                promises.push(smnService.getTafByOaciCode(airport.oaciCode)
                    .then((taf) => {
                        airport.taf = taf;
                        return airport;
                    }));            
                }

            if(this.options.query.with.indexOf('aip') > -1) {
                const aipService = new Aip();
                promises.push(aipService.getOne(airport.oaciCode)
                    .then((aip) => {
                        airport.aip = aip;
                        return airport;
                    }));
            }

            if(this.options.query.with.indexOf('directions') > -1) {
                const aiportCoordinates = airport.geometry.coordinates;
                if (aiportCoordinates) {
                    const coordinator = new CoordinateHelper(aiportCoordinates, { lat: this.options.query.lat, lng: this.options.query.lng });
                    const directions = coordinator.getDirections();
                    airport.directions = directions;
                }
            }

            if(this.options.query.with.indexOf('metar') > -1) {
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
            })
    }

    
}

module.exports = new Update().handlerize();

/**
 * 
 

    fetchAlternateMetar (context) {
        if (!this.options.query.with || this.options.query.with.indexOf('metar') === -1) {
            return context.result;
        }
        const promises = [];
        const resultAirports = [];

        _.each(context.result, (airport) => {
            if (!airport.closestAirport) {
                return;
            }
            const smnService = new Smn();
            promises.push(smnService.getByOaciCode(airport.closestAirport.oaciCode)
                .then((metar) => {
                    // create attribute metar
                    airport.closestAirport.metar = metar;
                    resultAirports.push(airport);
                })
                .catch(() => {
                    airport.closestAirport.metar = null;
                    resultAirports.push(airport);
                }));
        });
        return P.all(promises)
            .then(() => {
                context.result = resultAirports;
                return resultAirports;
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

    fetchAip (context) {
        if (!this.options.query.with || this.options.query.with.indexOf('aip') === -1) {
            return context.result;
        }
        const requestedOacis = _.map(context.result, 'oaciCode');
        const AIPService = new Aip();

        return AIPService.getCharts(requestedOacis)
            .then((aipData) => {
                _.each(context.result, (airport) => {
                    const aip = _.find(aipData, { airport: airport.oaciCode });
                    if (aip) {
                        airport.aip = aip.links;
                    }
                });
                return context.result;
            })
            .catch(() => {
                return P.resolve(context.result);
            });
    }

    fetchMetar (context) {
        if (!this.options.query.with || this.options.query.with.indexOf('metar') === -1) {
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
                }));
        });
        return P.all(promises)
            .then(() => {
                context.result = resultAirports;
                return resultAirports;
            });
    }

    fetchTaf (context) {
        if (!this.options.query.with || this.options.query.with.indexOf('taf') === -1) {
            return context.result;
        }
        const resultAirports = [];
        const promises = [];
        _.each(context.result, (airport) => {
            const smnService = new Smn();
            promises.push(smnService.getTafByOaciCode(airport.oaciCode)
                .then((taf) => {
                    // create attribute taf
                    airport.taf = taf;
                    resultAirports.push(airport);
                }));
        });
        return P.all(promises)
            .then(() => {
                context.result = resultAirports;
                return resultAirports;
            });
    }

        fetchDirections (context) {
        if ((!this.options.query.with || this.options.query.with.indexOf('directions') === -1) && !this.options.query.lat && !this.options.query.lon) {
            return context.result;
        }

        const resultAirports = [];
        const promises = [];
        _.each(context.result, (airport) => {
            const aiportCoordinates = airport.geometry.coordinates;
            if (aiportCoordinates) {
                const coordinator = new CoordinateHelper(aiportCoordinates, { lat: this.options.query.lat, lng: this.options.query.lng });
                const directions = coordinator.getDirections();
                airport.directions = directions;
                resultAirports.push(airport);
            }
        });

        return P.all(promises)
            .then(() => {
                context.result = resultAirports;
                return resultAirports;
            });
    }
 */
