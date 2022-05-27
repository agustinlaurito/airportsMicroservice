'use strict';

const P = require('bluebird');
const _ = require('lodash');

const defaultOptions = {
    query: {
        pageSize: '10',
        page: '1',
    },
};

class Route {

    handle (req, res, next) {

        return P.bind(this)
            .then(() => this.prepareOptions(req.options))
            .then(() => this.parseReq(req))
            .then(() => this.validate(req, res))
            .then(() => this.handler(req, res))
            .then(result => this.success(res, result));
    }

    prepareOptions (options) {
        this.options = _.defaultsDeep({}, options || {}, defaultOptions);
    }

    parseReq (req) {
        this.options.query = _.defaultsDeep({}, req.query || {}, this.options.query);
        return this;

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
