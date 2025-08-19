import { Server, Socket } from "socket.io";
import { joinRoom, leave, makeMove, resetBoard } from "./roomService";

const readyUsers = new Map<string, Set<string>>(); // roomId -> set of ready socket.ids

export default function socketService(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    socket.on("join-room", ({ roomId }, cb) => {
      const room = joinRoom(roomId, socket.id);
      console.log(`📥 User ${socket.id} joined room ${roomId}`);
      socket.join(roomId);
      
      // Removed immediate "ready-for-offer" here
      
      io.to(roomId).emit("room-update", room);
      cb?.(room);
    });

    // New: Client signals media is ready
    socket.on("media-ready", ({ roomId }) => {
      if (!readyUsers.has(roomId)) {
        readyUsers.set(roomId, new Set());
      }
      readyUsers.get(roomId)!.add(socket.id);

      const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
      if (socketsInRoom && socketsInRoom.size === 2 && readyUsers.get(roomId)!.size === 2) {
        // Safe to start: Notify first user for offer
        const [firstSocketId] = socketsInRoom;
        io.to(firstSocketId).emit("ready-for-offer");
      }
    });

    socket.on("make-move", ({ roomId, index }) => {
      const updated = makeMove(roomId, socket.id, index);
      if (updated) io.to(roomId).emit("room-update", updated);
    });

    socket.on("restart-game", ({ roomId }) => {
      const updated = resetBoard(roomId);
      if (updated) io.to(roomId).emit("room-update", updated);
    });

    // WebRTC Signaling (unchanged)
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
      // Clean up ready status
      for (const [roomId, users] of readyUsers.entries()) {
        if (users.has(socket.id)) {
          users.delete(socket.id);
          if (users.size === 0) readyUsers.delete(roomId);
          break;
        }
      }
      console.log(`🚪 User disconnected: ${socket.id}`);
    });
  });
}