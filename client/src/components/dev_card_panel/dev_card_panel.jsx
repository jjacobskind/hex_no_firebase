import React, { useState } from 'react';
import { useGameState } from '../../hooks/use_game_state';
import { useAuth } from '../../hooks/use_auth';
import './dev_card_panel.css';

/**
 * DevCardPanel:
 * - Draw a dev card (costs 1 resource)
 * - List dev cards in your hand
 * - Play a dev card, triggering an effect
 */
export default function DevCardPanel() {
  const {
    devDeck, playerDevCards, drawDevCard, playDevCard, playerResources
  } = useGameState();
  const { user } = useAuth();
  const [selectedCard, setSelectedCard] = useState('');

  const username = user ? user.username : null;
  const currentPlayerCards = username && playerDevCards[username] ? playerDevCards[username] : [];

  const handleDraw = () => {
    if (!username) {
      alert('You must be logged in to draw dev cards!');
      return;
    }
    const myRes = playerResources[username] || 0;
    if (myRes < 1) {
      alert('Not enough resources to draw a dev card!');
      return;
    }
    drawDevCard(username);
  };

  const handlePlay = () => {
    if (!username || !selectedCard) return;
    playDevCard(username, selectedCard);
    setSelectedCard('');
  };

  return (
    <div className="dev-card-panel">
      <h3>Dev Cards</h3>
      <p>Deck Size: {devDeck.length}</p>
      <button onClick={handleDraw}>Draw a Card (-1 resource)</button>

      <div className="my-dev-cards">
        <p>Your Hand:</p>
        {currentPlayerCards.length === 0 && <p>No dev cards</p>}
        {currentPlayerCards.map((card, i) => (
          <label key={i} className="card-option">
            <input
              type="radio"
              name="selectedCard"
              value={card}
              onChange={() => setSelectedCard(card)}
              checked={selectedCard === card}
            />
            {card}
          </label>
        ))}
      </div>

      <button
        className="play-button"
        onClick={handlePlay}
        disabled={!selectedCard}
      >
        Play Selected Card
      </button>
    </div>
  );
}
