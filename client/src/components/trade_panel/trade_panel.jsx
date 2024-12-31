import React, { useState, useEffect } from 'react';
import { useGameState } from '../../hooks/use_game_state';
import { useAuth } from '../../hooks/use_auth';
import './trade_panel.css';

/**
 * TradePanel:
 * - Player can propose a trade to another player: "I'll give you X, you give me Y"
 * - The other player sees the proposal & can accept or reject
 * - If accepted, we swap resources
 */
export default function TradePanel() {
  const {
    players,
    playerResources,
    pendingTrade,
    proposeTrade,
    acceptTrade,
    rejectTrade,
    currentUserName
  } = useGameState();
  const { user } = useAuth();

  const [offer, setOffer] = useState(0);
  const [request, setRequest] = useState(0);
  const [targetPlayer, setTargetPlayer] = useState('');

  // If the current user is the recipient of a trade, show the "Accept/Reject" UI
  const isTradeRecipient = pendingTrade && pendingTrade.to === currentUserName && pendingTrade.status === 'pending';

  // If the current user is the proposer, show "Waiting for acceptance" or final status
  const isTradeProposer = pendingTrade && pendingTrade.from === currentUserName && pendingTrade.status === 'pending';

  // Offer a trade
  const handleProposeTrade = () => {
    if (!user) {
      alert('You must be logged in to propose trades!');
      return;
    }
    const userRes = playerResources[currentUserName] || 0;
    if (userRes < offer) {
      alert('You cannot offer more resources than you have!');
      return;
    }
    if (!targetPlayer || targetPlayer === currentUserName) {
      alert('Invalid target player!');
      return;
    }
    proposeTrade(currentUserName, targetPlayer, parseInt(offer, 10), parseInt(request, 10));
    setOffer(0);
    setRequest(0);
  };

  const handleAccept = () => {
    acceptTrade();
  };

  const handleReject = () => {
    rejectTrade();
  };

  return (
    <div className="trade-panel">
      <h3>Trade</h3>

      {/* Propose a new trade if no pending trade by this user */}
      {(!pendingTrade || pendingTrade.status !== 'pending') && (
        <div className="propose-trade">
          <p>Propose a Trade:</p>
          <label>
            To Player:
            <select
              value={targetPlayer}
              onChange={(e) => setTargetPlayer(e.target.value)}
            >
              <option value="">--choose--</option>
              {players.map((p) => (
                p !== currentUserName && <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            I give:
            <input
              type="number"
              min="0"
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
            />
          </label>
          <label>
            I want:
            <input
              type="number"
              min="0"
              value={request}
              onChange={(e) => setRequest(e.target.value)}
            />
          </label>
          <button onClick={handleProposeTrade}>Propose</button>
        </div>
      )}

      {/* If there's a pending trade, show the status */}
      {pendingTrade && pendingTrade.status === 'pending' && (
        <div className="pending-trade">
          <p><strong>Trade Proposed:</strong></p>
          <p>
            {pendingTrade.from} -> {pendingTrade.to}: 
            {` Offer ${pendingTrade.offer}, Request ${pendingTrade.request}`}
          </p>
          {isTradeRecipient && (
            <div>
              <button onClick={handleAccept}>Accept</button>
              <button onClick={handleReject}>Reject</button>
            </div>
          )}
          {isTradeProposer && (
            <div>
              <p>Waiting for {pendingTrade.to} to respond...</p>
            </div>
          )}
        </div>
      )}

      {pendingTrade && pendingTrade.status === 'accepted' && (
        <div className="completed-trade">
          <p>Trade accepted!</p>
          <p>
            {pendingTrade.from} gave {pendingTrade.offer} resources to {pendingTrade.to}, 
            and received {pendingTrade.request} in return.
          </p>
        </div>
      )}

      {pendingTrade && pendingTrade.status === 'rejected' && (
        <div className="completed-trade">
          <p>Trade rejected by {pendingTrade.to}.</p>
        </div>
      )}
    </div>
  );
}
