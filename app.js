'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { apiKeyAuth } = require('@vpriem/express-api-key-auth');



const app = express();


app.enable('trust proxy');
app.disable('x-powered-by');
app.use(apiKeyAuth(['4f9bf0c1-d119-4520-9987-a0222a8c194b']));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Headers, *, Access-Control-Allow-Origin', 'Origin, X-Requested-with, Content_Type,Accept,Authorization', 'http://localhost:4200');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT,POST,PATCH,DELETE,GET');
    return res.status(200).json({});
  }
  next();
});

app.use(cors());
app.use(bodyParser.raw());
app.use(bodyParser.text());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
// app.use((req, res, next) => {
//     res.on('finish', () => {
//       if(req.url === '/airports/autocompleteQuery') {return};
//       console.log( "Request: " + req.method + " " + req.url + " " + res.statusCode + ` | query: ${JSON.stringify(req.query)}`);
//     });
//     next();
//   });

module.exports = app;
