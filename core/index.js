'use strict';
console.log('\x1Bc');

const app = require('../app');
const config = require('../config/default');
const errors = require('./helpers/errors');

// const aipService = require('./helpers/services/aip');
// const AIP = new aipService();
// const charts = AIP.getCharts(["SADO"]);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/update', require('../core/controllers/update'));
app.get('/airports/list', require('../core/controllers/airports/list'));
app.get('/airports/autocompleteQuery', require('../core/controllers/airports/autocompleteQuery'));

errors(app);

// converter();

app.listen(config.port, () => {
    console.log(`Listening on port ${config.port}!`);
});
