import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Serve the index page as the root route
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Serve the demo HTML page
router.get('/batch', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/demo.html'));
});

// Serve the QR scanner page
router.get('/scanner', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/scanner.html'));
});

// Serve the farmer upload page
router.get('/farmer', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/farmer.html'));
});

// Serve the distributor tracking page
router.get('/distributor', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/distributor.html'));
});

// Serve static files from the public directory
router.use(express.static(path.join(__dirname, '../public')));

export default router;