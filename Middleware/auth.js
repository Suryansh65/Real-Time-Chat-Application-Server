import jwt from "jsonwebtoken";
import User from "../models/User.js";
// Middleware to protect route not for login or signup as the user is just logged in , this is for inside routes so that if token is expired than user cannot go on websites and should be logged out

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.headers.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      res.json({ success: false, message: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    console.log("Error in middleware", err.message);
    res.json({ success: false, message: err.message });
  }
};
