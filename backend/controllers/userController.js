import User from '../models/User.js';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import { formatSuccess } from '../utils/responseFormatter.js';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// CREATE - Register a new user
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, organizationName } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }
    const user = await User.create({ name, email, password, role, organizationName });
    if (user) {
        res.status(201).json(formatSuccess({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        }, 201));
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// AUTHENTICATE - Login a user
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
        res.json(formatSuccess({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        }));
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// READ - Get user profile
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        res.json(formatSuccess({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }));
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// UPDATE - Update user profile
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        if (req.body.password) { user.password = req.body.password; }
        const updatedUser = await user.save();
        res.json(formatSuccess({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            token: generateToken(updatedUser._id)
        }));
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// READ (Admin) - Get all users
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({});
    res.json(formatSuccess(users));
});

// DELETE (Admin) - Delete a user
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
        await user.deleteOne();
        res.json(formatSuccess({ message: 'User removed' }));
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get all distributors
// @route   GET /api/users/distributors
// @access  Protected/Farmer
const getDistributors = asyncHandler(async (req, res) => {
    const distributors = await User.find({ role: 'DISTRIBUTOR' }).select('-password');
    res.json(formatSuccess(distributors));
});

// @desc    Get all labs
// @route   GET /api/users/labs
// @access  Protected/Distributor
const getLabs = asyncHandler(async (req, res) => {
    const labs = await User.find({ role: 'LAB' }).select('-password');
    res.json(formatSuccess(labs));
});

// @desc    Get all retailers
// @route   GET /api/users/retailers
// @access  Protected/Lab and Distributor
const getRetailers = asyncHandler(async (req, res) => {
    const retailers = await User.find({ role: 'RETAILER' }).select('-password');
    res.json(formatSuccess(retailers));
});

export {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    getUsers,
    deleteUser,
    getDistributors,
    getLabs,
    getRetailers
};