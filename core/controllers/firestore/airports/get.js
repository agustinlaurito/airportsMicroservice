const Base = require('../../../helpers/route');
const P = require('bluebird');
const database = require('../../../helpers/services/firebase');
const _ = require('lodash');

const defaults = {
    collection: 'airport-comments',
    orderBy: 'createdAt',
    orderDirection: 'asc',
};

class Route extends Base {
    validate (req) {
        if (!req.query.filters) {
            throw new Error('localCode is required');
        }
        return P.resolve();
    }

    handler (req) {
        const context = {
            collection: req.query.collection || defaults.collection,
            filters: this.options.query.filters,
            orderBy: this.options.orderBy || defaults.orderBy,
            orderDirection: this.options.orderDirection || defaults.orderDirection,
        };

        return P.bind(this)
            .then(() => this.getDocument(context))
            .then(() => this.parseResponse(context));
    }

    getDocument (context) {
        return database.get(context.collection, context.filters.localCode)
            .then((comments) => {
                if (!comments) {
                    comments = [];
                }
                context.rawComments = comments;
                return comments;
            });
    }

    parseResponse (context) {
        let comments = Object.keys(context.rawComments).map((key) => {
            return context.rawComments[key];
        });
        comments = _.orderBy(comments, [context.orderBy], [context.orderDirection]);
        return comments;
    }
}

module.exports = new Route().handlerize();
