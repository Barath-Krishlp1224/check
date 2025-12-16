"use client";

import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Employee {
  empId: string;
  name: string;
}

interface Message {
  senderId: string;
  senderName: string;
  content: string;
}

let socket: Socket | null = null;

const currentUser = {
  empId: "EMP001",
  name: "Barath",
};

export default function ChatComponent() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  // 🔹 connect socket + join user room
  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => setEmployees(d.employees || []));

    fetch("/api/socket");

    socket = io({ path: "/api/socket" });

    // 🔑 join personal room
    socket.emit("join-user", currentUser.empId);

    socket.on("receive-message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  const sendMessage = () => {
    if (!text || !selected || !socket) return;

    socket.emit("send-message", {
      senderId: currentUser.empId,
      senderName: currentUser.name,
      receiverId: selected.empId,
      content: text,
    });

    setText("");
  };

  return (
    <div className="max-w-3xl mx-auto p-6 border rounded-xl bg-white">
      <h2 className="text-2xl font-bold mb-4">Internal Chat</h2>

      <select
        className="border p-2 w-full mb-4"
        value={selected?.empId || ""}
        onChange={(e) =>
          setSelected(
            employees.find((x) => x.empId === e.target.value) || null
          )
        }
      >
        <option value="">Select employee</option>
        {employees
          .filter((e) => e.empId !== currentUser.empId)
          .map((e) => (
            <option key={e.empId} value={e.empId}>
              {e.name}
            </option>
          ))}
      </select>

      <div className="h-80 overflow-y-auto border p-4 mb-4 bg-gray-50 flex flex-col gap-2">
        {messages.map((m, i) => {
          const isMe = m.senderId === currentUser.empId;
          return (
            <div
              key={i}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`p-3 rounded-lg max-w-xs ${
                  isMe ? "bg-green-200" : "bg-blue-100"
                }`}
              >
                {!isMe && (
                  <div className="text-xs font-semibold mb-1">
                    {m.senderName}
                  </div>
                )}
                {m.content}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          className="border p-2 flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!selected}
        />
        <button
          onClick={sendMessage}
          disabled={!selected}
          className="bg-green-600 text-white px-4"
        >
          Send
        </button>
      </div>
    </div>
  );
}
