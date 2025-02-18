import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors"; // Import cors

const app = express();
const server = http.createServer(app);

// Enable CORS for all routes
app.use(cors({
  origin: "http://localhost:3001", // Replace with your frontend URL
  methods: ["GET", "POST"],
  credentials: true,
}));

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001", // Replace with your frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("frame", (frameData) => {
    const set1 = generatePoints(4);
    const set2 = generatePoints(5);
    socket.emit("points", { set1, set2 });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

function generatePoints(count) {
  return Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
  }));
}

server.listen(3000, () => {
  console.log("Backend running on port 3000");
});