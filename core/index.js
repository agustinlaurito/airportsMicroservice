'use strict';
console.log('\x1Bc');

const app = require('../app');
const config = require('../config/default');

// const aptsData = new airportsData();
// aptsData.handler();

// const madhelService = new madhel("AER");
// madhelService.handler();

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/update', require('../core/controllers/update'));
app.get('/airports/list', require('../core/controllers/airports/list'));

app.listen(config.port, () => {
    console.log(`Listening on port ${config.port}!`);
});
