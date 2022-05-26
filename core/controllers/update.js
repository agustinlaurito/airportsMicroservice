'use strict';

const bluebird = require('bluebird');
const lodash = require('lodash');
const axios = require('axios');
const P = require('bluebird');
const errors = require('http-errors');
const airportsData = require('../helpers/airportsData/airportsData');
const Base = require('../helpers/route');
const _ = require('lodash');

class Update extends Base {
   
    handler () {

        const context = {};

        return P.bind(this)
            .then(() => this.fetchAirports(context))
            // .then(() => {
            //     return context.parsedAirports;
            // })
    }

    fetchAirports (context) {
            
            const airportFetcher = new airportsData();
    
            return airportFetcher.fetch()
                .then((parsedAirports) => {
                    context.parsedAirports = parsedAirports;
                    context.result = parsedAirports;
                    return context;
                });
    }

}

module.exports = new Update().handlerize();