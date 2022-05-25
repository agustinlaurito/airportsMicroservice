'use strict';
console.log('\x1Bc');

const app = require('../app');
const config = require('../config/default');
const axios = require('axios');
const cheerio = require('cheerio');
const database = require('../core/helpers/database/database');
const airportsApi = require('../core/helpers/airportsData/airportsApi');


// const url = "http://www.tams.com.ar/organismos/vuelos.aspx";
// axios(url).then((response) => {
//   const html_data = response.data;
//   const $ = cheerio.load(html_data);
//   console.log(response);
// });
// init database
// const db = new database();

const apts = new airportsApi();
apts.getAirports();

app.get('/', (req, res) => {
    res.send('Hello World!')
})
  
app.listen(config.port, () => {
    console.log(`Listening on port ${config.port}!`)
    });