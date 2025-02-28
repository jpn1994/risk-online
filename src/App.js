import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import GameBoard from './components/GameBoard';
import GameSetup from './components/GameSetup';
import TeamPanel from './components/TeamPanel';
import ChallengeModal from './components/ChallengeModal';
import './App.css';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 15px;
  overflow-x: hidden;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 20px;
`;

const GameContainer = styled.div`
  display: flex;
  flex: 1;
  gap: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [pubs, setPubs] = useState([]);
  const [teams, setTeams] = useState([]);
  const [currentTeam, setCurrentTeam] = useState(null);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [selectedPub, setSelectedPub] = useState(null);
  
  // Generate a list of random pub names
  const pubNames = [
    "The King's Arms", "The Queen's Head", "The Red Lion", "The Crown", 
    "The Royal Oak", "The White Horse", "The Black Bull", "The Rose & Crown",
    "The George", "The Swan", "The Bell", "The Plough", "The Ship", "The Fox",
    "The Anchor", "The Duke's Head", "The Railway", "The Stag", "The Bear",
    "The Star", "The Lion", "The Castle", "The Coach & Horses", "The Griffin"
  ];

  // Setup game with specified number of pubs and teams
  const setupGame = (numPubs, teamNames) => {
    // Create pubs
    const newPubs = Array.from({ length: numPubs }, (_, i) => ({
      id: uuidv4(),
      name: pubNames[i % pubNames.length],
      owner: null,
      neighbors: []
    }));
    
    // Assign neighbors to create a connected graph
    newPubs.forEach((pub, index) => {
      // Connect to at least 2-3 other pubs
      const numConnections = Math.floor(Math.random() * 2) + 2;
      const possibleNeighbors = [...newPubs];
      possibleNeighbors.splice(index, 1); // Remove self
      
      for (let i = 0; i < numConnections && possibleNeighbors.length > 0; i++) {
        const neighborIndex = Math.floor(Math.random() * possibleNeighbors.length);
        const neighbor = possibleNeighbors[neighborIndex];
        
        pub.neighbors.push(neighbor.id);
        // Make connection bidirectional
        const originalNeighbor = newPubs.find(p => p.id === neighbor.id);
        if (!originalNeighbor.neighbors.includes(pub.id)) {
          originalNeighbor.neighbors.push(pub.id);
        }
        
        possibleNeighbors.splice(neighborIndex, 1);
      }
    });
    
    // Create teams
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3', '#33FFF3'];
    const newTeams = teamNames.map((name, index) => ({
      id: uuidv4(),
      name,
      color: colors[index % colors.length],
      pubs: []
    }));
    
    // Distribute 1 initial pub per team
    const initialPubs = [...newPubs].slice(0, newTeams.length);
    initialPubs.forEach((pub, index) => {
      pub.owner = newTeams[index].id;
      newTeams[index].pubs.push(pub.id);
    });
    
    setPubs(newPubs);
    setTeams(newTeams);
    setCurrentTeam(newTeams[0]);
    setGameStarted(true);
  };
  
  // Handle pub selection for conquest
  const handlePubSelection = (pub) => {
    // Check if pub is conquerable (unowned or owned by another team and adjacent to current team's pub)
    const isOwnedByCurrentTeam = pub.owner === currentTeam.id;
    
    if (isOwnedByCurrentTeam) {
      return; // Cannot attack own pub
    }
    
    const canAttack = currentTeam.pubs.some(ownedPubId => {
      const ownedPub = pubs.find(p => p.id === ownedPubId);
      return ownedPub.neighbors.includes(pub.id);
    });
    
    if (canAttack) {
      setSelectedPub(pub);
      setChallengeOpen(true);
    }
  };
  
  // Handle challenge completion
  const handleChallengeComplete = (success) => {
    if (success && selectedPub) {
      // Transfer ownership of pub
      const updatedPubs = pubs.map(pub => {
        if (pub.id === selectedPub.id) {
          // If pub was owned by another team, remove from their list
          if (pub.owner) {
            const previousOwner = teams.find(team => team.id === pub.owner);
            if (previousOwner) {
              const updatedTeams = teams.map(team => {
                if (team.id === previousOwner.id) {
                  return {
                    ...team,
                    pubs: team.pubs.filter(p => p !== pub.id)
                  };
                }
                return team;
              });
              setTeams(updatedTeams);
            }
          }
          
          return { ...pub, owner: currentTeam.id };
        }
        return pub;
      });
      
      // Add pub to current team's list
      const updatedTeams = teams.map(team => {
        if (team.id === currentTeam.id) {
          return {
            ...team,
            pubs: [...team.pubs, selectedPub.id]
          };
        }
        return team;
      });
      
      setPubs(updatedPubs);
      setTeams(updatedTeams);
    }
    
    // Move to next team's turn
    const currentIndex = teams.findIndex(team => team.id === currentTeam.id);
    const nextIndex = (currentIndex + 1) % teams.length;
    setCurrentTeam(teams[nextIndex]);
    
    setChallengeOpen(false);
    setSelectedPub(null);
  };
  
  // Check for game over condition
  useEffect(() => {
    if (gameStarted && teams.length > 0) {
      const winner = teams.find(team => team.pubs.length === pubs.length);
      if (winner) {
        alert(`${winner.name} has conquered all pubs and won the game!`);
        setGameStarted(false);
      }
    }
  }, [teams, pubs, gameStarted]);
  
  return (
    <AppContainer>
      <Header>
        <h1>subRisk: Pub Conquest</h1>
      </Header>
      
      {!gameStarted ? (
        <GameSetup onStartGame={setupGame} />
      ) : (
        <GameContainer>
          <GameBoard 
            pubs={pubs} 
            teams={teams} 
            currentTeam={currentTeam}
            onPubSelect={handlePubSelection}
          />
          <TeamPanel 
            teams={teams} 
            currentTeam={currentTeam} 
          />
          {challengeOpen && selectedPub && (
            <ChallengeModal 
              pub={selectedPub}
              team={currentTeam}
              onComplete={handleChallengeComplete}
            />
          )}
        </GameContainer>
      )}
      
      <footer>
        <p>© 2023 subRisk - The game of pub conquest</p>
      </footer>
    </AppContainer>
  );
}

export default App; 