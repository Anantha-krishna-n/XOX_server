import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import socketService from "./socketService";

const app = express();
app.use(cors({
  origin: [
    "https://xox-client.vercel.app", // Your Netlify URL
    "http://localhost:3000", // Vite default port for local dev
  ],
  methods: ["GET", "POST"],
  credentials: true,
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "https://xox-client.vercel.app",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Log Socket.IO connections
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
  });
});

socketService(io);

app.get("/", (_, res) => res.send("XOX backend"));

const PORT = Number(process.env.PORT || 4000);
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));