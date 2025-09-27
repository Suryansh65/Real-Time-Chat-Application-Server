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

// Initialize socket.io server
export const io = new Server(server, {
  cors: { origin: "*" },
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
app.use(cors());
app.use("/api/status", (req, res) => res.send("server is live"));

// Routes
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);
// Connect to mongodb
await connectDB();

// Export server for vercel
export default app;
