import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./Routes/userRoutes.js";
import messageRouter from "./Routes/messageRoutes.js";
import { Server } from "socket.io";

// Create express app and HTTP server
const app = express();
const server = http.createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL;
// Initialize socket.io server
export const io = new Server(server, {
  // cors: {
  //   origin: "*",
  // },
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true, // If using cookies or auth tokens
  },
});
//store online users
export const userSocketMap = {}; //{userId: socketId}

// socket.io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected", userId);
  if (userId) {
    userSocketMap[userId] = socket.id;
  }
  //   Emit online users to all connected users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  //   on user get offline
  socket.on("disconnect", () => {
    console.log("User Disconnected", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Middleware setup
app.use(express.json({ limit: "4mb" }));
// app.use(
//   cors({
//     origin: "*",
//   })
// );

app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true, // If using cookies or auth tokens
  })
);
app.use("/api/status", (req, res) => res.send("server is live"));

// Routes
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);
// Start server with MongoDB connection
const startServer = async () => {
  try {
    await connectDB();
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
