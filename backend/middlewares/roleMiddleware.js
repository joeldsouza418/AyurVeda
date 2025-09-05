import asyncHandler from 'express-async-handler';

// Middleware to check if user is a farmer
const farmer = asyncHandler(async (req, res, next) => {
    if (req.user && req.user.role === 'FARMER') {
        next();
    } else {
        res.status(403);
        throw new Error('Not authorized as a farmer');
    }
});

// Middleware to check if user is a distributor
const distributor = asyncHandler(async (req, res, next) => {
    if (req.user && req.user.role === 'DISTRIBUTOR') {
        next();
    } else {
        res.status(403);
        throw new Error('Not authorized as a distributor');
    }
});

// Middleware to check if user is a lab
const lab = asyncHandler(async (req, res, next) => {
    if (req.user && req.user.role === 'LAB') {
        next();
    } else {
        res.status(403);
        throw new Error('Not authorized as a lab');
    }
});

// Middleware to check if user is a retailer
const retailer = asyncHandler(async (req, res, next) => {
    if (req.user && req.user.role === 'RETAILER') {
        next();
    } else {
        res.status(403);
        throw new Error('Not authorized as a retailer');
    }
});

// Middleware to check if user is a supply chain participant (FARMER, DISTRIBUTOR, LAB, RETAILER)
const supplyChainParticipant = asyncHandler(async (req, res, next) => {
    if (req.user && ['FARMER', 'DISTRIBUTOR', 'LAB', 'RETAILER'].includes(req.user.role)) {
        next();
    } else {
        res.status(403);
        throw new Error('Not authorized as a supply chain participant');
    }
});

export { farmer, distributor, lab, retailer, supplyChainParticipant };