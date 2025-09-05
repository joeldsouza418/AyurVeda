import asyncHandler from 'express-async-handler';
import HerbBatch from '../models/HerbBatch.js';
import { formatSuccess } from '../utils/responseFormatter.js';
import { formatGpsDataForFrontend, calculateETA } from '../utils/gpsTracker.js';

/**
 * Update GPS location for a batch in transit
 * This allows distributors to update the real-time location of a batch
 */
const updateGpsLocation = asyncHandler(async (req, res) => {
    const { coordinates } = req.body;
    
    if (!coordinates) {
        res.status(400);
        throw new Error('Please provide coordinates');
    }
    
    // Find the batch
    const batch = await HerbBatch.findOne({ batchId: req.params.batchId });
    
    if (!batch) {
        res.status(404);
        throw new Error('Batch not found');
    }
    
    // Verify the batch is in a transit state
    const transitStates = ['IN_TRANSIT_TO_LAB', 'IN_TRANSIT_TO_RETAILER'];
    if (!transitStates.includes(batch.currentStatus)) {
        res.status(400);
        throw new Error(`Batch is not in transit. Current status: ${batch.currentStatus}`);
    }
    
    // Verify the current user is the owner of the batch
    if (batch.currentOwner.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('You are not authorized to update this batch');
    }
    
    // Update GPS tracking information
    const parsedCoordinates = JSON.parse(coordinates);
    batch.gpsTracking = {
        isActive: true,
        currentLocation: {
            type: 'Point',
            coordinates: parsedCoordinates
        },
        lastUpdated: new Date()
    };
    
    await batch.save();
    
    res.json(formatSuccess({
        message: 'GPS location updated successfully',
        batchId: batch.batchId,
        currentLocation: batch.gpsTracking.currentLocation,
        lastUpdated: batch.gpsTracking.lastUpdated
    }));
});

/**
 * Get current GPS location for a batch
 * This allows labs and retailers to track batches in transit to them
 */
const getGpsLocation = asyncHandler(async (req, res) => {
    // Find the batch
    const batch = await HerbBatch.findOne({ batchId: req.params.batchId });
    
    if (!batch) {
        res.status(404);
        throw new Error('Batch not found');
    }
    
    // Check if GPS tracking is active
    if (!batch.gpsTracking || !batch.gpsTracking.isActive) {
        res.status(400);
        throw new Error('GPS tracking is not active for this batch');
    }
    
    // Format GPS data for frontend visualization
    const gpsData = formatGpsDataForFrontend(batch);
    
    // If destination coordinates are provided, calculate ETA
    if (req.query.destLat && req.query.destLng) {
        const destinationCoordinates = [parseFloat(req.query.destLng), parseFloat(req.query.destLat)];
        const etaInfo = calculateETA(
            batch.gpsTracking.currentLocation.coordinates,
            destinationCoordinates
        );
        gpsData.eta = etaInfo;
    }
    
    res.json(formatSuccess(gpsData));
});

export { updateGpsLocation, getGpsLocation };