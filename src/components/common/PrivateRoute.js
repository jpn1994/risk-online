import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styled from 'styled-components';

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
  color: #e0e0e0;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(74, 144, 226, 0.3);
  border-radius: 50%;
  border-top-color: #4a90e2;
  animation: spin 1s linear infinite;
  margin-right: 15px;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <LoadingContainer>
        <Spinner />
        <span>Loading...</span>
      </LoadingContainer>
    );
  }
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute; 