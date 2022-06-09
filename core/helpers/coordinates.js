'use strict';

function toRadians (degrees) {
    return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
function toDegrees (radians) {
    return radians * 180 / Math.PI;
}

class coordinateHelper {
    constructor (startCoordinates, endCoordinates) {
        this.coordinates = {
            start: startCoordinates,
            end: endCoordinates,
        };
    }

    getDirections () {
        const distanceNm = this.getDistanceFromLatLonInKm(this.coordinates.start.lat, this.coordinates.start.lng, this.coordinates.end.lat, this.coordinates.end.lng);
        const bearing = this.getBearing(this.coordinates.start.lat, this.coordinates.start.lng, this.coordinates.end.lat, this.coordinates.end.lng);
        return {
            distanceNm,
            bearing
        };
    }

    getDistanceFromLatLonInKm (lat1, lon1, lat2, lon2) {
        console.log(lat1, lon1, lat2, lon2);
        const R = 6371; // Radius of the earth in km
        const dLat = toRadians(lat2 - lat1); // deg2rad below
        const dLon = toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    }

    getDistanceFromLatLonInNm (lat1, lon1, lat2, lon2) {
        return this.getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) * 0.539957;
    }

    getBearing (startLat, startLng, destLat, destLng) {
        startLat = toRadians(startLat);
        startLng = toRadians(startLng);
        destLat = toRadians(destLat);
        destLng = toRadians(destLng);

        const y = Math.sin(destLng - startLng) * Math.cos(destLat);
        const x = Math.cos(startLat) * Math.sin(destLat) -
          Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
        let brng = Math.atan2(y, x);
        brng = toDegrees(brng);
        return (brng + 360) % 360;
    }
}

module.exports = coordinateHelper;
