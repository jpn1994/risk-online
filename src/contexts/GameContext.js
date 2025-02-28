import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { gameService } from '../services/api';
import socketService from '../services/socket';

// Initial state
const initialState = {
  availableGames: [],
  currentGame: null,
  teams: [],
  pubs: [],
  gameLoading: false,
  gameError: null,
  gameEvents: []
};

// Action types
const actions = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_AVAILABLE_GAMES: 'SET_AVAILABLE_GAMES',
  SET_CURRENT_GAME: 'SET_CURRENT_GAME',
  UPDATE_GAME_STATE: 'UPDATE_GAME_STATE',
  ADD_GAME_EVENT: 'ADD_GAME_EVENT',
  PUB_CONQUERED: 'PUB_CONQUERED',
  RESET_GAME: 'RESET_GAME'
};

// Reducer function
const gameReducer = (state, action) => {
  switch (action.type) {
    case actions.SET_LOADING:
      return {
        ...state,
        gameLoading: action.payload
      };
    case actions.SET_ERROR:
      return {
        ...state,
        gameError: action.payload,
        gameLoading: false
      };
    case actions.SET_AVAILABLE_GAMES:
      return {
        ...state,
        availableGames: action.payload,
        gameLoading: false
      };
    case actions.SET_CURRENT_GAME:
      return {
        ...state,
        currentGame: action.payload,
        gameLoading: false
      };
    case actions.UPDATE_GAME_STATE:
      return {
        ...state,
        teams: action.payload.teams || state.teams,
        pubs: action.payload.pubs || state.pubs,
        gameLoading: false
      };
    case actions.ADD_GAME_EVENT:
      return {
        ...state,
        gameEvents: [...state.gameEvents, action.payload]
      };
    case actions.PUB_CONQUERED:
      return {
        ...state,
        pubs: state.pubs.map(pub => 
          pub.id === action.payload.pubId 
            ? { ...pub, owner: action.payload.teamId } 
            : pub
        ),
        teams: state.teams.map(team => {
          if (team.id === action.payload.teamId) {
            return {
              ...team,
              pubs: [...team.pubs, action.payload.pubId]
            };
          } else if (team.pubs.includes(action.payload.pubId)) {
            return {
              ...team,
              pubs: team.pubs.filter(id => id !== action.payload.pubId)
            };
          }
          return team;
        })
      };
    case actions.RESET_GAME:
      return {
        ...initialState,
        availableGames: state.availableGames
      };
    default:
      return state;
  }
};

// Create context
const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { isAuthenticated, user } = useAuth();

  // Setup socket listeners when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Setup socket listeners for real-time updates
      const setupSocketListeners = () => {
        if (!socketService.isConnected()) {
          console.warn('Socket not connected when setting up listeners. Will retry in 2 seconds...');
          
          // Try to reconnect if the socket is not connected
          const token = localStorage.getItem('token');
          if (token) {
            socketService.connect(token);
          }
          
          // Retry after a delay
          const retryTimeout = setTimeout(() => {
            setupSocketListeners();
          }, 2000);
          
          return () => clearTimeout(retryTimeout);
        }
        
        console.log('Setting up socket event listeners for game updates');
        
        // Game state update
        socketService.on('game-state', (data) => {
          dispatch({ type: actions.UPDATE_GAME_STATE, payload: data });
        });

        // User joined
        socketService.on('user-joined', (data) => {
          dispatch({
            type: actions.ADD_GAME_EVENT,
            payload: {
              type: 'user-joined',
              data,
              timestamp: Date.now()
            }
          });
        });

        // User left
        socketService.on('user-left', (data) => {
          dispatch({
            type: actions.ADD_GAME_EVENT,
            payload: {
              type: 'user-left',
              data,
              timestamp: Date.now()
            }
          });
        });

        // Pub conquered
        socketService.on('pub-conquered', (data) => {
          dispatch({ type: actions.PUB_CONQUERED, payload: data });
          dispatch({
            type: actions.ADD_GAME_EVENT,
            payload: {
              type: 'pub-conquered',
              data,
              timestamp: Date.now()
            }
          });
        });

        // Game over
        socketService.on('game-over', (data) => {
          dispatch({
            type: actions.ADD_GAME_EVENT,
            payload: {
              type: 'game-over',
              data,
              timestamp: Date.now()
            }
          });
          
          // Update current game
          if (state.currentGame && state.currentGame._id === data.gameId) {
            const updatedGame = {
              ...state.currentGame,
              status: 'completed',
              winner: data.winner.teamId
            };
            dispatch({ type: actions.SET_CURRENT_GAME, payload: updatedGame });
          }
        });

        // Error handling
        socketService.on('error', (error) => {
          dispatch({ type: actions.SET_ERROR, payload: error.message });
        });
      };

      setupSocketListeners();

      // Cleanup listeners on unmount
      return () => {
        socketService.removeAllListeners();
      };
    }
  }, [isAuthenticated]);

  // Load available games
  const loadAvailableGames = useCallback(async () => {
    if (!isAuthenticated) return;
    
    dispatch({ type: actions.SET_LOADING, payload: true });
    try {
      const response = await gameService.getAllGames();
      dispatch({ type: actions.SET_AVAILABLE_GAMES, payload: response.data });
    } catch (error) {
      dispatch({ 
        type: actions.SET_ERROR, 
        payload: error.response?.data?.message || 'Failed to load games' 
      });
    }
  }, [isAuthenticated]);

  // Create a new game
  const createGame = useCallback(async (gameData) => {
    if (!isAuthenticated) return { success: false, error: 'Not authenticated' };
    
    dispatch({ type: actions.SET_LOADING, payload: true });
    try {
      const response = await gameService.createGame(gameData);
      await loadAvailableGames();
      return { success: true, game: response.data };
    } catch (error) {
      dispatch({ 
        type: actions.SET_ERROR, 
        payload: error.response?.data?.message || 'Failed to create game' 
      });
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to create game' 
      };
    }
  }, [isAuthenticated, loadAvailableGames]);

  // Join an existing game
  const joinGame = useCallback(async (gameId) => {
    if (!isAuthenticated) return { success: false, error: 'Not authenticated' };
    
    dispatch({ type: actions.SET_LOADING, payload: true });
    try {
      // First check if socket is connected
      if (!socketService.isConnected()) {
        console.log('Socket not connected. Attempting to reconnect...');
        const token = localStorage.getItem('token');
        if (token) {
          socketService.connect(token);
        } else {
          throw new Error('No authentication token found');
        }
      }
      
      const response = await gameService.getGameById(gameId);
      dispatch({ type: actions.SET_CURRENT_GAME, payload: response.data });
      
      // Join the game room via socket
      const joinSuccess = socketService.joinGame(gameId);
      if (!joinSuccess) {
        console.warn('Failed to join game socket room. Will retry when socket connects.');
      }
      
      return { success: true, game: response.data };
    } catch (error) {
      dispatch({ 
        type: actions.SET_ERROR, 
        payload: error.response?.data?.message || error.message || 'Failed to join game' 
      });
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to join game' 
      };
    }
  }, [isAuthenticated]);

  // Leave the current game
  const leaveGame = useCallback(() => {
    if (state.currentGame) {
      socketService.leaveGame(state.currentGame._id);
      dispatch({ type: actions.RESET_GAME });
    }
  }, [state.currentGame]);

  // Create a new team in the current game
  const createTeam = useCallback(async (teamData) => {
    if (!isAuthenticated || !state.currentGame) {
      return { success: false, error: 'Not in a game' };
    }
    
    dispatch({ type: actions.SET_LOADING, payload: true });
    try {
      const response = await gameService.createTeam(state.currentGame._id, teamData);
      
      // Get updated game data without calling joinGame to avoid infinite loop
      const gameResponse = await gameService.getGameById(state.currentGame._id);
      dispatch({ type: actions.SET_CURRENT_GAME, payload: gameResponse.data });
      
      return { success: true, team: response.data };
    } catch (error) {
      dispatch({ 
        type: actions.SET_ERROR, 
        payload: error.response?.data?.message || 'Failed to create team' 
      });
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to create team' 
      };
    }
  }, [isAuthenticated, state.currentGame]);

  // Join an existing team
  const joinTeam = useCallback(async (teamId) => {
    if (!isAuthenticated || !state.currentGame) {
      return { success: false, error: 'Not in a game' };
    }
    
    dispatch({ type: actions.SET_LOADING, payload: true });
    try {
      const response = await gameService.joinTeam(state.currentGame._id, teamId);
      
      // Get updated game data without calling joinGame to avoid infinite loop
      const gameResponse = await gameService.getGameById(state.currentGame._id);
      dispatch({ type: actions.SET_CURRENT_GAME, payload: gameResponse.data });
      
      return { success: true, team: response.data };
    } catch (error) {
      dispatch({ 
        type: actions.SET_ERROR, 
        payload: error.response?.data?.message || 'Failed to join team' 
      });
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to join team' 
      };
    }
  }, [isAuthenticated, state.currentGame]);

  // Start the current game
  const startGame = useCallback(async () => {
    if (!isAuthenticated || !state.currentGame) {
      return { success: false, error: 'Not in a game' };
    }
    
    dispatch({ type: actions.SET_LOADING, payload: true });
    try {
      const response = await gameService.startGame(state.currentGame._id);
      
      // Update current game
      dispatch({ type: actions.SET_CURRENT_GAME, payload: response.data });
      
      return { success: true };
    } catch (error) {
      dispatch({ 
        type: actions.SET_ERROR, 
        payload: error.response?.data?.message || 'Failed to start game' 
      });
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to start game' 
      };
    }
  }, [isAuthenticated, state.currentGame]);

  // Attempt to conquer a pub
  const conquerPub = useCallback((pubId) => {
    if (!isAuthenticated || !state.currentGame) {
      return { success: false, error: 'Not in a game' };
    }
    
    socketService.conquerPub(state.currentGame._id, pubId);
    return { success: true };
  }, [isAuthenticated, state.currentGame]);

  return (
    <GameContext.Provider
      value={{
        ...state,
        loadAvailableGames,
        createGame,
        joinGame,
        leaveGame,
        createTeam,
        joinTeam,
        startGame,
        conquerPub
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

// Custom hook for using game context
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export default GameContext; 