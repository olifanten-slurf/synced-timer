const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

let baseDuration = 300;

let timerState = {
  duration: baseDuration,
  startedAt: null,
  isRunning: false,
};

io.on("connection", (socket) => {
  console.log("client connected");

  socket.emit("timer:update", timerState);

  socket.on("timer:setDuration", (minutes) => {
    console.log("SET RECEIVED:", minutes);

    const m = Number(minutes);
    if (isNaN(m)) return;

    const seconds = Math.max(0, m * 60);

    baseDuration = seconds;

    timerState = {
      duration: seconds,
      startedAt: null,
      isRunning: false,
    };

    io.emit("timer:update", timerState);
  });

  socket.on("timer:start", () => {
    timerState.startedAt = Date.now();
    timerState.isRunning = true;

    io.emit("timer:update", timerState);
  });

  socket.on("timer:pause", () => {
    if (!timerState.isRunning || !timerState.startedAt) return;

    const elapsed = Math.floor(
      (Date.now() - timerState.startedAt) / 1000
    );

    timerState.duration = Math.max(
      timerState.duration - elapsed,
      0
    );

    timerState.startedAt = null;
    timerState.isRunning = false;

    io.emit("timer:update", timerState);
  });

  socket.on("timer:reset", () => {
    timerState = {
      duration: baseDuration,
      startedAt: null,
      isRunning: false,
    };

    io.emit("timer:update", timerState);
  });

  socket.on("disconnect", () => {
    console.log("client disconnected");
  });
});

server.listen(3254, () => {
  console.log("server running on 3254");
});