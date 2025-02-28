import React, { useState } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
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
  backdrop-filter: blur(3px);
`;

const ModalContainer = styled.div`
  background-color: #1e1e1e;
  border-radius: 10px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
  padding: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  color: #e0e0e0;
  
  @media (max-width: 768px) {
    width: 95%;
    max-height: 80vh;
    padding: 15px;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #444;
  
  h2 {
    margin: 0;
    color: #e0e0e0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  
  &:hover {
    color: #e0e0e0;
  }
`;

const ChallengeInfo = styled.div`
  margin-bottom: 20px;
`;

const TeamInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  color: #e0e0e0;
`;

const TeamColor = styled.div`
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background-color: ${props => props.color || '#ccc'};
  margin-right: 10px;
`;

const PubName = styled.span`
  font-weight: bold;
  color: #fff;
`;

const ChallengeOptions = styled.div`
  margin-bottom: 20px;
`;

const Option = styled.div`
  margin-bottom: 15px;
  padding: 15px;
  border: 1px solid #444;
  border-radius: 5px;
  cursor: pointer;
  background-color: #252525;
  transition: all 0.2s ease;
  
  h4 {
    margin-top: 0;
    margin-bottom: 8px;
    color: #e0e0e0;
  }
  
  p {
    margin-bottom: 0;
    color: #bbb;
  }
  
  &:hover {
    background-color: #2c2c2c;
    transform: translateY(-2px);
  }
  
  &.selected {
    border-color: ${props => props.teamColor || '#4a90e2'};
    background-color: rgba(74, 144, 226, 0.1);
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
    
    button {
      width: 100%;
    }
  }
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid ${props => props.color || '#4a90e2'};
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
  margin: 0 auto;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ResultContainer = styled.div`
  text-align: center;
  padding: 20px 0;
  
  h3 {
    color: ${props => props.success ? '#2ecc71' : '#e74c3c'};
    margin-bottom: 15px;
  }
  
  p {
    margin-bottom: 25px;
    color: #e0e0e0;
  }
`;

// List of possible challenges
const challenges = [
  {
    id: 'trivia',
    name: 'Pub Trivia Challenge',
    description: 'Answer a trivia question correctly to conquer this pub!'
  },
  {
    id: 'darts',
    name: 'Darts Challenge',
    description: 'Test your aim in a virtual darts game to conquer this pub!'
  },
  {
    id: 'drink',
    name: 'Drink Challenge',
    description: 'Finish your drink faster than the opposing team to conquer this pub!'
  },
  {
    id: 'karaoke',
    name: 'Karaoke Challenge',
    description: 'Sing a song to win over the crowd and conquer this pub!'
  }
];

function ChallengeModal({ pub, team, onComplete }) {
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [challengeInProgress, setChallengeInProgress] = useState(false);
  const [challengeResult, setChallengeResult] = useState(null);
  
  // Handle starting the challenge
  const handleStartChallenge = () => {
    if (!selectedChallenge) return;
    
    setChallengeInProgress(true);
    
    // Simulate challenge completion (random success/failure)
    setTimeout(() => {
      // 65% chance of success
      const success = Math.random() < 0.65;
      setChallengeResult(success);
      setChallengeInProgress(false);
    }, 2000);
  };
  
  // Handle closing the modal and completing the challenge
  const handleComplete = () => {
    onComplete(challengeResult);
  };
  
  // Handle user cancellation
  const handleCancel = () => {
    if (challengeInProgress) return; // Don't allow cancellation during challenge
    onComplete(false);
  };
  
  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalHeader>
          <h2>{challengeResult === null ? 'Pub Challenge' : (challengeResult ? 'Victory!' : 'Defeat!')}</h2>
          <CloseButton onClick={handleCancel}>&times;</CloseButton>
        </ModalHeader>
        
        <ChallengeInfo>
          <TeamInfo>
            <TeamColor color={team.color} />
            <span>{team.name} is attempting to conquer <PubName>{pub.name}</PubName></span>
          </TeamInfo>
          
          {pub.owner && (
            <p>This pub is currently owned by another team!</p>
          )}
        </ChallengeInfo>
        
        {challengeResult === null ? (
          <>
            {!challengeInProgress ? (
              <>
                <h3>Select a Challenge:</h3>
                <ChallengeOptions>
                  {challenges.map(challenge => (
                    <Option
                      key={challenge.id}
                      className={selectedChallenge === challenge.id ? 'selected' : ''}
                      teamColor={team.color}
                      onClick={() => setSelectedChallenge(challenge.id)}
                    >
                      <h4>{challenge.name}</h4>
                      <p>{challenge.description}</p>
                    </Option>
                  ))}
                </ChallengeOptions>
                
                <ButtonGroup>
                  <button onClick={handleCancel}>Cancel</button>
                  <button 
                    onClick={handleStartChallenge}
                    disabled={!selectedChallenge}
                    style={{ backgroundColor: selectedChallenge ? team.color : undefined }}
                  >
                    Start Challenge
                  </button>
                </ButtonGroup>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <h3>Challenge in Progress...</h3>
                <p>Your team is attempting the challenge!</p>
                <div style={{ margin: '20px 0' }}>
                  <LoadingSpinner color={team.color} />
                </div>
              </div>
            )}
          </>
        ) : (
          <ResultContainer success={challengeResult}>
            <h3>{challengeResult ? 'Challenge Completed!' : 'Challenge Failed!'}</h3>
            <p>
              {challengeResult 
                ? `Congratulations! Your team has successfully conquered ${pub.name}!`
                : `Unfortunately, your team failed to conquer ${pub.name}. Better luck next time!`}
            </p>
            
            <button 
              onClick={handleComplete}
              style={{ backgroundColor: team.color, margin: '20px 0' }}
            >
              Continue
            </button>
          </ResultContainer>
        )}
      </ModalContainer>
    </ModalOverlay>
  );
}

export default ChallengeModal; 