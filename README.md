# MeroSewa - Complaint Management System

A comprehensive web-based complaint management system for local government bodies (Gaupalika/Municipality) built with the MERN stack.

## 🏗️ Architecture Overview

```
MeroSewa/
├── backend/                 # Express.js Backend Server
│   ├── config/             
│   │   └── database.js     # MongoDB connection (unused)
│   ├── middleware/         
│   │   ├── auth.js         # JWT authentication middleware
│   │   └── upload.js       # File upload middleware
│   ├── models/             
│   │   ├── Complaint.js    # Complaint schema
│   │   ├── Officer.js      # Officer schema
│   │   └── User.js         # Admin user schema
│   ├── routes/             
│   │   ├── auth.js         # Admin authentication routes
│   │   └── complaints.js   # Complaint CRUD operations
│   ├── services/           
│   │   ├── aiService.js    # AI service placeholder (unused)
│   │   └── qrService.js    # QR code generation service
│   ├── uploads/            
│   │   └── complaints/     # Uploaded complaint attachments
│   ├── config.env          # Environment variables
│   ├── server.js           # Main server entry point
│   └── check_db.js         # Database testing utility
│
├── frontend/               # React.js Frontend Application
│   ├── public/             
│   │   ├── index.html      
│   │   └── favicon.ico     
│   ├── src/                
│   │   ├── components/     
│   │   │   ├── Chatbot.js          # AI chatbot for complaint submission
│   │   │   ├── Chatbot.css         
│   │   │   ├── Footer.js           # Footer component
│   │   │   ├── Header.js           # Navigation header
│   │   │   ├── ProtectedRoute.js   # Route protection wrapper
│   │   │   ├── QRCodeDisplay.js    # QR code display component
│   │   │   └── QRScanner.js        # QR code scanner component
│   │   ├── pages/          
│   │   │   ├── Home.js             # Landing page
│   │   │   ├── Home.css            
│   │   │   ├── SubmitComplaint.js  # Complaint submission form
│   │   │   ├── SubmitComplaint.css 
│   │   │   ├── TrackComplaint.js   # Complaint tracking page
│   │   │   ├── TrackComplaint.css  
│   │   │   ├── AdminLogin.js       # Admin login page
│   │   │   ├── AdminLogin.css      
│   │   │   ├── AdminSignup.js      # Admin registration page
│   │   │   ├── AdminDashboard.js   # Admin dashboard
│   │   │   ├── AdminDashboard.css  
│   │   │   ├── GenerateQR.js       # QR code generation page
│   │   │   └── QRInfo.js           # QR information page
│   │   ├── services/       
│   │   │   └── api.js              # API service layer
│   │   ├── App.js                  # Main app component
│   │   ├── App.css                 
│   │   └── index.js                # React entry point
│   ├── package.json        
│   └── README.md           
│
└── scripts/                # Utility scripts
    ├── setup-admin.js      # Admin user creation script
    ├── setup-database.js   # Database seeding script
    └── test-connection.js  # MongoDB connection test
```

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

## 📊 Database Schema

### Complaint Model
```javascript
{
  complaintNumber: String (unique),
  personName: String,
  phone: String,
  email: String,
  wardNumber: Number,
  location: String,
  address: String,
  complaintType: String,
  priority: String (Low/Medium/High/Emergency),
  title: String,
  description: String,
  incidentDate: Date,
  attachments: [String],
  status: String,
  assignedTo: String,
  assignedPhone: String,
  assignedEmail: String,
  resolutionNotes: String,
  actionDate: Date,
  lastUpdated: Date,
  timestamps: true
}
```

### User Model (Admin)
```javascript
{
  username: String (unique),
  email: String,
  password: String (hashed),
  role: String (admin),
  isActive: Boolean,
  lastLogin: Date,
  timestamps: true
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

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

3. **Configure Environment Variables**
   
   Create `backend/config.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/gaupalika_complaints
   PORT=5000
   JWT_SECRET=your_jwt_secret_key
   ADMIN_REGISTRATION_SECRET=your_admin_secret
   FRONTEND_URL=http://localhost:3000
   ```

4. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Start the Application**
   
   Terminal 1 (Backend):
   ```bash
   cd backend
   node server.js
   ```
   
   Terminal 2 (Frontend):
   ```bash
   cd frontend
   npm start
   ```

6. **Create Admin User** (Optional)
   ```bash
   cd scripts
   node setup-admin.js
   ```

## 🔑 Key Features

### Public Features
- ✅ Submit complaints with attachments (images/documents)
- ✅ Track complaint status using complaint number
- ✅ QR code-based quick complaint submission
- ✅ Location auto-detection
- ✅ AI Chatbot for guided complaint submission
- ✅ Mobile-responsive design

### Admin Features
- ✅ Secure admin authentication (JWT)
- ✅ View all complaints with pagination
- ✅ Filter complaints by status, type, priority, ward
- ✅ Update complaint status and assign officers
- ✅ Add resolution notes
- ✅ Generate QR codes for locations
- ✅ Dashboard with statistics

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Admin registration (requires secret)
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Verify token

### Complaints
- `POST /api/complaints/submit` - Submit complaint
- `POST /api/complaints/qr/submit` - Submit via QR code
- `GET /api/complaints/track/:complaintNumber` - Track complaint
- `GET /api/complaints` - Get all complaints (admin, with pagination)
- `GET /api/complaints/stats/overview` - Get statistics
- `PATCH /api/complaints/:id/status` - Update complaint status

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected admin routes
- CORS configuration
- Helmet security headers
- Input validation
- File upload restrictions

## 📱 Complaint Workflow

1. **Submission** → User submits complaint via form/chatbot/QR
2. **Submitted** → Complaint enters the system
3. **Under Review** → Admin reviews the complaint
4. **Accepted** → Complaint is validated and accepted
5. **In Progress** → Officer is assigned and working on it
6. **Resolved** → Issue is fixed
7. **Rejected** → Complaint is invalid (optional)

## 🎨 UI Components

- **Header** - Navigation with responsive menu
- **Footer** - Contact and copyright information
- **Chatbot** - Interactive AI assistant
- **QR Scanner** - Camera-based QR code reader
- **QR Display** - Generate and display QR codes
- **Protected Routes** - Authentication wrapper

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/gaupalika_complaints` |
| `PORT` | Backend server port | `5000` |
| `JWT_SECRET` | Secret key for JWT | `supersecretkey123` |
| `ADMIN_REGISTRATION_SECRET` | Secret for admin registration | `admin_secret_2024` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## 🧪 Testing

### Test Database Connection
```bash
node scripts/test-connection.js
```

### Check Database Contents
```bash
node backend/check_db.js
```

### Seed Sample Data
```bash
node scripts/setup-database.js
```

## 📦 Deployment

### Backend Deployment
1. Set environment variables on hosting platform
2. Ensure MongoDB is accessible
3. Run `npm install --production`
4. Start with `node server.js`

### Frontend Deployment
1. Update API URLs in `src/services/api.js`
2. Run `npm run build`
3. Deploy the `build` folder to hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Anand Kumar

## 🐛 Known Issues

- File upload size limit: 5 files max
- QR scanner requires HTTPS in production
- Location detection requires browser permission

## 🔮 Future Enhancements

- [ ] Email/SMS notifications
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Complaint priority auto-detection
- [ ] Integration with government APIs
- [ ] Real-time updates with WebSockets

## 📞 Support

For support, email support@merosewa.com or create an issue in the repository.
