import { useEffect, useState, useMemo } from "react";
import io from "socket.io-client";
import "./App.css";

// Socket Connection (HTTPS पक्का करें)
const socket = io.connect("https://chat-app-backend-xapn.onrender.com", {
  transports: ['websocket', 'polling'],
  withCredentials: true
});

function App() {
  const [userTyping, setUserTyping] = useState(false);
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

  // 1. यूनिक यूजरनाम (इंटरव्यू के लिए अच्छा फीचर है)
  const [userName, setUserName] = useState("User_" + Math.floor(Math.random() * 1000));

  // 2. ऑडियो फाइल (useMemo का उपयोग ताकि बार-बार लोड न हो)
  const notificationSound = useMemo(() => new Audio("/notification.mp3"), []);

  const joinRoom = async () => {
    if (room !== "") {
      socket.emit("join_room", room);
      try {
        const response = await fetch(`https://chat-app-backend-xapn.onrender.com/messages/${room}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setMessageList(data);
        }
        alert(`आप रूम ${room} में जुड़ चुके हैं!`);
      } catch (err) {
        console.error("पुराने मैसेज लोड नहीं हुए", err);
      }
    }
  };

  const sendMessage = async () => {
    if (message !== "" && room !== "") {
      const messageData = {
        room: room,
        author: userName, // Author भेजना जरूरी है
        message: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // बैकएंड को मैसेज भेजें
      await socket.emit("send_message", messageData);

      // अपनी खुद की लिस्ट में तुरंत जोड़ें
      setMessageList((prev) => [...prev, messageData]);
      setMessage(""); // इनपुट बॉक्स खाली करें
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (room !== "") {
      socket.emit("typing", { typing: true, room });

      setTimeout(() => {
        socket.emit("typing", { typing: false, room });
      }, 2000);
    }
  };

  useEffect(() => {
    const handleReceive = (data) => {
      // लिस्ट अपडेट करें
      setMessageList((prev) => [...prev, data]);

      // साउंड प्ले करें
      notificationSound.play().catch((err) => console.log("Audio block:", err));
    };

    const handleTypingStatus = (typing) => {
      setUserTyping(typing);
    };

    socket.on("receive_message", handleReceive);
    socket.on("display_typing", handleTypingStatus);

    // 3. क्लीनअप फंक्शन: डुप्लीकेट मैसेज और मेमोरी लीक रोकने के लिए
    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("display_typing", handleTypingStatus);
    };
  }, [socket, notificationSound]);

  return (
    <div className="chat-container">
      <div className="chat-card">
        <header className="chat-header">
          <div className="logo-box">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org">
              <rect x="1" y="3" width="22" height="14" rx="3" fill="#7c3aed" />
              <path d="M7 21l3-3h7a3 3 0 0 0 3-3V6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8.5 9.5h7M8.5 12.5h5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="title-box">
            <h1>Chat App 2026</h1>
            <p className="subtitle">Logged in as: <strong>{userName}</strong></p>
          </div>
        </header>

        <section className="room-section">
          <label className="label">Join a Room</label>
          <div className="row">
            <input
              className="chat-input"
              placeholder="Room ID..."
              onChange={(e) => setRoom(e.target.value)}
            />
            <button className="btn" onClick={joinRoom}>
              <span className="btn-text">Join</span>
            </button>
          </div>
        </section>

        <section className="message-section">
          <label className="label">Send Message</label>
          <div className="row">
            <input
              className="chat-input"
              placeholder="मैसेज टाइप करें..."
              value={message} // इसे जोड़ना जरूरी है ताकि बॉक्स खाली हो सके
              onChange={handleTyping}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <button className="btn primary" onClick={sendMessage}>
              <span className="btn-text">Send</span>
            </button>
          </div>
        </section>

        <section className="received-section">
          {userTyping && <p className="typing-text">सामने वाला टाइप कर रहा है...</p>}
          <h2 className="received-title">चैट हिस्ट्री:</h2>
          <div className="message-container">
            {messageList.map((content, index) => (
              <div
                key={index}
                className={`message-box ${content.author === userName ? "my-message" : ""}`}
              >
                <p><strong>{content.author === userName ? "You" : content.author}:</strong> {content.message}</p>
                <span className="msg-time">{content.time}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
