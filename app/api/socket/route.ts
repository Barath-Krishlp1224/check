import { Server } from "socket.io";
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";

export const runtime = "nodejs";

let io: Server;

export async function GET() {
  if (!io) {
    io = new Server({
      path: "/api/socket",
      cors: { origin: "*" },
    });

    io.on("connection", (socket) => {

      // 🔑 each user joins their personal room
      socket.on("join-user", (empId: string) => {
        socket.join(`user_${empId}`);
      });

      socket.on("send-message", async (data) => {
        await connectDB();

        const message = await Message.create(data);

        // 🔥 send to receiver
        io.to(`user_${data.receiverId}`).emit("receive-message", message);

        // 🔁 send back to sender (multi-tab support)
        io.to(`user_${data.senderId}`).emit("receive-message", message);
      });
    });
  }

  return NextResponse.json({ ok: true });
}
