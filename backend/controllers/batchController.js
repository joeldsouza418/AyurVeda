import asyncHandler from 'express-async-handler';
import HerbBatch from '../models/HerbBatch.js';
import generateQRCode from '../utils/qrCodeGenerator.js';
import { formatSuccess } from '../utils/responseFormatter.js';
import { generateOTP, getOTPExpiry, isValidOTPFormat, isOTPExpired } from '../utils/otpGenerator.js';
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
    
    if (!species) {
        res.status(400);
        throw new Error('Please provide species name');
    }
    
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload an image');
    }
    
    // First generate a temporary batchId to use for QR code generation
    const tempBatchId = uuidv4();
    
    // Generate QR code with the temporary batchId
    const qrCodeURL = await generateQRCode(tempBatchId);
    
    // Create a new batch with the QR code URL already set
    const batch = new HerbBatch({
        species,
        farmer: req.user._id,
        collectionDetails: {
            imageURL: `/uploads/${req.file.filename}`,
            location: {
                type: 'Point',
                coordinates: coordinates
            }
        },
        currentOwner: req.user._id,
        qrCodeURL: qrCodeURL,
        batchId: tempBatchId // Use the same ID we generated the QR code with
    });
    
    // Save the batch
    await batch.save();
    
    // Populate the farmer details
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
    
    // Handle image upload for geotagging if present
    let imageURL = null;
    if (req.file) {
        imageURL = `/uploads/${req.file.filename}`;
    }
    
    // Find the batch
    const batch = await HerbBatch.findOne({ batchId: req.params.batchId })
        .populate('farmer', 'name email organizationName')
        .populate('currentOwner', 'name email organizationName');
    
    if (!batch) {
        res.status(404);
        throw new Error('Batch not found');
    }
    
    // Validate the new status based on current status and user role
    const validTransitions = {
        'HARVESTED': ['IN_TRANSIT_TO_LAB'],
        'IN_TRANSIT_TO_LAB': ['UNDER_TESTING'],
        'UNDER_TESTING': ['IN_TRANSIT_TO_RETAILER'],
        'IN_TRANSIT_TO_RETAILER': ['IN_RETAIL'],
        'IN_RETAIL': ['SOLD']
    };
    
    if (!validTransitions[batch.currentStatus].includes(newStatus)) {
        res.status(400);
        throw new Error(`Invalid status transition from ${batch.currentStatus} to ${newStatus}`);
    }
    
    // Validate user role for the specific stage
    const roleStageMap = {
        'DISTRIBUTOR': ['DISTRIBUTION'],
        'LAB': ['LAB_TEST'],
        'RETAILER': ['RETAIL_STOCK']
    };
    
    if (!roleStageMap[req.user.role].includes(stage)) {
        res.status(403);
        throw new Error(`User with role ${req.user.role} cannot add event of stage ${stage}`);
    }
    
    // Add the new event to the provenance chain
    const parsedCoordinates = JSON.parse(coordinates);
    batch.provenanceChain.push({
        stage,
        actor: req.user._id,
        location: {
            type: 'Point',
            coordinates: parsedCoordinates
        },
        imageURL: imageURL,
        metadata: metadata || {}
    });
    
    // Update GPS tracking information if this is a distribution event
    if (stage === 'DISTRIBUTION') {
        batch.gpsTracking = {
            isActive: true,
            currentLocation: {
                type: 'Point',
                coordinates: parsedCoordinates
            },
            lastUpdated: new Date()
        };
    }
    
    // Update the batch status and owner
    batch.currentStatus = newStatus;
    batch.currentOwner = req.user._id;
    
    // Save the updated batch
    await batch.save();
    
    // Populate the actor details in the new event
    await batch.populate('provenanceChain.actor', 'name email role organizationName');
    
    res.json(formatSuccess(batch));
});

// Get batches owned by the current user (DISTRIBUTOR, LAB, RETAILER)
const getBatchesByOwner = asyncHandler(async (req, res) => {
    const batches = await HerbBatch.find({ 
        $or: [
            { currentOwner: req.user._id },
            { pendingOwner: req.user._id }
        ]
    })
        .populate('farmer', 'name')
        .populate('currentOwner', 'name')
        .populate('pendingOwner', 'name')
        .sort({ createdAt: -1 });
    
    res.status(200).json(formatSuccess(batches || [], 200));
});

// Get batches by farmer (Protected - FARMER only)
const getBatchesByFarmer = asyncHandler(async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.page) || 1;
    
    const count = await HerbBatch.countDocuments({ farmer: req.user._id });
    const batches = await HerbBatch.find({ farmer: req.user._id })
        .populate('farmer', 'name email organizationName')
        .populate('currentOwner', 'name email organizationName')
        .limit(pageSize)
        .skip(pageSize * (page - 1));
    
    res.json(formatSuccess({
        batches,
        page,
        pages: Math.ceil(count / pageSize),
        total: count
    }));
});

// Get unassigned batches (DISTRIBUTOR only)
const getUnassignedBatches = asyncHandler(async (req, res) => {
    const batches = await HerbBatch.find({ currentStatus: 'HARVESTED' })
        .populate('farmer', 'name email organizationName')
        .sort({ createdAt: -1 });
    
    res.status(200).json(formatSuccess(batches || [], 200));
});

// Assign a batch to a distributor (FARMER only)
const assignToDistributor = asyncHandler(async (req, res) => {
    const { distributorId } = req.body;
    const batch = await HerbBatch.findById(req.params.id);

    if (batch) {
        if (batch.farmer.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Not authorized to assign this batch');
        }

        const distributor = await User.findById(distributorId);
        if (!distributor || distributor.role !== 'DISTRIBUTOR') {
            res.status(404);
            throw new Error('Distributor not found');
        }

        batch.pendingOwner = distributorId;
        // Generate a 6-digit OTP
        const otp = generateOTP();
        batch.transferOtp = otp;
        // Set OTP expiry to 15 minutes from now
        batch.transferOtpExpiry = getOTPExpiry();
        // Reset OTP attempts
        batch.otpAttempts = 0;
        
        const updatedBatch = await batch.save();
        
        // Return OTP so the farmer can see it and share it with distributor
        res.json(formatSuccess({ ...updatedBatch.toObject(), otp: otp }));
    } else {
        res.status(404);
        throw new Error('Batch not found');
    }
});

// Transfer batch to another participant (LAB, RETAILER)
const transferBatch = asyncHandler(async (req, res) => {
    const { recipientId } = req.body;
    const batch = await HerbBatch.findById(req.params.id);

    if (batch) {
        if (batch.currentOwner.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Not authorized to transfer this batch');
        }

        const recipient = await User.findById(recipientId);
        if (!recipient) {
            res.status(404);
            throw new Error('Recipient not found');
        }

        // Only allow transfer to LAB (from distributor) or RETAILER (from lab/distributor/retailer)
        const allowedTransfers = {
            'DISTRIBUTOR': ['LAB', 'RETAILER'],
            'LAB': ['RETAILER'],
            'RETAILER': ['RETAILER']
        };

        if (!allowedTransfers[req.user.role].includes(recipient.role)) {
            res.status(400);
            throw new Error(`Cannot transfer from ${req.user.role} to ${recipient.role}`);
        }

        batch.pendingOwner = recipientId;
        // Generate a 6-digit OTP
        const otp = generateOTP();
        batch.transferOtp = otp;
        // Set OTP expiry to 15 minutes from now
        batch.transferOtpExpiry = getOTPExpiry();
        // Reset OTP attempts
        batch.otpAttempts = 0;

        const updatedBatch = await batch.save();
        res.json(formatSuccess({ ...updatedBatch.toObject(), otp: otp }));
    } else {
        res.status(404);
        throw new Error('Batch not found');
    }
});

// Accept a batch transfer (Receiver only)
const acceptTransfer = asyncHandler(async (req, res) => {
    const { otp } = req.body;
    
    // Validate OTP format
    if (!isValidOTPFormat(otp)) {
        res.status(400);
        throw new Error('OTP must be a 6-digit number');
    }
    
    const batch = await HerbBatch.findById(req.params.id);

    if (batch) {
        // Ensure user is the pending owner
        if (!batch.pendingOwner || batch.pendingOwner.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Not authorized to accept this transfer');
        }

        // Check if OTP exists
        if (!batch.transferOtp) {
            res.status(400);
            throw new Error('No pending transfer found');
        }

        // Check if OTP has expired
        if (isOTPExpired(batch.transferOtpExpiry)) {
            // Clear expired OTP
            batch.transferOtp = undefined;
            batch.transferOtpExpiry = undefined;
            batch.pendingOwner = undefined;
            batch.otpAttempts = 0;
            await batch.save();
            
            res.status(400);
            throw new Error('OTP has expired. Please request a new transfer');
        }

        // Check for too many failed attempts
        if (batch.otpAttempts >= 5) {
            // Lock the transfer after 5 failed attempts
            batch.transferOtp = undefined;
            batch.transferOtpExpiry = undefined;
            batch.pendingOwner = undefined;
            batch.otpAttempts = 0;
            await batch.save();
            
            res.status(429);
            throw new Error('Too many failed attempts. Transfer has been cancelled. Please request a new transfer');
        }

        // Verify OTP
        if (batch.transferOtp !== otp) {
            // Increment failed attempts
            batch.otpAttempts = (batch.otpAttempts || 0) + 1;
            await batch.save();
            
            const remainingAttempts = 5 - batch.otpAttempts;
            res.status(400);
            throw new Error(`Invalid OTP. ${remainingAttempts} attempt(s) remaining`);
        }

        // Accept the transfer - OTP is correct
        batch.currentOwner = batch.pendingOwner;
        batch.pendingOwner = undefined;
        batch.transferOtp = undefined;
        batch.transferOtpExpiry = undefined;
        batch.otpAttempts = 0;

        // Update status based on recipient role
        if (req.user.role === 'DISTRIBUTOR') {
             // Assuming this was assigned from farmer
             batch.currentStatus = 'IN_TRANSIT_TO_LAB';
        } else if (req.user.role === 'LAB') {
            batch.currentStatus = 'UNDER_TESTING';
        } else if (req.user.role === 'RETAILER') {
            batch.currentStatus = 'IN_TRANSIT_TO_RETAILER';
        }
        
        const updatedBatch = await batch.save();
        res.json(formatSuccess(updatedBatch));
    } else {
        res.status(404);
        throw new Error('Batch not found');
    }
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
    acceptTransfer
};