const Base = require('../../helpers/route');
const P = require('bluebird');
const database = require('../../helpers/services/firebase');

class Route extends Base {
    handler (req) {
        const context = {
            collection: req.query.collection,
            documentId: req.query.localCode,
        };

        return P.bind(this)
            .then(() => this.get(context));
    }

    get (context) {
        return database.get(context.collection, context.documentId);
    }
}

module.exports = new Route().handlerize();
