import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';

const NavbarContainer = styled.nav`
  background-color: #1a1a1a;
  color: #e0e0e0;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const NavbarContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  color: #e0e0e0;
  text-decoration: none;
  display: flex;
  align-items: center;
  
  span {
    color: #4a90e2;
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const NavLink = styled(Link)`
  color: #e0e0e0;
  text-decoration: none;
  margin-left: 20px;
  transition: color 0.2s;
  
  &:hover {
    color: #4a90e2;
  }
  
  @media (max-width: 768px) {
    margin-left: 15px;
  }
`;

const NavButton = styled.button`
  background: none;
  border: none;
  color: #e0e0e0;
  cursor: pointer;
  margin-left: 20px;
  font-size: 1rem;
  padding: 0;
  transition: color 0.2s;
  
  &:hover {
    color: #4a90e2;
  }
  
  @media (max-width: 768px) {
    margin-left: 15px;
    font-size: 0.9rem;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const UserName = styled.span`
  margin-right: 15px;
  color: #4a90e2;
  
  @media (max-width: 768px) {
    margin-right: 10px;
  }
`;

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <NavbarContainer>
      <NavbarContent>
        <Logo to="/">
          sub<span>Risk</span>
        </Logo>
        
        <NavLinks>
          {isAuthenticated ? (
            <>
              <NavLink to="/games">Games</NavLink>
              <UserInfo>
                <UserName>{user?.username}</UserName>
                <NavButton onClick={handleLogout}>Logout</NavButton>
              </UserInfo>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </NavLinks>
      </NavbarContent>
    </NavbarContainer>
  );
};

export default Navbar; 