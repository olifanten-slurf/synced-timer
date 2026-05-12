import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://" + window.location.hostname + ":3254");

export default function App() {
  const [timer, setTimer] = useState({
    duration: 300,
    startedAt: null,
    isRunning: false,
  });

  const [displaySeconds, setDisplaySeconds] = useState(300);
  const [minutesInput, setMinutesInput] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // 👇 admin mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsAdmin(params.get("admin") === "true");
  }, []);

  // 👇 socket sync
  useEffect(() => {
    socket.on("timer:update", (data) => setTimer(data));
    return () => socket.off("timer:update");
  }, []);

  // 👇 WAKE LOCK (screen stays on)
  useEffect(() => {
    let wakeLock;

    const enableWakeLock = async () => {
      try {
        wakeLock = await navigator.wakeLock.request("screen");
        console.log("Wake Lock enabled");
      } catch (err) {
        console.log("Wake Lock error:", err);
      }
    };

    enableWakeLock();

    return () => {
      wakeLock?.release?.();
    };
  }, []);

  // 👇 timer engine
  useEffect(() => {
    const interval = setInterval(() => {
      if (!timer?.startedAt || !timer?.isRunning) {
        setDisplaySeconds(timer?.duration ?? 0);
        return;
      }

      const elapsed = Math.floor(
        (Date.now() - timer.startedAt) / 1000
      );

      const remaining = Math.max(
        timer.duration - elapsed,
        0
      );

      setDisplaySeconds(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const mins = String(Math.floor(displaySeconds / 60)).padStart(2, "0");
  const secs = String(displaySeconds % 60).padStart(2, "0");

  const progress =
    timer.duration > 0 ? displaySeconds / timer.duration : 0;

  return (
    <div className="w-full h-full bg-black text-white flex flex-col items-center justify-center gap-8">

      {/* TIMER + RING */}
      <div className="relative w-80 h-80 flex items-center justify-center">

        <svg className="absolute w-full h-full rotate-[-90deg]">
          <circle
            cx="50%"
            cy="50%"
            r="120"
            stroke="white"
            strokeWidth="10"
            fill="none"
            opacity="0.15"
          />

          <circle
            cx="50%"
            cy="50%"
            r="120"
            stroke="white"
            strokeWidth="10"
            fill="none"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={
              2 * Math.PI * 120 * (1 - progress)
            }
            style={{
              transition: "stroke-dashoffset 1s linear",
            }}
          />
        </svg>

        <div className="text-6xl font-bold">
          {mins}:{secs}
        </div>
      </div>

      {/* ADMIN INPUT */}
      {isAdmin && (
        <div className="flex gap-2">
          <input
            type="number"
            value={minutesInput}
            placeholder="minutes"
            className="px-3 py-2 rounded bg-white text-black w-40"
            onChange={(e) => setMinutesInput(e.target.value)}
          />

          <button
            onClick={() => {
              if (!minutesInput) return;
              socket.emit("timer:setDuration", Number(minutesInput));
              setMinutesInput("");
            }}
            className="px-4 py-2 bg-blue-500 rounded"
          >
            Set
          </button>
        </div>
      )}

      {/* ADMIN CONTROLS */}
      {isAdmin && (
        <div className="flex gap-4">
          <button
            onClick={() => socket.emit("timer:start")}
            className="px-5 py-2 bg-green-500 rounded"
          >
            Start
          </button>

          <button
            onClick={() => socket.emit("timer:pause")}
            className="px-5 py-2 bg-yellow-500 rounded"
          >
            Pause
          </button>

          <button
            onClick={() => socket.emit("timer:reset")}
            className="px-5 py-2 bg-red-500 rounded"
          >
            Reset
          </button>
        </div>
      )}

      {!isAdmin && (
        <div className="text-gray-500 text-sm">
          View only mode
        </div>
      )}
    </div>
  );
}