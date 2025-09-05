import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/qrcodes');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Generate a QR code for a batch and save it to the filesystem
 * @param {string} batchId - The unique ID of the herb batch
 * @param {string} baseUrl - The base URL for the frontend (e.g., http://localhost:3000)
 * @returns {Promise<string>} - The URL path to the generated QR code image
 */
const generateQRCode = async (batchId, baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000') => {
    try {
        // Create the URL that will be encoded in the QR code
        const batchUrl = `${baseUrl}/batch/${batchId}`;
        
        // Generate a unique filename
        const filename = `qrcode-${batchId}-${Date.now()}.png`;
        const filePath = path.join(uploadsDir, filename);
        
        // Generate QR code and save to file
        await QRCode.toFile(filePath, batchUrl, {
            color: {
                dark: '#00873E',  // Green color for Ayurvedic theme
                light: '#FFFFFF'  // White background
            },
            width: 300,
            margin: 1
        });
        
        // Return the relative path to the QR code
        return `/uploads/qrcodes/${filename}`;
    } catch (error) {
        console.error('QR Code generation error:', error);
        throw new Error('Failed to generate QR code');
    }
};

export default generateQRCode;