import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// Signup new user
export const signup = async (req, res) => {
  const { fullName, email, password, bio } = req.body;
  try {
    // validation
    if (!fullName || !email || !password || !bio) {
      return res.json({ success: false, message: "Missing Details" });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.json({ success: false, message: "User already exist" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      bio,
    });
    //token
    const token = generateToken(newUser._id);
    res.json({
      success: true,
      userData: newUser,
      token,
      message: "Account Created Successfully",
    });
  } catch (err) {
    console.log("Error while creating new user", err.message);
    res.json({ success: false, message: err.message });
  }
};

// Function for login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // console.log("password while login", password);
    // console.log("email while login", email);
    const userData = await User.findOne({ email });
    // console.log("userData", userData);
    const isPassword = await bcrypt.compare(password, userData.password);
    if (!isPassword) {
      res.json({ success: false, message: "Incorrect Credentials" });
    }
    const token = generateToken(userData._id);
    res.json({ success: true, userData, token, message: "Login Successfully" });
  } catch (err) {
    console.log("Error while login", err.message);
    res.json({ success: false, message: err.message });
  }
};

// Controller to check if user is authenticated
export const checkAuth = (req, res) => {
  // as middleware already check the authentication status
  res.json({ success: true, user: req.user });
};

// Controller to update user profile image
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, fullName } = req.body;
    const userId = req.user._id;
    let updatedUser;
    if (!profilePic) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { bio, fullName },
        { new: true }
      );
    } else {
      const upload = await cloudinary.uploader.upload(profilePic);
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: upload.secure_url, bio, fullName },
        { new: true }
      );
    }
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.log("Error while updating user", err.message);
    res.json({ success: false, message: err.message });
  }
};
