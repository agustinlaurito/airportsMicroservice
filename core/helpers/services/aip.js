'use strict';

const axios = require('axios');
const config = require('../../../config/aip');
const errors = require('http-errors');
const cheerio = require('cheerio');
const metarParser = require('metar-parser');
const P = require('bluebird');
const https = require('https');
const _ = require('lodash');


class Aip {

    getCharts (targets) {
        this.targetAirports = targets; // 4 letter code

        const context = {
            rawData: "",
        };

        return P.bind(this)
            .then(() => this.fetchData(context))
            .then(() => this.parseData(context))
    }

    fetchData (context) {
        const url = config.aipChartsList;
        const options = {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            }
        }
        

        return axios.get(url,options)
            .then(response => {
                context.response = response.data;
            })
            .catch(error => {
                console.log('Could not fetch data from AIP');
                return P.resolve();
            });
    }

    async parseData (context) {
        const $ = cheerio.load(context.response);
        const aipAirports = [];

        await $('tr').each((i, tr) => {
            const $tr = $(tr);
            const $td = $tr.find('td');
            const $a = $td.find('a');

            const hrefs = $a.map((i, a) => {
                return {
                    href: config.aipBaseUrl + $(a).attr('href'),
                    text: $(a).text()
                }
            }).get();
            const target = $td.first().text();
            
            _.each(this.targetAirports, (airport) => {
                if (target.indexOf(airport) > -1) {
                    aipAirports.push({
                        airport: airport,
                        links: hrefs,
                    });
                }
            });
        })

        context.aipAirports = aipAirports;
        return P.resolve(aipAirports);
    }


}

module.exports = Aip;
