const fs = require("fs");
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
require("dotenv").config({ path: path.join(__dirname, "config.env") });

const app = express();

// Security and performance middleware
app.use(helmet());
app.use(compression()); // Compress all HTTP responses

// Request timeout middleware (15 seconds)
app.use((req, res, next) => {
  req.setTimeout(15000, () => {
    res.status(408).json({ success: false, message: "Request timeout" });
  });
  res.setTimeout(15000, () => {
    res.status(408).json({ success: false, message: "Response timeout" });
  });
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // Allow requests with no origin (like mobile apps or curl requests)
//       if (!origin) return callback(null, true);

//       if (
//         origin.match(/^http:\/\/localhost:\d+$/) ||
//         origin.match(/^http:\/\/127\.0\.0\.1:\d+$/)
//       ) {
//         return callback(null, true);
//       }

//       // Allow the specific FRONTEND_URL if set
//       if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
//         return callback(null, true);
//       }

//       console.log("Blocked by CORS:", origin);
//       callback(new Error("Not allowed by CORS"));
//     },
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: [
      "https://merosewa-9s4o.onrender.com", // your frontend
      "http://localhost:3000",              // dev
    ],
    credentials: true,
    methods: "GET,POST,PUT,DELETE,PATCH"
  })
);

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadsDir));

// ROUTES IMPORT
app.use("/api/complaints", require("./routes/complaints"));
app.use("/api/auth", require("./routes/auth"));

// DATABASE CONNECTION
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB error:", err));

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
