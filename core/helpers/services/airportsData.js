'use strict';

const P = require('bluebird');
const _ = require('lodash');
const errors = require('http-errors');
const fs = require('fs');

class AirportsData {
    fetch (options) {
        this.options = options;
        this.options.page = this.options.page ? this.options.page : 1;
        const context = {
            rawData: [],
        };

        return P.bind(this)
            .then(() => this.readJson(context))
            .then(() => this.filter(context))
            .then(() => {
                return context.parsedAirports;
            });
    }

    readJson (context) {
        const jsonFilePath = './data/airports.json';
        const jsonArray = JSON.parse(fs.readFileSync(jsonFilePath));
        context.parsedAirports = jsonArray;
        return context;
    }

    filter (context) {
        const airports = context.parsedAirports;

        const filters = this.options.filters;
        let filteredAirports = [];
        if (filters) {
            filteredAirports = _.filter(airports, (airport) => {
                return _.every(filters, (value, key) => {
                    return airport[key] === value;
                });
            });

            if (filteredAirports.length === 0) {
                throw new errors.NotFound('No se encontraron aeropuertos con los filtros especificados');
            }
        }
        else {
            filteredAirports = airports;
        }

        context.parsedAirports = filteredAirports.slice(this.options.pageSize * (this.options.page - 1), this.options.pageSize * this.options.page);
        return context;
    }
}

module.exports = AirportsData;
