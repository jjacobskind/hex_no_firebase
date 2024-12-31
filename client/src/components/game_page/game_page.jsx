import React, { useEffect } from 'react';
import { useGameState } from '../../hooks/use_game_state';
import BoardScene from '../board_scene/board_scene';
import ChatBox from '../chat_box/chat_box';
import BuildMenu from '../build_menu/build_menu';
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
      <p>Now you can build basic roads. Click "Build Road," then click an edge.</p>

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

        <div className="sidebar">
          <ChatBox />
          <BuildMenu />
        </div>
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
