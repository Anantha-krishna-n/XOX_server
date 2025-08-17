

export type Cell = "X" | "O" | null;
export type Player = { socketId: string; mark: "X" | "O" };
export type RoomState = {
  id: string;
  players: Player[];
  board: Cell[];
  turn: "X" | "O";
  winner: "X" | "O" | "draw" | null;
};

const rooms = new Map<string, RoomState>();
const socketToRoom = new Map<string, string>();

export function createOrGet(roomId: string): RoomState {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      players: [],
      board: Array(9).fill(null),
      turn: "X",
      winner: null,
    });
  }
  return rooms.get(roomId)!;
}

export function joinRoom(roomId: string, socketId: string) {
  const r = createOrGet(roomId);
  if (!r.players.find(p => p.socketId === socketId)) {
    const mark: "X" | "O" = r.players.length === 0 ? "X" : "O";
    r.players.push({ socketId, mark });
    socketToRoom.set(socketId, roomId);
  }
  return r;
}

export function leave(socketId: string) {
  const roomId = socketToRoom.get(socketId);
  if (!roomId) return;
  const r = rooms.get(roomId);
  if (!r) return;
  r.players = r.players.filter(p => p.socketId !== socketId);
  socketToRoom.delete(socketId);
  if (r.players.length === 0) rooms.delete(roomId);
}

export function makeMove(roomId: string, socketId: string, index: number) {
  const r = rooms.get(roomId);
  if (!r) return r;
  if (r.winner) return r;
  const player = r.players.find(p => p.socketId === socketId);
  if (!player) return r;
  if (player.mark !== r.turn) return r;
  if (r.board[index] !== null) return r;

  r.board[index] = player.mark;
  r.turn = r.turn === "X" ? "O" : "X";
  r.winner = checkWinner(r.board);
  if (!r.winner && r.board.every(c => c !== null)) r.winner = "draw";
  return r;
}

export function resetBoard(roomId: string) {
  const r = rooms.get(roomId);
  if (!r) return r;
  r.board = Array(9).fill(null);
  r.turn = "X";
  r.winner = null;
  return r;
}

function checkWinner(board: Cell[]): "X" | "O" | null {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}
