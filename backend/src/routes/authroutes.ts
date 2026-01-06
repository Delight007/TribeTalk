import bcrypt from "bcrypt";
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { authenticate } from "../middleware/auth";
import User from "../models/user";
import { sendEmail } from "../utils/sendEmail";
import { generateUsername } from "../utils/uniqueUsername";

// Define AuthRequest type to include userId
interface AuthRequest extends Request {
  userId?: string;
}

const router = express.Router();

/**
 * @route POST /auth/register
 * @desc Register a new user and send verification code
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // 1️⃣ Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2️⃣ Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Generate verification code
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

    // 5️⃣ Generate unique username
    const username = generateUsername(name);

    // 6️⃣ Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      verificationCode,
      isVerified: false,
      username,
    });

    await newUser.save();

    // 7️⃣ Respond immediately (don’t wait for email)
    res.status(201).json({
      message: "User registered successfully. Verification code sent to email.",
      email,
      name,
    });

    // 8️⃣ Fire-and-forget email sending (non-blocking)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    transporter
      .sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your Verification Code",
        text: `Your verification code is ${verificationCode}`,
      })
      .then(() => console.log(`✅ Verification email sent to ${email}`))
      .catch((err) => console.error(`❌ Email send error:`, err));
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

/**
 * @route POST /auth/verify
 * @desc Verify user's email using code
 */
router.post("/verify", async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.verificationCode !== code)
      return res.status(400).json({ message: "Invalid verification code" });

    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();

    res.json({ message: "User verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

/**
 * @route POST /auth/resend-code
 * @desc Resend verification code to user
 */
router.post("/resend-code", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified)
      return res.status(400).json({ message: "User already verified" });

    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationCode = newCode;
    user.codeExpiresAt = codeExpiresAt;
    await user.save();

    await sendEmail(
      email,
      "Your new RibeTalk verification code",
      `Your new verification code is: ${newCode}`
    );

    res.json({ message: "New verification code sent to your email" });
  } catch (error) {
    console.error("Resend code error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

/**
 * @route POST /auth/login
 * @desc Login user (only if verified)
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified)
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });
    console.log("JWT_SECRET:", process.env.JWT_SECRET);

    // Return essential profile info for client-side usage
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.username,
        username: user.username,
        email: user.email,
        avatar: user.avatar || null,
        bio: user.bio || "",
        phone: user.phone || "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth || null,
        isVerified: user.isVerified,
        following: user.following || [],
        followers: user.followers || [],
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get current user
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select(
      "-password -__v -verificationCode -codeExpiresAt"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Update user profile
router.put("/update-profile", authenticate, async (req: any, res) => {
  try {
    const { name, username, bio, avatar, phone, gender, dateOfBirth } =
      req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { name, username, bio, avatar, phone, gender, dateOfBirth },
      { new: true }
    ).select("-password -__v");

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Error updating profile", error: err });
  }
});

/**
 * @route GET /users
 * @desc Get all users except the logged-in user
 */
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    // Fetch all users except the current user
    const users = await User.find({ _id: { $ne: req.userId } }).select(
      "_id name username avatar following"
    );

    res.json(users);
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

/**
 * @route POST /users/follow/:id
 * @desc Follow a user
 */
router.post(
  "/follow/:id",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const targetUserId = req.params.id;
      if (req.userId === targetUserId)
        return res.status(400).json({ message: "Cannot follow yourself" });

      await User.findByIdAndUpdate(req.userId, {
        $addToSet: { following: targetUserId },
      });

      res.json({ message: "User followed" });
    } catch (err) {
      console.error("Follow error:", err);
      res.status(500).json({ message: "Server error", error: err });
    }
  }
);

/**
 * @route POST /users/unfollow/:id
 * @desc Unfollow a user
 */
router.post(
  "/unfollow/:id",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const targetUserId = req.params.id;

      await User.findByIdAndUpdate(req.userId, {
        $pull: { following: targetUserId },
      });

      res.json({ message: "User unfollowed" });
    } catch (err) {
      console.error("Unfollow error:", err);
      res.status(500).json({ message: "Server error", error: err });
    }
  }
);

export default router;
