import { useEffect, useState } from "react";
import io from "socket.io-client";
import "./App.css";

const socket = io.connect("https://chat-app-backend-xapn.onrender.com", {
  transports: ['websocket', 'polling']
});


function App() {
  const [userTyping, setUserTyping] = useState(false);
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [messageReceived, setMessageReceived] = useState("");

  const joinRoom = async () => {
    if (room !== "") {
      socket.emit("join_room", room);
      const response = await fetch(`https://chat-app-backend-xapn.onrender.com/messages/${room}`);
      const data = await response.json();
      setMessageList(data);
      alert(`आप रूम ${room} में जुड़ चुके हैं और पिछले मैसेज लोड हो गए हैं!`);
    }
  };

  const sendMessage = () => {
    // अब हम मैसेज के साथ रूम आईडी भी भेजेंगे
    socket.emit("send_message", { message: message, room: room });
    setMessageList(prev => [...prev, { author: "You", message, time: new Date().toLocaleTimeString() }]);
    setMessage("");
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

  const notificationSound = new Audio("/notification.mp3");

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessageReceived(data.message);
      setMessageList(prev => [...prev, { author: data.author, message: data.message, time: data.time }]);
      notificationSound.play().catch((err) => {
        console.log("Audio play failed: ", err);
        // ब्राउज़र सुरक्षा के कारण कभी-कभी पहला साउंड ब्लॉक करता है जब तक यूजर क्लिक न करे
      });
    });

    socket.on("display_typing", (typing) => {
      setUserTyping(typing);
    });

    return () => socket.off("receive_message");
  }, [socket]);

  return (
    <div className="chat-container">
      <div className="chat-card">
        <header className="chat-header">
          <div className="logo-box" aria-hidden>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="3" width="22" height="14" rx="3" fill="#7c3aed" />
              <path d="M7 21l3-3h7a3 3 0 0 0 3-3V6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8.5 9.5h7M8.5 12.5h5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="title-box">
            <h1>Real-Time Chat App</h1>
            <p className="subtitle">Fast • Secure • Simple</p>
          </div>
        </header>

        <section className="room-section">
          <label className="label">Join a Room</label>
          <div className="row">
            <input
              className="chat-input"
              placeholder="Room ID (जैसे 123)..."
              onChange={(e) => setRoom(e.target.value)}
            />
            <button className="btn" onClick={joinRoom} aria-label="Join Room">
              <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M15 14a4 4 0 1 0-6 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 12v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 21v-2a4 4 0 0 0-4-4H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
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
              onChange={
                handleTyping
              }
            />
            <button className="btn primary" onClick={sendMessage} aria-label="Send Message">
              <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2l-7 20  -4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
              </svg>
              <span className="btn-text">Send</span>
            </button>
          </div>
        </section>

        <section className="received-section">
          {userTyping && <p className="typing-text">सामने वाला टाइप कर रहा है...</p>}
          <h2 className="received-title">मैसेज:</h2>
          <div className="message-container">
            {messageList.map((content, index) => {
              return (
                <div key={index} className="message-box">
                  <p><strong>{content.author}:</strong> {content.message}</p>
                  <span>{content.time}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
