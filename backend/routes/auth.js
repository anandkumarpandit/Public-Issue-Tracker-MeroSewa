const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";
const ADMIN_REGISTRATION_SECRET = process.env.ADMIN_REGISTRATION_SECRET || "admin_secret_2024";


router.post("/register", async (req, res) => {
  try {
    const { username, email, password, registrationSecret } = req.body;

    if (!username || !email || !password || !registrationSecret) {
      return res.json({
        success: false,
        message: "Username, email, password, and registration secret are required",
      });
    }

    if (registrationSecret !== ADMIN_REGISTRATION_SECRET) {
      return res.json({
        success: false,
        message: "Invalid registration secret. Only authorized personnel can register as admin.",
      });
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.json({
        success: false,
        message: "Username already exists",
      });
    }

    const newAdmin = new User({
      username: username.toLowerCase(),
      email: email || undefined,
      password: password, 
      role: "admin",
      isActive: true,
    });

    await newAdmin.save();

    return res.json({
      success: true,
      message: "Admin account created successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({
        success: false,
        message: "Username and password are required",
      });
    }

  
    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return res.json({
        success: false,
        message: "Invalid credentials",
      });
    }

 
    if (user.role !== "admin") {
      return res.json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    if (!user.isActive) {
      return res.json({
        success: false,
        message: "Account is deactivated. Please contact administrator.",
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.json({
        success: false,
        message: "Invalid credentials",
      });
    }

    await user.updateLastLogin();

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
});


router.get("/me", (req, res) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.json({ success: false, message: "No token provided" });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ success: true, data: decoded });
  } catch (err) {
    return res.json({ success: false, message: "Invalid token" });
  }
});



module.exports = router;

