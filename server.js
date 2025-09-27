require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");

// Routes
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chats");
const userRoutes = require("./routes/users");
const feedbackRoutes = require("./routes/feedbackRoutes");
const appointmentRoutes = require("./routes/appointments");
const organizationRoutes = require("./routes/organizationRoutes");

// Middleware
const { authenticateSocket } = require("./middleware/auth");

// DB Initialize
const initializeDatabase = require("./initializeDatabase");

const app = express();
const server = http.createServer(app);

// Socket.IO Setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*", 
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize DB
initializeDatabase();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Static Files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/feedback", feedbackRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/chat", chatRoutes);

// Socket.IO Auth + Connection
io.use(authenticateSocket).on("connection", (socket) => {
  console.log("User connected:", socket.user?.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.user?.id);
  });
});

// Make io accessible in routes/controllers
app.set("socketio", io);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({ error: err.message || "Server Error" });
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(` Server running at http://0.0.0.0:${PORT}`);
});