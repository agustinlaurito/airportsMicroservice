'use strict';
console.log('\x1Bc');



const app = require('../app');
const config = require('../config/default');
const errors = require('./helpers/errors');
const Populator = require('./helpers/populator');

app.get('/update', require('../core/controllers/update'));
app.get('/airports/list', require('../core/controllers/airports/list'));
app.get('/airports/autocompleteQuery', require('../core/controllers/airports/autocompleteQuery'));
app.get('/firestore/get', require('../core/controllers/firestore/get'));
app.get('/firestore/airports/comments', require('../core/controllers/firestore/airports/comments/get'));
app.post('/firestore/airports/comments', require('../core/controllers/firestore/airports/comments/create'));


errors(app);

// const populador = new Populator();
// populador.fetch();

app.listen(config.port, () => {
    console.log(`Listening on port ${config.port}!`);
});
