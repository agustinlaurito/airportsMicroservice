const csvToJson = require('convert-csv-to-json');
const _ = require('lodash');
const coordinateHelper = require('./coordinates');
const fs = require('fs');

function csvconverter(){
    const csvFilePath = './data/airports.csv';
    const jsonArray = csvToJson.fieldDelimiter(';').getJsonFromCsv(csvFilePath);

    _.forEach(jsonArray, (airport) => {
        
        const lat = airport.latitud;
        const lng = airport.longitud;
        if(!lat || !lng) { return };
        
        let closestAirport = {};
        let closestAirportDistance = 1000000;
        _.forEach(jsonArray, (testAirport) => {

            const coordinator = new coordinateHelper({lat, lng}, { lat: testAirport.latitud, lng: testAirport.longitud });
            let indications = coordinator.getDirections();
            
            if(indications.distanceNm < closestAirportDistance && airport.oaci !== testAirport.oaci) {
                if(!testAirport.oaci){
                    return;
                }
                if(testAirport.sna === 'NO'){
                    return;
                }
                closestAirportDistance = indications.distanceNm;
                closestAirport = {
                    localCode: testAirport.local,
                    oaciCode: testAirport.oaci,
                    distance: closestAirportDistance,
                    bearing: indications.bearing
                }
            }
            airport.closestAirport = closestAirport;
        })
        
    })
    // save JSON to file in data

    fs.writeFile('./data/airports.json', JSON.stringify(jsonArray), (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
    
}

module.exports = csvconverter;