const Base = require('../../../../helpers/route');
const P = require('bluebird');
const database = require("../../../../helpers/services/firebase")

const defaults = {
    collection: 'airport-comments',
}
    
class Route extends Base {

    validate(req){
        if(!req.query.localCode){
            throw new Error("localCode is required");
        }
        return P.resolve();
    }

    handler(req) {
        const context = {
            collection: defaults.collection,
            localCode: req.query.localCode,
        }
        console.log(context);
        return P.bind(this)
            .then(() => this.getDocument(context))
    }

    getDocument(context) {
        return database.get(context.collection, context.localCode)
        .then((airport) => {
            if(!airport) {
                throw new Error("Airport not found");
            }
            return airport;
        });
    }


}

module.exports = new Route().handlerize();