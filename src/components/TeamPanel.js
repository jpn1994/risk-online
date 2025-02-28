import React from 'react';
import styled from 'styled-components';

const PanelContainer = styled.div`
  flex: 1;
  background-color: #1e1e1e;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  padding: 15px;
  display: flex;
  flex-direction: column;
  max-width: 300px;
  
  @media (max-width: 768px) {
    max-width: none;
    width: 100%;
    max-height: 250px;
  }
`;

const PanelHeader = styled.div`
  padding-bottom: 15px;
  border-bottom: 1px solid #444;
  margin-bottom: 15px;
  
  h2 {
    margin-top: 0;
    margin-bottom: 0;
  }
`;

const TeamList = styled.div`
  overflow-y: auto;
  flex: 1;
  
  @media (max-width: 768px) {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 10px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    
    &::-webkit-scrollbar {
      height: 6px;
    }
  }
`;

const TeamCard = styled.div`
  margin-bottom: 15px;
  padding: 12px;
  border-radius: 6px;
  border-left: 5px solid ${props => props.color || '#ccc'};
  background-color: ${props => props.active ? '#2c2c2c' : '#252525'};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;

  &:hover {
    transform: ${props => props.active ? 'translateX(5px)' : 'none'};
  }
  
  @media (max-width: 768px) {
    flex: 0 0 auto;
    width: 200px;
    margin-right: 10px;
    margin-bottom: 0;
    border-left: none;
    border-top: 5px solid ${props => props.color || '#ccc'};
    
    &:hover {
      transform: ${props => props.active ? 'translateY(-5px)' : 'none'};
    }
    
    &:last-child {
      margin-right: 0;
    }
  }
`;

const TeamHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const TeamColor = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${props => props.color || '#ccc'};
  margin-right: 10px;
`;

const TeamName = styled.div`
  font-weight: bold;
  font-size: 1.1rem;
  color: #e0e0e0;
`;

const PubCount = styled.div`
  margin-left: auto;
  background-color: ${props => props.color || '#ccc'};
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 0.8rem;
`;

const PubList = styled.div`
  font-size: 0.9rem;
  color: #bbb;
`;

function TeamPanel({ teams, currentTeam }) {
  // Sort teams by number of pubs (most to least)
  const sortedTeams = [...teams].sort((a, b) => b.pubs.length - a.pubs.length);
  
  return (
    <PanelContainer>
      <PanelHeader>
        <h2>Teams</h2>
      </PanelHeader>
      
      <TeamList>
        {sortedTeams.map(team => (
          <TeamCard 
            key={team.id} 
            color={team.color}
            active={currentTeam && team.id === currentTeam.id}
          >
            <TeamHeader>
              <TeamColor color={team.color} />
              <TeamName>{team.name}</TeamName>
              <PubCount color={team.color}>{team.pubs.length}</PubCount>
            </TeamHeader>
            
            <PubList>
              {team.pubs.length === 0 ? (
                <em>No pubs conquered yet</em>
              ) : (
                <div>Conquered {team.pubs.length} pub{team.pubs.length !== 1 ? 's' : ''}</div>
              )}
            </PubList>
          </TeamCard>
        ))}
      </TeamList>
    </PanelContainer>
  );
}

export default TeamPanel; 