const Base = require('../../../helpers/route');
const P = require('bluebird');
const database = require('../../../helpers/services/firebase');
const { uuid } = require('uuidv4');
const _ = require('lodash');

const defaults = {
    collection: 'airport-comments',
};

class Route extends Base {

    validate(req){
        
        if(_.isEmpty(this.options.query)){
            throw new Error("Query is required.");
        }
        if(_.isEmpty(req.body)){
            throw new Error("Body is required.");
        }
    }

    handler (req) {

        
        const context = {
            collection: this.options.query.collection || defaults.collection,
            documentId: this.options.query.localCode,
            fields: req.body,
        };
        return P.bind(this)
            .then(() => this.getDocument(context))
            .then(() => this.addComment(context));
    }

    getDocument (context) {
        return database.get(context.collection, context.documentId)
            .then(doc => {
                context.document = doc;
                return context;
            });
    }

    addComment (context) {
        if (!context.document) {
            return database.createDocument(context.collection, context.documentId, {
                [uuid()]: _.merge({}, context.fields, {createdAt: new Date().toISOString()})
            });
        }

        return database.update(context.collection, context.documentId, {
            [uuid()]: _.merge({}, context.fields, {createdAt: new Date().toISOString()})
        });
    }
}

module.exports = new Route().handlerize();
