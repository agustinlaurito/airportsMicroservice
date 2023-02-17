'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const createError = require('http-errors');
const { apiKeyAuth } = require('@vpriem/express-api-key-auth');



const app = express();

app.enable('trust proxy');
app.disable('x-powered-by');
// app.use(apiKeyAuth(['4f9bf0c1-d119-4520-9987-a0222a8c194b']));

app.use((req, res, next) => {

  if (!req.headers || req.headers['x-api-key'] !== '4f9bf0c1-d119-4520-9987-a0222a8c194b') res.status(401).send();
  else return next();
  
});

app.use(cors());
app.use(bodyParser.raw());
app.use(bodyParser.text());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

module.exports = app;
