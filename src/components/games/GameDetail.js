import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useGame } from '../../contexts/GameContext';
import { useAuth } from '../../contexts/AuthContext';

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  
  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const GameHeader = styled.div`
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

const GameStatus = styled.div`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 0.8rem;
  margin-left: 10px;
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  
  @media (max-width: 768px) {
    width: 100%;
    flex-wrap: wrap;
    
    button {
      flex: 1;
      min-width: 120px;
    }
  }
`;

const ActionButton = styled.button`
  background-color: ${props => props.primary ? '#4a90e2' : '#2c2c2c'};
  color: ${props => props.primary ? 'white' : '#e0e0e0'};
  border: 1px solid ${props => props.primary ? '#4a90e2' : '#444'};
  padding: 8px 15px;
  border-radius: 4px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.6 : 1};
  
  &:hover {
    background-color: ${props => props.primary ? '#357abd' : '#3c3c3c'};
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #4a90e2;
  display: flex;
  align-items: center;
  padding: 0;
  margin-bottom: 15px;
  cursor: pointer;
  
  svg {
    margin-right: 5px;
  }
  
  &:hover {
    text-decoration: underline;
  }
`;

const GameContent = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 250px 1fr;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.div`
  background-color: #1e1e1e;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const GameBoard = styled.div`
  background-color: #1e1e1e;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  min-height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
`;

const SectionTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #444;
`;

const TeamsSection = styled.div`
  margin-bottom: 20px;
`;

const TeamList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Team = styled.div`
  background-color: #2c2c2c;
  border-radius: 5px;
  padding: 10px;
  border-left: 4px solid ${props => props.color || '#ccc'};
`;

const TeamHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
`;

const TeamName = styled.span`
  font-weight: bold;
`;

const TeamMembers = styled.div`
  font-size: 0.9rem;
  color: #aaa;
`;

const CreateTeamForm = styled.div`
  margin-top: 15px;
`;

const FormGroup = styled.div`
  margin-bottom: 10px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  background-color: #333;
  color: #e0e0e0;
  border: 1px solid #555;
  border-radius: 4px;
`;

const ColorPicker = styled.div`
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 5px;
`;

const ColorOption = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${props => props.color};
  cursor: pointer;
  border: 2px solid ${props => props.selected ? 'white' : 'transparent'};
  
  &:hover {
    transform: scale(1.1);
  }
`;

const JoinTeamButton = styled.button`
  background-color: transparent;
  border: 1px dashed #555;
  color: #aaa;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  text-align: center;
  margin-top: 10px;
  
  &:hover {
    background-color: #2c2c2c;
    color: #e0e0e0;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  
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

// Mock data for UI demonstration - this would come from the context
const DEFAULT_COLORS = [
  '#FF5733', '#33FF57', '#3357FF', '#F033FF', 
  '#FF33F0', '#33FFF0', '#F0FF33', '#FF8C33'
];

const GameDetail = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    currentGame,
    gameLoading,
    gameError,
    teams,
    joinGame,
    leaveGame,
    createTeam,
    joinTeam,
    startGame,
    conquerPub
  } = useGame();
  
  const [newTeam, setNewTeam] = useState({ name: '', color: DEFAULT_COLORS[0] });
  const [createTeamMode, setCreateTeamMode] = useState(false);
  
  // Only fetch game data when component mounts or gameId changes
  useEffect(() => {
    let isMounted = true;
    
    if (gameId) {
      // Wrap in async function to handle the promise
      const fetchGame = async () => {
        try {
          if (isMounted) {
            await joinGame(gameId);
          }
        } catch (error) {
          console.error('Error joining game:', error);
        }
      };
      
      fetchGame();
    }
    
    // Cleanup function to handle component unmount
    return () => {
      isMounted = false;
      leaveGame();
    };
  }, [gameId]); // Only depend on gameId

  const handleCreateTeam = () => {
    if (!newTeam.name.trim()) return;
    
    createTeam({
      name: newTeam.name,
      color: newTeam.color,
      gameId
    });
    
    setNewTeam({ name: '', color: DEFAULT_COLORS[0] });
    setCreateTeamMode(false);
  };
  
  const handleJoinTeam = (teamId) => {
    joinTeam(teamId);
  };
  
  const handleStartGame = () => {
    startGame(gameId);
  };
  
  const handleBack = () => {
    navigate('/games');
  };
  
  // Find current user's team
  const userTeam = teams?.find(team => 
    team.members?.some(member => member._id === user?._id)
  );
  
  const getStatusText = (status) => {
    switch (status) {
      case 'setup': return 'Setup';
      case 'active': return 'In Progress';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };
  
  const isAdmin = currentGame?.admin === user?._id;
  const canStartGame = isAdmin && teams?.length >= 2 && currentGame?.status === 'setup';
  
  return (
    <GameContainer>
      <BackButton onClick={handleBack}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
        </svg>
        Back to Games
      </BackButton>
      
      {gameLoading ? (
        <LoadingSpinner>
          <div className="spinner"></div>
        </LoadingSpinner>
      ) : gameError ? (
        <div>Error: {gameError}</div>
      ) : currentGame ? (
        <>
          <GameHeader>
            <div>
              <h1>
                {currentGame.name}
                <GameStatus status={currentGame.status}>
                  {getStatusText(currentGame.status)}
                </GameStatus>
              </h1>
              <div>Created by {currentGame.admin?.username || 'Unknown'}</div>
            </div>
            
            <ButtonGroup>
              {currentGame.status === 'setup' && !userTeam && !createTeamMode && (
                <ActionButton 
                  onClick={() => setCreateTeamMode(true)} 
                  primary
                >
                  Create Team
                </ActionButton>
              )}
              
              {canStartGame && (
                <ActionButton 
                  onClick={handleStartGame} 
                  primary
                >
                  Start Game
                </ActionButton>
              )}
              
              <ActionButton onClick={handleBack}>
                Leave Game
              </ActionButton>
            </ButtonGroup>
          </GameHeader>
          
          <GameContent>
            <Sidebar>
              <TeamsSection>
                <SectionTitle>Teams</SectionTitle>
                
                {createTeamMode ? (
                  <CreateTeamForm>
                    <FormGroup>
                      <Label>Team Name</Label>
                      <Input 
                        type="text"
                        value={newTeam.name}
                        onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                        placeholder="Enter team name"
                      />
                    </FormGroup>
                    
                    <FormGroup>
                      <Label>Team Color</Label>
                      <ColorPicker>
                        {DEFAULT_COLORS.map(color => (
                          <ColorOption
                            key={color}
                            color={color}
                            selected={newTeam.color === color}
                            onClick={() => setNewTeam({...newTeam, color})}
                          />
                        ))}
                      </ColorPicker>
                    </FormGroup>
                    
                    <ButtonGroup>
                      <ActionButton 
                        onClick={() => setCreateTeamMode(false)}
                      >
                        Cancel
                      </ActionButton>
                      <ActionButton 
                        onClick={handleCreateTeam} 
                        primary
                        disabled={!newTeam.name.trim()}
                      >
                        Create
                      </ActionButton>
                    </ButtonGroup>
                  </CreateTeamForm>
                ) : (
                  <TeamList>
                    {teams?.length > 0 ? (
                      teams.map(team => (
                        <Team key={team._id} color={team.color}>
                          <TeamHeader>
                            <TeamName>{team.name}</TeamName>
                            {currentGame.status === 'setup' && !userTeam && (
                              <ActionButton 
                                onClick={() => handleJoinTeam(team._id)}
                                primary
                              >
                                Join
                              </ActionButton>
                            )}
                          </TeamHeader>
                          <TeamMembers>
                            {team.members?.length 
                              ? `${team.members.length} ${team.members.length === 1 ? 'member' : 'members'}`
                              : 'No members'
                            }
                          </TeamMembers>
                        </Team>
                      ))
                    ) : (
                      <div>No teams created yet.</div>
                    )}
                    
                    {currentGame.status === 'setup' && !userTeam && !createTeamMode && (
                      <JoinTeamButton onClick={() => setCreateTeamMode(true)}>
                        + Create a new team
                      </JoinTeamButton>
                    )}
                  </TeamList>
                )}
              </TeamsSection>
              
              {currentGame.status === 'active' && (
                <div>
                  <SectionTitle>Game Stats</SectionTitle>
                  {/* Game stats would go here */}
                </div>
              )}
            </Sidebar>
            
            <MainContent>
              <GameBoard>
                {currentGame.status === 'setup' ? (
                  <div>Waiting for the game to start...</div>
                ) : (
                  <div>Game board visualization would go here</div>
                )}
              </GameBoard>
            </MainContent>
          </GameContent>
        </>
      ) : (
        <div>Game not found</div>
      )}
    </GameContainer>
  );
};

export default GameDetail; 