#!/usr/bin/env bash

#############################################
# PHASE 5 UPDATE SCRIPT
# Adds real-time chat to the game page
#############################################

# 1) Create/update chat_box folder and files
mkdir -p src/components/chat_box

# chat_box.jsx
cat << 'EOF' > src/components/chat_box/chat_box.jsx
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
EOF

# chat_box.css
cat << 'EOF' > src/components/chat_box/chat_box.css
.chat-box {
  display: flex;
  flex-direction: column;
  border: 1px solid #ccc;
  background-color: #efefef;
  width: 300px;
  height: 400px;
  margin-left: 20px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.chat-input {
  display: flex;
  padding: 8px;
  gap: 8px;
}

.chat-input input {
  flex: 1;
  padding: 4px;
}

.chat-message {
  margin-bottom: 6px;
  background-color: #fff;
  border-radius: 4px;
  padding: 4px;
  border: 1px solid #ddd;
}
EOF

cat << 'EOF' > src/components/chat_box/index.js
export { default } from './chat_box.jsx';
EOF

# 2) Update game_page.jsx to include ChatBox (sidebar or beneath the board)
cat << 'EOF' > src/components/game_page/game_page.jsx
import React, { useEffect } from 'react';
import { useGameState } from '../../hooks/use_game_state';
import BoardScene from '../board_scene/board_scene';
import ChatBox from '../chat_box/chat_box';
import './game_page.css';

export default function GamePage() {
  const { players, selectedTile } = useGameState();

  // Log whenever players change
  useEffect(() => {
    console.log('[GamePage] players updated:', players);
  }, [players]);

  return (
    <div className="game-page">
      <h2>Hex Island</h2>
      <p>Now includes a real-time ChatBox!</p>

      <div className="game-layout">
        <div className="board-section">
          <BoardScene />
          {selectedTile && (
            <div className="selected-tile-info">
              <h3>Selected Tile</h3>
              <p><strong>Resource:</strong> {selectedTile.resource}</p>
              <p><strong>Dice #:</strong> {selectedTile.diceNumber || 'None'}</p>
              <p><strong>Tile ID:</strong> {selectedTile.id}</p>
            </div>
          )}
        </div>

        <ChatBox />
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Players in the game:</h3>
        <ul>
          {players.map((p, idx) => (
            <li key={idx}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
EOF

# 3) Update game_page.css to arrange ChatBox next to the board
cat << 'EOF' > src/components/game_page/game_page.css
.game-page {
  text-align: center;
  padding: 20px;
}

.game-layout {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  margin-top: 20px;
}

.board-section {
  position: relative;
}

.selected-tile-info {
  margin-top: 10px;
  background-color: #fafafa;
  border: 1px solid #ccc;
  padding: 10px;
  width: 180px;
  margin: 0 auto;
}
EOF

echo "Phase 5 files created/updated successfully!"
echo "Next steps:"
echo "1) Run 'npm start' and log in."
echo "2) At /game, see a ChatBox on the right. Type a message, press Enter or click Send."
echo "3) If multiple clients are open, they should receive each other's messages in real-time, as long as the server emits 'chat-message' to all."
echo "4) Update your server to handle 'chat-message' events and broadcast them to all sockets if not already in place."