'use strict';

const axios = require('axios');
const config = require('../../../config/aip');
const cheerio = require('cheerio');
const P = require('bluebird');
const _ = require('lodash');

class Aip {

    getOne (airport) {
        const context = {
            rawData: '',
        };
        this.targetAirports = [airport];

        return P.bind(this)
            .then(() => this.fetchData(context))
            .then(() => this.parseData(context))
            .then(() => {
                console.log('aipAirports', context.aipAirports);
                return context.aipAirports[0].links;
            })
            .catch((err) => {
                return null;
            });
    }

    getCharts (targets) {
        this.targetAirports = targets; // 4 letter code
        console.log('targets', targets);
        const context = {
            rawData: '',
        };

        return P.bind(this)
            .then(() => this.fetchData(context))
            .then(() => this.parseData(context))
            .catch((err) => {
                return null;
            });
    }

    fetchData (context) {
        const url = config.aipChartsList;
        const options = {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            }
        };

        return axios.get(url, options)
            .then(response => {
                context.response = response.data;
            })
            .catch(() => {
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
                };
            }).get();
            const target = $td.first().text();

            _.each(this.targetAirports, (airport) => {
                if (target.indexOf(airport) > -1) {
                    aipAirports.push({
                        airport,
                        links: hrefs,
                    });
                }
            });
        });

        context.aipAirports = aipAirports;
        return P.resolve(aipAirports);
    }
}

module.exports = Aip;
