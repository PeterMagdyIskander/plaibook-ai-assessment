import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "http://localhost:3001" }));

const io = new Server(server, {
  cors: { origin: "http://localhost:3001" }
});

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("process_frame", async ({ id, frameData }) => {
    // Generate points
    const points = {
      set1: Array.from({ length: 4 }, () => ({
        x: Math.random(),
        y: Math.random()
      })),
      set2: Array.from({ length: 5 }, () => ({
        x: Math.random(),
        y: Math.random()
      }))
    };

    // Random delay between 5-10 seconds
    await new Promise(resolve => 
      setTimeout(resolve, 5000 + Math.random() * 5000)
    );

    socket.emit("frame_processed", {
      id,
      points,
      processedAt: Date.now()
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(3000, () => {
  console.log("Backend running on port 3000");
});