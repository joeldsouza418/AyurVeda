import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// ... schema definitions remain the same
const ProvenanceEventSchema = new mongoose.Schema({
    stage: { type: String, required: true, enum: ['DISTRIBUTION', 'LAB_TEST', 'RETAIL_STOCK'] },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    location: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true }
    },
    imageURL: { type: String },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const herbBatchSchema = new mongoose.Schema({
    batchId: { type: String, default: () => uuidv4(), unique: true, index: true },
    species: { type: String, required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    collectionDetails: {
        timestamp: { type: Date, default: Date.now },
        imageURL: { type: String, required: true },
        location: {
            type: { type: String, enum: ['Point'], required: true },
            coordinates: { type: [Number], required: true }
        }
    },
    qrCodeURL: { type: String, required: true },
    provenanceChain: [ProvenanceEventSchema],
    currentStatus: {
        type: String,
        required: true,
        enum: ['HARVESTED', 'IN_TRANSIT_TO_LAB', 'UNDER_TESTING', 'IN_TRANSIT_TO_RETAILER', 'IN_RETAIL', 'SOLD'],
        default: 'HARVESTED'
    },
    gpsTracking: {
        isActive: { type: Boolean, default: false },
        currentLocation: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] }
        },
        history: {
            type: [
                {
                    type: { type: String, enum: ['Point'], default: 'Point' },
                    coordinates: { type: [Number] }
                }
            ],
            default: []
        },
        lastUpdated: { type: Date }
    },
    currentOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pendingOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    transferOtp: { type: String },
    transferOtpExpiry: { type: Date },
    otpAttempts: { type: Number, default: 0 }
}, { timestamps: true });


herbBatchSchema.index({ "collectionDetails.location": '2dsphere' });
herbBatchSchema.index({ "provenanceChain.location": '2dsphere' });

const HerbBatch = mongoose.model('HerbBatch', herbBatchSchema);

export default HerbBatch;