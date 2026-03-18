import express from 'express';
import {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    getUsers,
    deleteUser,
    getDistributors,
    getLabs,
    getRetailers
} from '../controllers/userController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import { farmer, distributor, lab } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.route('/').get(protect, admin, getUsers);
router.route('/:id').delete(protect, admin, deleteUser);
router.get('/distributors', protect, farmer, getDistributors);
router.get('/labs', protect, distributor, getLabs);
router.get('/retailers', protect, getRetailers);

export default router;