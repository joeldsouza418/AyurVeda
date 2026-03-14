import express from 'express';
import {
    createBatch,
    getAllBatches,
    getBatchById,
    addBatchEvent,
    getBatchesByOwner,
    getBatchesByFarmer,
    getUnassignedBatches,
    assignToDistributor,
    transferBatch
} from '../controllers/batchController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import { farmer, distributor, lab, retailer, supplyChainParticipant } from '../middlewares/roleMiddleware.js';
import upload from '../utils/fileUpload.js';

const router = express.Router();

// Public routes
router.get('/:batchId', getBatchById);

// Protected routes
router.route('/')
    .post(protect, farmer, upload.single('image'), createBatch)
    .get(protect, admin, getAllBatches);

router.put('/:batchId/add-event', protect, supplyChainParticipant, upload.single('image'), addBatchEvent);
router.put('/:id/assign', protect, farmer, assignToDistributor);
router.put('/:id/transfer', protect, supplyChainParticipant, transferBatch);

// User-specific batch routes
router.get('/my/owned', protect, getBatchesByOwner);
router.get('/my/farmed', protect, farmer, getBatchesByFarmer);
router.get('/unassigned', protect, distributor, getUnassignedBatches);

export default router;