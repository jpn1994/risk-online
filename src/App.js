import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import GamesList from './components/games/GamesList';
import GameDetail from './components/games/GameDetail';
import PrivateRoute from './components/common/PrivateRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <GameProvider>
          <div className="App">
            <Navbar />
            <div className="container">
              <Routes>
                <Route path="/" element={<Navigate to="/games" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                <Route element={<PrivateRoute />}>
                  <Route path="/games" element={<GamesList />} />
                  <Route path="/games/:gameId" element={<GameDetail />} />
                </Route>
              </Routes>
            </div>
          </div>
        </GameProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 