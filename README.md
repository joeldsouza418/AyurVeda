# AyurTrace - Ayurvedic Herb Traceability Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19+-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/atlas)

## 🌿 Overview

AyurTrace is a comprehensive blockchain-inspired traceability platform designed specifically for Ayurvedic herbs. It enables end-to-end tracking of herbs from harvest to consumer, ensuring transparency, authenticity, and quality assurance through a scannable QR code system.

## ✨ Features

- **🔐 Multi-Role Authentication**: Secure user management for Farmers, Distributors, Lab Technicians, Retailers, and Consumers
- **📱 QR Code Integration**: Generate and scan QR codes for instant herb batch information
- **📍 GPS Tracking**: Real-time location tracking during distribution
- **📸 Geotagged Images**: Capture and store location-verified images at each stage
- **🔗 Provenance Chain**: Complete audit trail of herb journey from farm to consumer
- **📊 Dashboard Analytics**: Role-based dashboards for different stakeholders
- **🌐 Responsive Design**: Modern, mobile-friendly interface

## 🏗️ Architecture

This is a full-stack application with:

- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js + MongoDB
- **Authentication**: JWT-based with role-based access control
- **File Storage**: Local file system with Multer
- **QR Code Generation**: QRCode.js library

## 📁 Project Structure

```
AyurTrace/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions
│   │   └── config.js       # Frontend configuration
│   ├── package.json
│   └── vite.config.js
├── backend/                 # Node.js backend API
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers
│   ├── middlewares/        # Custom middleware
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   ├── uploads/            # File upload storage
│   ├── package.json
│   └── server.js
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB Atlas account or local MongoDB instance
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/KrishTanna28/AyurTrace.git
   cd AyurTrace
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Setup**
   
   Create a `.env` file in the `backend` directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   FRONTEND_URL=http://localhost:3000
   ```

5. **Create Upload Directories**
   ```bash
   cd backend
   mkdir -p uploads/qrcodes
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   The API will be available at `http://localhost:5000`

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

## 👥 User Roles

### 🌾 Farmer
- Create new herb batches with geotagged images
- View their farmed batches
- Track batch status through the supply chain

### 🚚 Distributor
- Update batch location in real-time
- Add distribution events to provenance chain
- Monitor batch movement

### 🧪 Lab Technician
- Add quality test results
- Update batch status based on lab tests
- Maintain quality records

### 🏪 Retailer
- View batch information for retail
- Add retail events to provenance chain
- Manage inventory

### 👤 Consumer
- Scan QR codes to view complete herb journey
- Access detailed provenance information
- Verify authenticity

## 🔧 API Documentation

### Authentication Endpoints
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile

### Batch Management
- `POST /api/batches` - Create new batch (Farmer only)
- `GET /api/batches` - Get all batches (Admin)
- `GET /api/batches/:batchId` - Get batch details
- `PUT /api/batches/:batchId/add-event` - Add provenance event

### GPS Tracking
- `PUT /api/gps/:batchId/update` - Update batch location
- `GET /api/gps/:batchId` - Get current location

For detailed API documentation, see [Backend README](backend/README.md)

## 🛠️ Development

### Available Scripts

**Backend:**
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Contact the development team

## 🔮 Future Enhancements

- [ ] Blockchain integration for immutable records
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Integration with IoT sensors
- [ ] Multi-language support
- [ ] API rate limiting and caching
- [ ] Automated testing suite

---

**AyurTrace** - Ensuring transparency and authenticity in Ayurvedic herb supply chains 🌿
