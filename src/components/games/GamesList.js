import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useGame } from '../../contexts/GameContext';

const GamesContainer = styled.div`
  max-width: 1000px;
  margin: 20px auto;
  padding: 20px;
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    
    h1 {
      margin-bottom: 15px;
    }
  }
`;

const CreateButton = styled.button`
  background-color: #4a90e2;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  &:hover {
    background-color: #357abd;
  }
  
  svg {
    margin-right: 8px;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const GameGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const GameCard = styled.div`
  background-color: #1e1e1e;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const GameHeader = styled.div`
  padding: 15px;
  background-color: #2c2c2c;
  border-bottom: 1px solid #444;
`;

const GameTitle = styled.h3`
  margin: 0;
  color: #e0e0e0;
`;

const GameCreator = styled.div`
  margin-top: 5px;
  font-size: 0.9rem;
  color: #999;
`;

const GameContent = styled.div`
  padding: 15px;
`;

const GameInfo = styled.div`
  margin-bottom: 15px;
`;

const GameStatus = styled.div`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 0.8rem;
  margin-bottom: 10px;
  background-color: ${props => {
    switch (props.status) {
      case 'setup': return 'rgba(74, 144, 226, 0.2)';
      case 'active': return 'rgba(46, 204, 113, 0.2)';
      case 'completed': return 'rgba(231, 76, 60, 0.2)';
      default: return 'rgba(149, 165, 166, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'setup': return '#4a90e2';
      case 'active': return '#2ecc71';
      case 'completed': return '#e74c3c';
      default: return '#95a5a6';
    }
  }};
`;

const TeamList = styled.div`
  margin-bottom: 15px;
`;

const TeamItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 5px;
`;

const TeamColor = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.color || '#ccc'};
  margin-right: 8px;
`;

const TeamName = styled.span`
  font-size: 0.9rem;
  color: #e0e0e0;
`;

const GameActions = styled.div`
  padding-top: 10px;
  border-top: 1px solid #444;
`;

const JoinButton = styled.button`
  width: 100%;
  background-color: ${props => props.disabled ? '#444' : '#4a90e2'};
  color: white;
  border: none;
  padding: 8px 0;
  border-radius: 4px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  
  &:hover {
    background-color: ${props => props.disabled ? '#444' : '#357abd'};
  }
`;

const NoGames = styled.div`
  text-align: center;
  padding: 50px 0;
  color: #999;
  
  p {
    margin-bottom: 20px;
  }
`;

const CreateGameModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: #1e1e1e;
  border-radius: 10px;
  padding: 20px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h2 {
    margin: 0;
    color: #e0e0e0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #999;
  font-size: 1.5rem;
  cursor: pointer;
  
  &:hover {
    color: #e0e0e0;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  color: #e0e0e0;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  background-color: #333;
  color: #e0e0e0;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 16px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  
  button {
    margin-left: 10px;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(74, 144, 226, 0.3);
    border-radius: 50%;
    border-top-color: #4a90e2;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const RefreshButton = styled.button`
  background: none;
  border: none;
  color: #4a90e2;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  padding: 5px 10px;
  margin-left: auto;
  margin-bottom: 15px;
  
  svg {
    margin-right: 5px;
  }
  
  &:hover {
    text-decoration: underline;
  }
`;

const GamesList = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const { 
    availableGames, 
    gameLoading, 
    gameError, 
    loadAvailableGames, 
    createGame, 
    joinGame
  } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    loadAvailableGames();
  }, []);

  const handleCreateGame = async () => {
    if (!newGameName.trim()) return;
    
    const result = await createGame({ 
      name: newGameName,
      settings: {
        maxTeams: 4,
        maxPlayersPerTeam: 5
      }
    });
    
    if (result.success) {
      setCreateModalOpen(false);
      setNewGameName('');
      
      // Navigate to the game page
      await joinGame(result.game._id);
      navigate(`/games/${result.game._id}`);
    }
  };

  const handleJoinGame = async (gameId) => {
    const result = await joinGame(gameId);
    if (result.success) {
      navigate(`/games/${gameId}`);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'setup': return 'Setup';
      case 'active': return 'In Progress';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  return (
    <GamesContainer>
      <HeaderSection>
        <h1>Available Games</h1>
        <CreateButton onClick={() => setCreateModalOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
          Create New Game
        </CreateButton>
      </HeaderSection>
      
      {gameLoading ? (
        <LoadingSpinner>
          <div className="spinner"></div>
        </LoadingSpinner>
      ) : gameError ? (
        <div>Error: {gameError}</div>
      ) : (
        <>
          <RefreshButton onClick={loadAvailableGames}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
              <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
            </svg>
            Refresh
          </RefreshButton>
          
          {availableGames.length > 0 ? (
            <GameGrid>
              {availableGames.map(game => (
                <GameCard key={game._id}>
                  <GameHeader>
                    <GameTitle>{game.name}</GameTitle>
                    <GameCreator>Created by {game.admin?.username || 'Unknown'}</GameCreator>
                  </GameHeader>
                  
                  <GameContent>
                    <GameInfo>
                      <GameStatus status={game.status}>
                        {getStatusText(game.status)}
                      </GameStatus>
                      
                      <div>Teams: {game.teams?.length || 0} / {game.settings?.maxTeams || 4}</div>
                    </GameInfo>
                    
                    {game.teams && game.teams.length > 0 && (
                      <TeamList>
                        {game.teams.map(team => (
                          <TeamItem key={team._id || team.id}>
                            <TeamColor color={team.color} />
                            <TeamName>{team.name}</TeamName>
                          </TeamItem>
                        ))}
                      </TeamList>
                    )}
                    
                    <GameActions>
                      <JoinButton 
                        onClick={() => handleJoinGame(game._id)}
                        disabled={game.status === 'completed'}
                      >
                        {game.status === 'completed' ? 'Game Ended' : 'Join Game'}
                      </JoinButton>
                    </GameActions>
                  </GameContent>
                </GameCard>
              ))}
            </GameGrid>
          ) : (
            <NoGames>
              <p>No games available. Create a new game to get started!</p>
              <CreateButton onClick={() => setCreateModalOpen(true)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                </svg>
                Create New Game
              </CreateButton>
            </NoGames>
          )}
        </>
      )}
      
      {createModalOpen && (
        <CreateGameModal>
          <ModalContent>
            <ModalHeader>
              <h2>Create New Game</h2>
              <CloseButton onClick={() => setCreateModalOpen(false)}>&times;</CloseButton>
            </ModalHeader>
            
            <FormGroup>
              <Label htmlFor="gameName">Game Name</Label>
              <Input
                type="text"
                id="gameName"
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
                placeholder="Enter a name for your game"
              />
            </FormGroup>
            
            <ButtonGroup>
              <button onClick={() => setCreateModalOpen(false)}>Cancel</button>
              <button 
                onClick={handleCreateGame}
                disabled={!newGameName.trim()}
                style={{ backgroundColor: newGameName.trim() ? '#4a90e2' : '#444' }}
              >
                Create
              </button>
            </ButtonGroup>
          </ModalContent>
        </CreateGameModal>
      )}
    </GamesContainer>
  );
};

export default GamesList; 