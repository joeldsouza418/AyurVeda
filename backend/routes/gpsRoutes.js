import express from 'express';
import { updateGpsLocation, getGpsLocation } from '../controllers/gpsController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import { distributor, lab, retailer } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Update GPS location (for distributors)
router.put('/:batchId/update', protect, distributor, updateGpsLocation);

// Get GPS location (for labs and retailers)
router.get('/:batchId', protect, getGpsLocation);

export default router;