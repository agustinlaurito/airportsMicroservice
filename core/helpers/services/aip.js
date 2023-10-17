'use strict';

const axios = require('axios');
const config = require('../../../config/aip');
const cheerio = require('cheerio');
const P = require('bluebird');
const _ = require('lodash');

class Aip {

    getCharts (target) {
        this.targetAirport = target; // 4 letter code
        const context = {
            rawData: '',
        };
        return P.bind(this)
            .then(() => this.process(context))
            .catch(() => {
                return null;
            });
    }

    process(context){
        const promises = [];
        promises.push(
            this.fetchData(config.aipChartsList, context)
                .then((apts => context.aipList = apts))
        );
        promises.push(
            this.fetchData(config.aipADChartsList, context)
                .then((apts => context.adList = apts))
        )
        
        return P.all(promises)
            .then(() => {
                return {
                    charts: context.aipList,
                    ad: context.adList
                }
            })
    }

    fetchData (URL) {
        const options = {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            }
        };
        return axios.get(URL, options)
            .then(response => {
                return this.parseData(response.data);
            })
            .catch(() => {
                return P.resolve();
            });
    }

    parseData(data) {

        const cheerio = require('cheerio');

        const $ = cheerio.load(data);
        const hrefs = [];

        $('tr').each((i, tr) => {
            const $tr = $(tr);
            const $td = $tr.find('td');
            const $a = $td.find('a');
            const targetText = $tr.find('td:nth-child(1)').text().trim();
            
            // Extracting ICAO codes using regex. ICAO codes are four-letter alphanumeric code designators.
            const regex = /\b[a-zA-Z]{4}\b/g;
            let match;
            let found = false;
            while ((match = regex.exec(targetText)) !== null) {

                if (match[0] === this.targetAirport) {
                    found = true;
                    break; // If we found the targetAirport, no need to continue the loop
                }
                
            }


            if (found) { // this will only be true if targetText contains the exact targetAirport code
                const href = $a.attr('href');
                const text = $a.text();

                if(!href || !text) return;

                hrefs.push({
                    href: config.aipBaseUrl + href,
                    text: targetText // changed from 'text' to 'targetText' to store the airport information
                });
            }
        });

        return hrefs;
    }

}

module.exports = Aip;
