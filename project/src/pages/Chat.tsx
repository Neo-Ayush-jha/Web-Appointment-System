import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // backend ka url

export default function Chat({ appointmentId, user }) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");

  useEffect(() => {
    socket.emit("joinRoom", appointmentId);

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [appointmentId]);

  const sendMessage = () => {
    const msgData = {
      appointmentId,
      sender_id: user.id,
      receiver_id: 2, // service provider id ya user id
      message: newMsg,
    };
    socket.emit("sendMessage", msgData);
    setNewMsg("");
  };

  return (
    <div>
      <div>
        {messages.map((m, i) => (
          <p key={i}>
            <b>{m.sender_id}</b>: {m.message}
          </p>
        ))}
      </div>
      <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
