import React from 'react';
import { useGameState } from '../../hooks/use_game_state';
import { useAuth } from '../../hooks/use_auth';
import './build_menu.css';

export default function BuildMenu() {
  const {
    isBuildingRoad, setIsBuildingRoad,
    isBuildingSettlement, setIsBuildingSettlement
  } = useGameState();

  const { user } = useAuth();

  const toggleBuildRoad = () => {
    if (!user) {
      alert('You must be logged in to build roads!');
      return;
    }
    setIsBuildingSettlement(false); // turn off settlement mode if on
    setIsBuildingRoad(!isBuildingRoad);
  };

  const toggleBuildSettlement = () => {
    if (!user) {
      alert('You must be logged in to build settlements!');
      return;
    }
    setIsBuildingRoad(false); // turn off road mode if on
    setIsBuildingSettlement(!isBuildingSettlement);
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
      <button
        className={isBuildingSettlement ? 'active' : ''}
        onClick={toggleBuildSettlement}
        style={{ marginTop: '10px' }}
      >
        {isBuildingSettlement ? 'Cancel Settlement' : 'Build Settlement'}
      </button>
    </div>
  );
}
