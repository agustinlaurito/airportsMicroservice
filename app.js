'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();


app.enable('trust proxy');
app.disable('x-powered-by');
app.use(cors());
app.use(bodyParser.raw());
app.use(bodyParser.text());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use((req, res, next) => {
    
    res.on('finish', () => {
      console.log("Request: " + req.method + " " + req.url + " " + res.statusCode);
      console.log(`With query: ${JSON.stringify(req.query)}`);
    });
    next();
  });

module.exports = app;
