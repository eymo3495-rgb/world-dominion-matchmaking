const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

let waitingPlayer = null;
let nextMatchId = 1;

function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    let msg;

    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type !== "join_queue") return;

    if (waitingPlayer && waitingPlayer.readyState === WebSocket.OPEN) {
      const player1 = waitingPlayer;
      const player2 = ws;
      waitingPlayer = null;

      const matchId = nextMatchId++;

      send(player1, {
        type: "match_found",
        match_id: matchId,
        side: "blue"
      });

      send(player2, {
        type: "match_found",
        match_id: matchId,
        side: "red"
      });
    } else {
      waitingPlayer = ws;
      send(ws, { type: "queue_joined" });
    }
  });

  ws.on("close", () => {
    if (waitingPlayer === ws) waitingPlayer = null;
  });
});

console.log("World Dominion matchmaking server started on port " + PORT);
