"use strict";

import { createNewGame, getCurrentPlayer, playTurn } from "./game-logic.js";
import {
  highlightWinningBoardElements,
  hydrateResetButton,
  renderDrawStatus,
  renderGameBoard,
  renderPlayerInfo,
  updateGameBoard,
} from "./game-render.js";

export function startNewGame() {
  const newGame = createNewGame();
  const renderControls = renderGameBoard(newGame, updateGame);

  const currentPlayer = getCurrentPlayer(newGame);
  renderPlayerInfo(currentPlayer);

  function updateGame(game, columnIndex) {
    const updatedGame = playTurn(game, columnIndex);

    const currentPlayer = getCurrentPlayer(updatedGame);

    if (updatedGame.ended) {
      updateGameBoard(renderControls, game, updatedGame, () => {});

      if (updatedGame.isBoardFull) {
        renderDrawStatus();
        return;
      }

      renderPlayerInfo(currentPlayer, updatedGame.ended);
      highlightWinningBoardElements(renderControls.boardElements, updatedGame);
      return;
    }

    const playerChanged = game.currentPlayer !== updatedGame.currentPlayer;
    if (playerChanged) {
      renderPlayerInfo(currentPlayer);
      updateGameBoard(renderControls, game, updatedGame, updateGame);
    }
  }
}

hydrateResetButton(startNewGame);
startNewGame();
