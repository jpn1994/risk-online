# subRisk: Pub Conquest Game

A Risk-like web application where teams compete to conquer pubs in a city.

## Game Overview

In subRisk, players form teams and compete to conquer pubs across a city map. To conquer a pub, a team must successfully complete a challenge. The game features:

- Dynamic number of pubs that can be configured at game setup
- Support for multiple teams with unique colors
- Interactive map showing connections between pubs
- Turn-based gameplay where teams take turns attempting conquests
- Various challenges to complete in order to conquer pubs
- Sleek dark-themed UI for comfortable gameplay in any lighting
- Mobile-friendly responsive design

## How to Play

1. **Setup**: Configure the number of pubs and add at least two teams.
2. **Take Turns**: Each team takes turns attempting to conquer pubs.
3. **Conquer Pubs**: Click on a pub adjacent to one you already own to attempt a conquest.
4. **Complete Challenges**: When attempting a conquest, select and complete a challenge.
5. **Win the Game**: The first team to conquer all pubs wins!

## Technical Features

- Built with React
- Visualizes the pub network using D3.js
- Styled with styled-components
- Features a responsive design that works on desktop and mobile devices
- Dark-themed UI for reduced eye strain and better visibility in various environments
- Touch-optimized for mobile gameplay

## Installation and Running

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to GitHub Pages

This app is configured for easy deployment to GitHub Pages. To deploy:

1. Create a GitHub repository for this project
2. Update the `homepage` field in `package.json` with your GitHub username: 
   ```
   "homepage": "https://[your-github-username].github.io/risk-online"
   ```
3. Initialize git, add your files, and push to GitHub:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/[your-github-username]/risk-online.git
   git push -u origin main
   ```
4. Deploy to GitHub Pages:
   ```
   npm run deploy
   ```
5. Your app will be available at: `https://[your-github-username].github.io/risk-online`

## Future Enhancements

- Implement actual gameplay for the challenges rather than random outcomes
- Add more realistic pub data for specific cities
- Create a backend to allow multiplayer functionality
- Add special abilities for teams
- Implement bonuses for controlling groups of pubs
- Add theme toggle for users who prefer light mode 