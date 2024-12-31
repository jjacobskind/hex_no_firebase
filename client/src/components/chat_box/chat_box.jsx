import React, { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/use_socket';
import { useAuth } from '../../hooks/use_auth';
import './chat_box.css';

/**
 * ChatBox component:
 * - Displays the list of chat messages
 * - Allows user to send new messages
 * - Listens to socket for incoming messages
 */
export default function ChatBox() {
  const socket = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (!socket) return;
    
    // Listen for incoming chat messages
    const handleIncoming = (msgObj) => {
      setMessages((prev) => [...prev, msgObj]);
    };
    socket.on('chat-message', handleIncoming);

    return () => {
      socket.off('chat-message', handleIncoming);
    };
  }, [socket]);

  const handleSend = () => {
    if (!socket || !inputValue.trim()) return;
    // Construct a chat message object
    const messageObj = {
      user: user ? user.username : 'Anonymous',
      text: inputValue.trim(),
      timestamp: Date.now(),
    };
    // Emit to server
    socket.emit('chat-message', messageObj);
    // Optionally add to local state immediately
    setMessages((prev) => [...prev, messageObj]);
    setInputValue('');
  };

  return (
    <div className="chat-box">
      <div className="chat-messages">
        {messages.map((m, idx) => (
          <ChatMessage key={idx} message={m} />
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyUp={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

/** Simple UI for each message */
function ChatMessage({ message }) {
  const time = new Date(message.timestamp).toLocaleTimeString();
  return (
    <div className="chat-message">
      <strong>{message.user}</strong>: {message.text} <small>({time})</small>
    </div>
  );
}
