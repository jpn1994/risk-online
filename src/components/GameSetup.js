import React, { useState } from 'react';
import styled from 'styled-components';

const SetupContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #1e1e1e;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    padding: 15px;
    width: 95%;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const TeamList = styled.div`
  margin-top: 20px;
`;

const TeamItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  background-color: #2c2c2c;
  border-radius: 5px;
`;

const TeamName = styled.span`
  flex: 1;
  color: #e0e0e0;
`;

const RemoveButton = styled.button`
  background-color: #e74c3c;
  margin-left: 10px;
  padding: 5px 10px;
  
  &:hover {
    background-color: #c0392b;
  }
  
  @media (max-width: 768px) {
    padding: 8px 12px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
`;

const StartButton = styled.button`
  background-color: #2ecc71;
  
  &:hover {
    background-color: #27ae60;
  }
  
  &:disabled {
    background-color: #444444;
    color: #777777;
  }
`;

const InputGroup = styled.div`
  display: flex;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const AddButton = styled.button`
  margin-left: 10px;
  width: auto;
  
  @media (max-width: 768px) {
    margin-left: 0;
    margin-top: 10px;
  }
`;

function GameSetup({ onStartGame }) {
  const [numPubs, setNumPubs] = useState(15);
  const [teamName, setTeamName] = useState('');
  const [teams, setTeams] = useState([]);
  
  const handleAddTeam = () => {
    if (teamName.trim() !== '') {
      setTeams([...teams, teamName.trim()]);
      setTeamName('');
    }
  };
  
  const handleRemoveTeam = (index) => {
    const updatedTeams = [...teams];
    updatedTeams.splice(index, 1);
    setTeams(updatedTeams);
  };
  
  const handleStartGame = () => {
    if (teams.length >= 2 && numPubs >= teams.length) {
      onStartGame(numPubs, teams);
    }
  };
  
  // Allow adding team with Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && teamName.trim() !== '') {
      handleAddTeam();
    }
  };
  
  return (
    <SetupContainer>
      <h2>Game Setup</h2>
      <p>Configure your subRisk game by setting the number of pubs and adding teams.</p>
      
      <FormGroup>
        <label htmlFor="numPubs">Number of Pubs</label>
        <input
          type="number"
          id="numPubs"
          value={numPubs}
          onChange={(e) => setNumPubs(Math.max(2, parseInt(e.target.value) || 0))}
          min="2"
        />
        <small style={{ color: '#999' }}>Minimum: {Math.max(2, teams.length)} pubs needed</small>
      </FormGroup>
      
      <FormGroup>
        <label htmlFor="teamName">Team Name</label>
        <InputGroup>
          <input
            type="text"
            id="teamName"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter team name"
          />
          <AddButton 
            onClick={handleAddTeam}
            disabled={teamName.trim() === ''}
          >
            Add Team
          </AddButton>
        </InputGroup>
      </FormGroup>
      
      <TeamList>
        <h3>Teams ({teams.length})</h3>
        {teams.length === 0 && <p style={{ color: '#999' }}>No teams added yet. Add at least 2 teams to start the game.</p>}
        
        {teams.map((team, index) => (
          <TeamItem key={index}>
            <TeamName>{team}</TeamName>
            <RemoveButton onClick={() => handleRemoveTeam(index)}>Remove</RemoveButton>
          </TeamItem>
        ))}
      </TeamList>
      
      <ButtonGroup>
        <StartButton
          onClick={handleStartGame}
          disabled={teams.length < 2 || numPubs < teams.length}
        >
          Start Game
        </StartButton>
      </ButtonGroup>
    </SetupContainer>
  );
}

export default GameSetup; 