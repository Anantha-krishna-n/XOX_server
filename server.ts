import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import socketService from "./src/socketService";

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET","POST"] } });

socketService(io);

app.get("/", (_, res) => res.send("XOX backend"));

const PORT = Number(process.env.PORT || 4000);
server.listen(PORT, () => console.log("listening on", PORT));
