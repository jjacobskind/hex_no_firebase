import React from 'react';
import { useGameState } from '../../hooks/use_game_state';
import { useAuth } from '../../hooks/use_auth';
import './build_menu.css';

/**
 * BuildMenu:
 * - A simple UI with a button to toggle "Build Road" mode.
 * - Future expansions: Build Settlement, Build City, etc.
 */
export default function BuildMenu() {
  const { isBuildingRoad, setIsBuildingRoad } = useGameState();
  const { user } = useAuth();

  const toggleBuildRoad = () => {
    // Must be logged in to build
    if (!user) {
      alert('You must be logged in to build roads!');
      return;
    }
    setIsBuildingRoad(!isBuildingRoad);
  };

  return (
    <div className="build-menu">
      <h3>Build Menu</h3>
      <button
        className={isBuildingRoad ? 'active' : ''}
        onClick={toggleBuildRoad}
      >
        {isBuildingRoad ? 'Cancel Road' : 'Build Road'}
      </button>
    </div>
  );
}
