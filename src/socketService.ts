import { Server, Socket } from "socket.io";
import { joinRoom, leave, makeMove, resetBoard, createOrGet } from "./roomService";

export default function socketService(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    socket.on("join-room", ({ roomId }, cb) => {
      const room = joinRoom(roomId, socket.id);
            console.log(`📥 User ${socket.id} joined room ${roomId}`);
      socket.join(roomId);
      io.to(roomId).emit("room-update", room);
            console.log(`📥 User ${socket.id} joined room ${roomId}`);
      cb?.(room);
    });

    socket.on("make-move", ({ roomId, index }) => {
      const updated = makeMove(roomId, socket.id, index);
      if (updated) io.to(roomId).emit("room-update", updated);
    });

    socket.on("restart-game", ({ roomId }) => {
      const updated = resetBoard(roomId);
      if (updated) io.to(roomId).emit("room-update", updated);
    });

    socket.on("webrtc-offer", ({ roomId, offer }) => {
      socket.to(roomId).emit("webrtc-offer", { from: socket.id, offer });
    });
    socket.on("webrtc-answer", ({ roomId, answer }) => {
      socket.to(roomId).emit("webrtc-answer", { from: socket.id, answer });
    });
    socket.on("webrtc-ice", ({ roomId, candidate }) => {
      socket.to(roomId).emit("webrtc-ice", { from: socket.id, candidate });
    });

    socket.on("disconnect", () => {
      leave(socket.id);
            console.log(`📥 User ${socket.id} joi`);

    });
  });
}
