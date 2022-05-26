'use strict';

const bluebird = require('bluebird');
const lodash = require('lodash');
const axios = require('axios');
const P = require('bluebird');
const errors = require('http-errors');
const _ = require('lodash');

class Route {
    constructor (options) {
        this.options = _.defaultsDeep({}, options || {});
    }

    handle (req, res, next) {
        return P.bind(this)
            .then(() => this.validate(req, res))
            .then(() => this.handler(req, res))
            .then(result => this.success(res, result))
    }

    validate (req, res) {
        return P.resolve();
    }

    handler () {
        return P.resolve({});
    }

    handlerize () {
        return this.handle.bind(this);
    }

    success (res, result, statusCode = 200) {
        // Handle exceptional cases
        if (result && result.statusCode && result.description === 'already-response') {
            statusCode = result.statusCode;
            result = result.response;
        }
        return res.status(statusCode).send(result);
    }


}

module.exports = Route;