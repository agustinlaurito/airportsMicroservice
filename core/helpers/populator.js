const csvToJson = require('convert-csv-to-json');
const _ = require('lodash');
const CoordinateHelper = require('./coordinates');
const fs = require('fs');
const P = require('bluebird');
const coordinatesConverter = require('geo-coordinates-parser');

const coordinateParser = (coordinate) => {
    if (!coordinate || coordinate.indexOf(',') === -1) {
        return null;
    }
    // check if coordinate has a comma

    const coordinateArray = coordinate.split(',');
    const coordinateNumber = coordinateArray[0];
    const coordinateLetter = coordinateArray[1].match(/[A-Z]/);

    return coordinateNumber + coordinateLetter;
};

const parseLadRunways = (lad) => {
    const runways = [];
    if (!lad.digit1 && !lad.digit2) {
        return runways;
    }
    // check for an H in lad.type
    if (lad.type.indexOf('H') !== -1) {
        runways.push({
            numbers: [lad.digit1 + '/' + lad.digit2],
            surface: lad.surface,
            width: lad.dimensions,
        });
    }

    if (lad.digit1.length === 2 && lad.digit2.length === 2) {
        runways.push({
            numbers: lad.digit1 + '/' + lad.digit2,
            width: lad.dimensions,
            surface: lad.surface
        });
    }
    return runways;
};

const parseFir = (fir) => {
    let name = '';

    switch (fir) {
        case 'SAVF':
            name = 'FIR Comodoro Rivadavia';
            break;
        case 'SACF':
            name = 'FIR Córdoba';
            break;
        case 'SAEF':
            name = 'FIR Ezeiza';
            break;
        case 'SAMF':
            name = 'FIR Mendoza';
            break;
        case 'SARR':
            name = 'FIR Resistencia';
            break;
        default:
            name = fir;
            break;
    }

    return {
        name,
        code: fir
    };
};

class Populator {
    fetch () {
        const context = {
            airportsPath: './data/airports.csv',
            ladsPath: './data/lads.csv',
        };

        return P.bind(this)
            .then(() => this.populateAirports(context))
            .then(() => this.populateLads(context))
            .then(() => this.findClosestAirport(context))
            .then(() => this.save(context));
    }

    populateAirports (context) {
        const jsonArray = csvToJson.fieldDelimiter(';').getJsonFromCsv(context.airportsPath);
        context.airports = [];
        _.forEach(jsonArray, (airport) => {
            const lat = airport.latitud;
            const lng = airport.longitud;
            if (!lat || !lng) { return; };

            const airportData = {
                localCode: airport.local,
                oaciCode: airport.oaci,
                iataCode: airport.iata,
                type: airport.type,
                shortName: airport.denominacion.replace(/\\/g, '').replace(/\//g, ' ').replace(/"/g, ''),
                name: airport.denominacion.replace(/\\/g, '').replace(/\//g, ' ').replace(/"/g, ''),
                coordinates: [
                    airport.coordenadas.replace(/\\/g, '').replace(/\//g, ' ').replace(/"/g, '').split('  ')[0],
                    airport.coordenadas.replace(/\\/g, '').replace(/\//g, ' ').replace(/"/g, '').split('  ')[1],
                ],
                geometry: {
                    type: 'Point',
                    coordinates: {
                        lat: parseFloat(airport.longitud),
                        lng: parseFloat(airport.latitud),
                    }
                },
                elevation: airport.elev,
                elevationUnit: airport.uom_elev,
                reference: airport.ref,
                distanceToReference: airport.distancia_ref,
                directionToReference: airport.direccion_ref,
                public: airport.condicion === 'PUBLICO',
                private: airport.condicion === 'PRIVADO',
                controlled: airport.control === 'CONTROL',
                region: airport.region,
                fir: parseFir(airport.fir),
                use: airport.uso,
                traffic: airport.trafico,
                province: airport.provincia,
                isActive: airport.inhab !== 'NO',
                sna: airport.sna,
            };
            context.airports.push(airportData);
        });
        return P.resolve(context);
    }

    populateLads (context) {
        const jsonArrayLads = csvToJson.fieldDelimiter(';').getJsonFromCsv(context.ladsPath);
        _.forEach(jsonArrayLads, (lad) => {
            const lat = coordinateParser(lad.lat);
            const lng = coordinateParser(lad.lng);
            const parsedLad = {
                localCode: lad.type + lad.number,
                shortName: lad.name,
                name: lad.name,
                elevation: lad.elevation,
                elevationUnit: 'Metros',
                coordinates: lat && lng ? [lat, lng] : null,
                reference: lad.reference,
                region: lad.region,
                type: lad.type,
                runways: parseLadRunways(lad),
            };
            // if elevation in parsedlad contains anything besides numbers, get only the numbers

            if (parsedLad.elevation && parsedLad.elevation.match(/[a-zA-Z]/)) {
                parsedLad.elevation = parsedLad.elevation.match(/[0-9]/g).join('');
            }

            if (parsedLad.coordinates) {
                let converted;
                try {
                    converted = coordinatesConverter(parsedLad.coordinates[0] + ',' + parsedLad.coordinates[1]);
                }
                catch (e) {
                    return;
                }
                parsedLad.geometry = {
                    type: 'Point',
                    coordinates: {
                        lat: converted.decimalLatitude,
                        lng: converted.decimalLongitude,
                    }
                };
            }
            context.airports.push(parsedLad);
        });
        return P.resolve(context);
    }

    findClosestAirport (context) {
        const finalAirports = [];

        _.each(context.airports, (airport) => {
            if (!airport.geometry) {
                return;
            }

            let closestAirport = {};
            let closestAirportDistance = 1000000;
            const lat = airport.geometry.coordinates.lat;
            const lng = airport.geometry.coordinates.lng;
            if (!lat || !lng) { return; };

            _.each(context.airports, (testAirport) => {
                if (!testAirport.geometry) { return; }
                const coordinator = new CoordinateHelper({ lat, lng }, { lat: testAirport.geometry.coordinates.lat, lng: testAirport.geometry.coordinates.lng });
                const indications = coordinator.getDirections();

                if (indications.distanceNm < closestAirportDistance && airport.oaciCode !== testAirport.oaciCode) {
                    if (!testAirport.oaciCode) {
                        return;
                    }
                    if (testAirport.sna === 'NO') {
                        return;
                    }
                    closestAirportDistance = indications.distanceNm;
                    closestAirport = {
                        localCode: testAirport.localCode,
                        oaciCode: testAirport.oaciCode,
                        distance: closestAirportDistance,
                        bearing: indications.bearing,
                    };
                }
                airport.closestAirport = closestAirport;
            });
            finalAirports.push(airport);
        });
        context.airports = finalAirports;
        return P.resolve(context);
    }

    save (context) {
        fs.writeFile('./data/airports.json', JSON.stringify(context.airports), (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
    }
}

module.exports = Populator;
