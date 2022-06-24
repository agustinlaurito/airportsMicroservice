'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const allowlist = ['avolarapp.com.ar'];


const app = express();


app.enable('trust proxy');
app.disable('x-powered-by');
app.use(cors({
  origin: (origin, callback) => {
    if (allowlist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
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
