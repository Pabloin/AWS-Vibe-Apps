# Chess.com Profile Stats Analyzer

A beautiful web app that analyzes your Chess.com profile and displays interesting statistics about your playing habits.

## Features

### Statistics Displayed:
- **Total Games**: All games from the last 12 months
- **Estimated Hours**: Time spent playing chess (estimated based on game type)
- **Games This Month**: Number of games played in the current month
- **Peak Hour**: The hour of day when you play most

### Visualizations:
- **Games per Month**: Bar chart showing your activity over the last 12 months
- **Games by Hour**: 24-hour chart showing when you prefer to play

## How to Use

1. Open `index.html` in your web browser
2. The app will automatically load stats for the profile: **pabloinchausti**
3. View your chess playing patterns and statistics

## Customization

To analyze a different Chess.com profile, edit line 234 in `index.html`:

```javascript
const username = 'your-username-here';
```

## Technical Details

- Uses Chess.com Public API
- Fetches last 12 months of game archives
- Analyzes game timestamps to determine playing patterns
- Estimates playing time based on game time controls:
  - Bullet: ~3 minutes per game
  - Blitz: ~5 minutes per game
  - Rapid: ~15 minutes per game
  - Daily: ~30 minutes per game

## API Used

- Chess.com Public API: `https://api.chess.com/pub/player/{username}/games/archives`

## Browser Compatibility

Works in all modern browsers that support:
- ES6+ JavaScript
- Fetch API
- CSS Grid

## Profile Link

View the profile on Chess.com: [pabloinchausti](https://www.chess.com/member/pabloinchausti/games)
