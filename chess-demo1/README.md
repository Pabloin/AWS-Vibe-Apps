# Chess Game with Stockfish

A complete chess game implementation in a single HTML file.

## Features

- 8x8 chess board with Unicode pieces
- Human plays White
- Computer (Stockfish engine) plays Black
- Full chess rules validation using chess.js
- Pawn promotion with piece selection
- Move history in algebraic notation
- Detects checkmate, stalemate, and draws
- Restart game button

## How to Play

1. Open `chess.html` in your web browser
2. Click on a piece to select it
3. Click on a highlighted square to move
4. The computer will automatically respond
5. Enjoy the game!

## Technologies Used

- HTML5
- CSS3
- JavaScript
- chess.js library (for rules validation)
- Stockfish.js (chess engine)

## Notes

- Stockfish thinks for ~400ms per move for responsive gameplay
- If Stockfish fails to load, the game falls back to random legal moves
- All chess rules are properly implemented including castling, en passant, and promotion
