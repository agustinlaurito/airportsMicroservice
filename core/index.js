'use strict';
console.log('\x1Bc');

const app = require('../app');
const config = require('../config/default');
const errors = require('./helpers/errors');

app.get('/update', require('../core/controllers/update'));
app.get('/airports/list', require('../core/controllers/airports/list'));
app.get('/airports/getClosest', require('../core/controllers/airports/getClosestAirports'));
app.get('/airports/autocompleteQuery', require('../core/controllers/airports/autocompleteQuery'));
app.get('/firestore/get', require('../core/controllers/firestore/get'));
app.get('/firestore/airports', require('../core/controllers/firestore/airports/get'));
app.post('/firestore/airports', require('../core/controllers/firestore/airports/create'));

errors(app);

// const populador = new Populator();
// populador.fetch();

app.listen(config.port, () => {
    console.log(`Listening on port ${config.port}!`);
});
