import express from "express";
import { protectRoute } from "../Middleware/auth.js";
import {
  getMessages,
  getUsersForSidebar,
  markMessageAsSeen,
  sendMessage,
} from "../Controllers/messageController.js";
const messageRouter = express.Router();

messageRouter.get("/users", protectRoute, getUsersForSidebar);
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.put("mark/:id", protectRoute, markMessageAsSeen);
// Controller to send messages to selected user
messageRouter.post("/send/:id", protectRoute, sendMessage);
export default messageRouter;
