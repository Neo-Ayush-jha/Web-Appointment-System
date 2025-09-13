require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const feedbackRoutes = require("./routes/feedbackRoutes");
const appointmentRoutes = require('./routes/appointments');
const organizationRoutes = require("./routes/organizationRoutes");
const { authenticateSocket } = require('./middleware/auth');
const initializeDatabase = require('./initializeDatabase');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

initializeDatabase();

// Middleware
app.use(cors());
app.use(bodyParser.json());
// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api", feedbackRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', userRoutes);
app.use("/api/organizations", organizationRoutes);

// WebSockets
io.use(authenticateSocket).on('connection', (socket) => {
  console.log('User connected:', socket.user.id);
  socket.on('disconnect', () => console.log('User disconnected'));
});

app.set('socketio', io);

// server.listen(process.env.PORT || 3000, () => {
//   console.log('Server started');
// });

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started on http://0.0.0.0:${PORT}`);
});
