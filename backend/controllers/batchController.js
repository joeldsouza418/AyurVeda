import asyncHandler from 'express-async-handler';
import HerbBatch from '../models/HerbBatch.js';
import generateQRCode from '../utils/qrCodeGenerator.js';
import { formatSuccess } from '../utils/responseFormatter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new herb batch (FARMER only)
const createBatch = asyncHandler(async (req, res) => {
    const { species } = req.body;
    const coordinates = JSON.parse(req.body.coordinates || '[0, 0]');

    if (!species) { res.status(400); throw new Error('Please provide species name'); }
    if (!req.file) { res.status(400); throw new Error('Please upload an image'); }

    const tempBatchId = uuidv4();
    const qrCodeURL = await generateQRCode(tempBatchId);

    const batch = new HerbBatch({
        species,
        farmer: req.user._id,
        collectionDetails: {
            imageURL: `/uploads/${req.file.filename}`,
            location: { type: 'Point', coordinates }
        },
        currentOwner: req.user._id,
        qrCodeURL,
        batchId: tempBatchId
    });

    await batch.save();
    await batch.populate('farmer', 'name email organizationName');
    res.status(201).json(formatSuccess(batch, 201));
});

// Get all batches (ADMIN only)
const getAllBatches = asyncHandler(async (req, res) => {
    const batches = await HerbBatch.find({})
        .populate('farmer', 'name')
        .populate('currentOwner', 'name')
        .sort({ createdAt: -1 });
    res.status(200).json(formatSuccess(batches || [], 200));
});

// Get a single batch by batchId (Public)
const getBatchById = asyncHandler(async (req, res) => {
    const batch = await HerbBatch.findOne({ batchId: req.params.batchId })
        .populate('farmer', 'name email organizationName')
        .populate('currentOwner', 'name email organizationName')
        .populate('provenanceChain.actor', 'name email role organizationName');

    if (batch) {
        res.json(formatSuccess(batch));
    } else {
        res.status(404);
        throw new Error('Batch not found');
    }
});

// Add a new event to the provenance chain (DISTRIBUTOR, LAB, RETAILER)
const addBatchEvent = asyncHandler(async (req, res) => {
    const { stage, coordinates, metadata, newStatus } = req.body;

    if (!stage || !coordinates || !newStatus) {
        res.status(400);
        throw new Error('Please provide stage, coordinates, and new status');
    }

    let imageURL = null;
    if (req.file) { imageURL = `/uploads/${req.file.filename}`; }

    const batch = await HerbBatch.findOne({ batchId: req.params.batchId })
        .populate('farmer', 'name email organizationName')
        .populate('currentOwner', 'name email organizationName');

    if (!batch) { res.status(404); throw new Error('Batch not found'); }

    const validTransitions = {
        'HARVESTED': ['IN_TRANSIT_TO_LAB'],
        'IN_TRANSIT_TO_LAB': ['UNDER_TESTING'],
        'UNDER_TESTING': ['IN_TRANSIT_TO_RETAILER'],
        'IN_TRANSIT_TO_RETAILER': ['IN_RETAIL'],
        'IN_RETAIL': ['SOLD']
    };

    if (!validTransitions[batch.currentStatus]?.includes(newStatus)) {
        res.status(400);
        throw new Error(`Invalid status transition from ${batch.currentStatus} to ${newStatus}`);
    }

    const roleStageMap = {
        'DISTRIBUTOR': ['DISTRIBUTION'],
        'LAB': ['LAB_TEST'],
        'RETAILER': ['RETAIL_STOCK']
    };

    if (!roleStageMap[req.user.role]?.includes(stage)) {
        res.status(403);
        throw new Error(`User with role ${req.user.role} cannot add event of stage ${stage}`);
    }

    const parsedCoordinates = JSON.parse(coordinates);
    batch.provenanceChain.push({
        stage,
        actor: req.user._id,
        location: { type: 'Point', coordinates: parsedCoordinates },
        imageURL,
        metadata: metadata ? JSON.parse(metadata) : {}
    });

    if (stage === 'DISTRIBUTION') {
        batch.gpsTracking = {
            isActive: true,
            currentLocation: { type: 'Point', coordinates: parsedCoordinates },
            lastUpdated: new Date()
        };
    }

    batch.currentStatus = newStatus;
    batch.currentOwner = req.user._id;
    await batch.save();
    await batch.populate('provenanceChain.actor', 'name email role organizationName');
    res.json(formatSuccess(batch));
});

// Get batches owned by the current user
const getBatchesByOwner = asyncHandler(async (req, res) => {
    const batches = await HerbBatch.find({ currentOwner: req.user._id })
        .populate('farmer', 'name')
        .populate('currentOwner', 'name')
        .sort({ createdAt: -1 });
    res.status(200).json(formatSuccess(batches || [], 200));
});

// Get batches by farmer (FARMER only)
const getBatchesByFarmer = asyncHandler(async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.page) || 1;
    const count = await HerbBatch.countDocuments({ farmer: req.user._id });
    const batches = await HerbBatch.find({ farmer: req.user._id })
        .populate('farmer', 'name email organizationName')
        .populate('currentOwner', 'name email organizationName')
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.json(formatSuccess({ batches, page, pages: Math.ceil(count / pageSize), total: count }));
});

// Get unassigned batches (DISTRIBUTOR only)
const getUnassignedBatches = asyncHandler(async (req, res) => {
    const batches = await HerbBatch.find({ currentStatus: 'HARVESTED' })
        .populate('farmer', 'name email organizationName')
        .sort({ createdAt: -1 });
    res.status(200).json(formatSuccess(batches || [], 200));
});

// Assign a batch directly to a distributor (FARMER only) - no OTP
const assignToDistributor = asyncHandler(async (req, res) => {
    const { distributorId } = req.body;
    const batch = await HerbBatch.findById(req.params.id);

    if (!batch) { res.status(404); throw new Error('Batch not found'); }
    if (batch.farmer.toString() !== req.user._id.toString()) {
        res.status(401); throw new Error('Not authorized to assign this batch');
    }

    const distributor = await User.findById(distributorId);
    if (!distributor || distributor.role !== 'DISTRIBUTOR') {
        res.status(404); throw new Error('Distributor not found');
    }

    batch.currentOwner = distributorId;
    batch.currentStatus = 'IN_TRANSIT_TO_LAB';
    const updatedBatch = await batch.save();
    res.json(formatSuccess(updatedBatch));
});

// Transfer batch directly to another participant - no OTP
const transferBatch = asyncHandler(async (req, res) => {
    const { recipientId } = req.body;
    const batch = await HerbBatch.findById(req.params.id);

    if (!batch) { res.status(404); throw new Error('Batch not found'); }
    if (batch.currentOwner.toString() !== req.user._id.toString()) {
        res.status(401); throw new Error('Not authorized to transfer this batch');
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) { res.status(404); throw new Error('Recipient not found'); }

    const allowedTransfers = {
        'DISTRIBUTOR': ['LAB', 'RETAILER'],
        'LAB': ['RETAILER'],
        'RETAILER': ['RETAILER']
    };

    if (!allowedTransfers[req.user.role]?.includes(recipient.role)) {
        res.status(400);
        throw new Error(`Cannot transfer from ${req.user.role} to ${recipient.role}`);
    }

    batch.currentOwner = recipientId;
    const updatedBatch = await batch.save();
    res.json(formatSuccess(updatedBatch));
});

// Accept a batch transfer using OTP
const acceptTransfer = asyncHandler(async (req, res) => {
    const { otp } = req.body;
    const batch = await HerbBatch.findById(req.params.id);

    if (!batch) { res.status(404); throw new Error('Batch not found'); }

    if (!batch.pendingOwner || batch.pendingOwner.toString() !== req.user._id.toString()) {
        res.status(403); throw new Error('You are not the pending recipient of this batch');
    }

    if (!batch.transferOtp) { res.status(400); throw new Error('No pending transfer for this batch'); }

    if (batch.otpAttempts >= 5) {
        batch.transferOtp = undefined;
        batch.transferOtpExpiry = undefined;
        batch.pendingOwner = undefined;
        batch.otpAttempts = 0;
        await batch.save();
        res.status(400); throw new Error('Too many failed attempts. Transfer cancelled.');
    }

    if (new Date() > batch.transferOtpExpiry) {
        res.status(400); throw new Error('OTP has expired');
    }

    if (batch.transferOtp !== otp) {
        batch.otpAttempts += 1;
        await batch.save();
        res.status(400); throw new Error(`Invalid OTP. ${5 - batch.otpAttempts} attempts remaining.`);
    }

    batch.currentOwner = batch.pendingOwner;
    batch.pendingOwner = undefined;
    batch.transferOtp = undefined;
    batch.transferOtpExpiry = undefined;
    batch.otpAttempts = 0;
    const updatedBatch = await batch.save();
    res.json(formatSuccess(updatedBatch));
});

// Delete a batch (owner or farmer or admin)
const deleteBatch = asyncHandler(async (req, res) => {
    const batch = await HerbBatch.findById(req.params.id);

    if (!batch) { res.status(404); throw new Error('Batch not found'); }

    const isOwner = batch.currentOwner?.toString() === req.user._id.toString();
    const isFarmer = batch.farmer?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isFarmer && !isAdmin) {
        res.status(403); throw new Error('Not authorized to delete this batch');
    }

    await batch.deleteOne();
    res.json(formatSuccess({ message: 'Batch deleted successfully' }));
});

export {
    createBatch,
    getAllBatches,
    getBatchById,
    addBatchEvent,
    getBatchesByOwner,
    getBatchesByFarmer,
    getUnassignedBatches,
    assignToDistributor,
    transferBatch,
    acceptTransfer,
    deleteBatch
};
