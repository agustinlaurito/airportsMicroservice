const Base = require('../../../../helpers/route');
const P = require('bluebird');
const database = require("../../../../helpers/services/firebase");
const { uuid } = require('uuidv4');

const defaults = {
    collection: 'airport-comments',
}
    
class Route extends Base {

    handler(req) {
        const context = {
            collection: defaults.collection,
            documentId: req.body.localCode,
            username: req.body.username,
            comment: req.body.comment,
        }
        return P.bind(this)
            .then(() => this.getDocument(context))
            .then(() => this.addComment(context))
    }

    getDocument(context) {
        return database.get(context.collection, context.documentId)
            .then(doc => {
                context.document = doc;
                return context;
            });
    }

    addComment(context) {
        if(!context.document){
            return database.createDocument(context.collection, context.documentId, {
                [uuid()]: {
                    username: context.username,
                    comment: context.comment,
                    createdAt: new Date().toISOString(),
                }
            });
        }
        return database.update(context.collection, context.documentId, {
            [uuid()]: {
                username: context.username,
                comment: context.comment,
                createdAt: new Date().toISOString(),
            }
        });
    }

}

module.exports = new Route().handlerize();