'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const app = express();


app.enable('trust proxy');
app.disable('x-powered-by');
app.use(bodyParser.raw());
app.use(bodyParser.text());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
// set port from config

module.exports = app;
