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

    parseData (data) {
        const $ = cheerio.load(data);
        let hrefs = [];

        $('tr').each((i, tr) => {
            const $tr = $(tr);
            const $td = $tr.find('td');
            const $a = $td.find('a');
            const target = $td.first().text();

            if (target.indexOf(this.targetAirport) < 0) {
                return;
            }
            
            hrefs = $a.map((i, a) => {
                return {
                    href: config.aipBaseUrl + $(a).attr('href'),
                    text: $(a).text()
                };
            }).get();
        });
        
        return hrefs;

    }
}

module.exports = Aip;
