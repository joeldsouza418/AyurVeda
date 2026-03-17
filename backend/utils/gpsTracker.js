/**
 * Utility functions for GPS tracking and visualization
 */

/**
 * Format GPS data for frontend visualization
 * @param {Object} batch - The herb batch with GPS tracking data
 * @returns {Object} - Formatted GPS data for frontend
 */
const formatGpsDataForFrontend = (batch) => {
    if (!batch.gpsTracking || !batch.gpsTracking.isActive) {
        return {
            isActive: false,
            message: 'GPS tracking not active for this batch'
        };
    }

    return {
        isActive: true,
        batchId: batch.batchId,
        currentStatus: batch.currentStatus,
        location: {
            latitude: batch.gpsTracking.currentLocation.coordinates[1],
            longitude: batch.gpsTracking.currentLocation.coordinates[0]
        },
        history: (batch.gpsTracking.history || []).map(h => ({
            latitude: h.coordinates[1],
            longitude: h.coordinates[0]
        })),
        lastUpdated: batch.gpsTracking.lastUpdated,
        species: batch.species,
        owner: batch.currentOwner
    };
};

/**
 * Calculate the estimated time of arrival based on current location and destination
 * @param {Array} currentCoordinates - [longitude, latitude] of current position
 * @param {Array} destinationCoordinates - [longitude, latitude] of destination
 * @param {Number} averageSpeed - Average speed in km/h
 * @returns {Object} - ETA information
 */
const calculateETA = (currentCoordinates, destinationCoordinates, averageSpeed = 60) => {
    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = toRad(destinationCoordinates[1] - currentCoordinates[1]);
    const dLon = toRad(destinationCoordinates[0] - currentCoordinates[0]);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(currentCoordinates[1])) * Math.cos(toRad(destinationCoordinates[1])) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Calculate time in hours
    const timeInHours = distance / averageSpeed;
    const hours = Math.floor(timeInHours);
    const minutes = Math.floor((timeInHours - hours) * 60);

    return {
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
        eta: {
            hours,
            minutes,
            text: `${hours}h ${minutes}m`
        }
    };
};

// Helper function to convert degrees to radians
const toRad = (value) => {
    return value * Math.PI / 180;
};

export { formatGpsDataForFrontend, calculateETA };