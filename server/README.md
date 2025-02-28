# subRisk Server

Backend server for the subRisk multiplayer game, a pub conquest game where teams compete to control locations on a map.

## Features

- Real-time game state synchronization using Socket.IO
- User authentication and account management
- Team management with color selection
- Admin mode for game setup and management
- Pub conquest mechanics with adjacency validation
- In-game chat functionality
- Game events tracking and history

## Tech Stack

- **Node.js** with **Express.js** for the API server
- **MongoDB** with **Mongoose** for data persistence
- **Socket.IO** for real-time bidirectional communication
- **JWT** (JSON Web Tokens) for authentication

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
2. Navigate to the server directory:
   ```
   cd server
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file based on the `.env.example` file:
   ```
   cp .env.example .env
   ```
5. Update the `.env` file with your MongoDB connection string and JWT secret.

### Running the Server

For development:
```
npm run dev
```

For production:
```
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/me` - Get current user profile

### Games
- `POST /api/games` - Create a new game
- `GET /api/games` - Get all games
- `GET /api/games/:id` - Get a specific game
- `PUT /api/games/:id` - Update a game (admin only)
- `POST /api/games/:id/teams` - Create a team for a game
- `POST /api/games/:id/pubs` - Add a pub to a game (admin only)
- `POST /api/games/:id/join/:teamId` - Join an existing team
- `POST /api/games/:id/start` - Start a game (admin only)

## Socket.IO Events

### Client Events (emit)
- `join-game` - Join a game room
- `leave-game` - Leave a game room
- `conquer-pub` - Attempt to conquer a pub
- `send-message` - Send a chat message

### Server Events (listen)
- `error` - Receive error messages
- `game-state` - Receive the current game state
- `user-joined` - User joined the game
- `user-left` - User left the game
- `pub-conquered` - A pub was conquered
- `chat-message` - Receive chat messages
- `game-over` - Game has ended

## Authentication

The server uses JWT for authentication. When connecting via Socket.IO, include the token in the connection handshake:

```javascript
const socket = io(SERVER_URL, {
  auth: {
    token: YOUR_JWT_TOKEN
  }
});
```

## Database Models

- **User** - User accounts with authentication
- **Game** - Game sessions with settings and state
- **Team** - Teams within a game with members and conquered pubs
- **Pub** - Locations on the map that can be conquered

## License

MIT 