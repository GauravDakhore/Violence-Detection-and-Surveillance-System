// src/api/socket.js
import { io } from "socket.io-client";

// Use .env VITE_SOCKET_URL or default to localhost
const URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
export const socket = io(URL, { autoConnect: false });
