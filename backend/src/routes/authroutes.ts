import bcrypt from "bcrypt";
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { authenticate } from "../middleware/auth";
import User from "../models/user";
import { sendEmail } from "../utils/sendEmail";

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
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      verificationCode,
      isVerified: false,
    });
    await newUser.save();

    // ✉️ Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Verification Code",
      text: `Your verification code is ${verificationCode}`,
    });

    res.status(201).json({
      message: "User registered successfully. Verification code sent to email.",
      email,
    });
  } catch (error) {
    console.error(error);
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

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error });
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
export default router;
