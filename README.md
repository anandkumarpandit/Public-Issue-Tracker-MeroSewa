# MeroSewa - Complaint Management System

A comprehensive web-based complaint management system for local government bodies (Gaupalika/Municipality) built with the MERN stack.

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Multer** - File upload handling
- **Bcrypt** - Password hashing
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Frontend
- **React.js** - UI library
- **React Router DOM** - Client-side routing
- **React Hook Form** - Form management
- **Axios** - HTTP client
- **QRCode.react** - QR code generation
- **QR Scanner** - QR code scanning
- **Tailwind CSS** - Utility-first CSS framework
- 
## Screenshots
![App Screenshot](https://img.sanishtech.com/u/27994cee00a7ef32ab2405c4c3c91597.png)
![App Screenshot](https://img.sanishtech.com/u/b78d2e65205a5146447ef81cd276cd40.png)
- ![App Screenshot](https://img.sanishtech.com/u/cca02ed1303b35184afca9a5fc1110d2.png)
- ![App Screenshot](https://img.sanishtech.com/u/4ef02a8e6ae3f6a148d7cc13e7206195.png)
- ![App Screenshot](https://img.sanishtech.com/u/ec4fd5e5ae03cce813e5d1ba614fe85f.png)
- ![App Screenshot](https://img.sanishtech.com/u/b034ebb63dbe9593d4a61fdb0b9d1166.png)


## 🚀 Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MeroSewa
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

5. **Start the Application**
   
   Terminal 1 (Backend):
   ```bash
   cd backend
   npm start
   ```
   
   Terminal 2 (Frontend):
   ```bash
   cd frontend
   npm start
   ```




## 🏗️ Architecture Overview

```
Users/anandkumar/MeroSewa
├── ARCHITECTURE.md          # Project architecture documentation
├── README.md                # Project overview and instructions
├── env.development          # Development environment variables
├── package.json             # Root dependencies and scripts
├── backend/                 # Server-side code
│   ├── config.env           # Environment variables
│   ├── server.js            # Backend entry point
│   ├── middleware/          # Custom middleware
│   │   ├── auth.js
│   │   └── authMiddleware.js
│   ├── models/              # Database schemas
│   │   ├── Complaint.js
│   │   └── User.js
│   ├── routes/              # API endpoints
│   │   ├── auth.js
│   │   └── complaints.js
│   ├── services/            # Business logic
│   │   └── qrService.js
│   └── uploads/             # Backend upload storage
│       └── complaints/
├── frontend/                # Client-side code
│   ├── package.json         # Frontend dependencies
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── public/              # Static assets
│   │   ├── index.html
│   │   └── ...
│   └── src/                 # React source code
│       ├── App.js           # Main component
│       ├── App.css
│       ├── index.js         # Entry point
│       ├── index.css
│       ├── components/      # Reusable UI components
│       │   ├── Chatbot.js
│       │   ├── Chatbot.css
│       │   ├── Footer.js
│       │   ├── Header.js
│       │   ├── ProtectedRoute.js
│       │   ├── QRCodeDisplay.js
│       │   └── QRScanner.js
│       ├── pages/           # Page views
│       │   ├── AdminDashboard.js
│       │   ├── AdminDashboard.css
│       │   ├── AdminLogin.js
│       │   ├── AdminLogin.css
│       │   ├── AdminSignup.js
│       │   ├── ComplaintForm.js (SubmitComplaint.js)
│       │   ├── GenerateQR.js
│       │   ├── Home.js
│       │   ├── Home.css
│       │   ├── QRInfo.js
│       │   ├── SubmitComplaint.js
│       │   ├── SubmitComplaint.css
│       │   ├── TrackComplaint.js
│       │   └── TrackComplaint.css
│       ├── services/        # API integration
│       │   ├── api.js
│       │   └── apiClient.js
│       └── utils/           # Helper functions
└── uploads/                 # Shared uploads directory
    ├── complaints/
    └── qr-codes/
```

