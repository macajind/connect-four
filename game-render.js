"use strict";

import {
  boardsDiffSequence,
  getBoardHeight,
  getBoardWidth,
  getCurrentPlayer,
  getPlayerOnBoard,
} from "./game-logic.js";
import {
  appendChildren,
  fromFlatIndex,
  getMemoizedElementById,
  range,
  toFlatIndex,
} from "./utils.js";

const getBoardElement = getMemoizedElementById("board");

function getClearBoardElement() {
  const boardElement = getBoardElement();
  boardElement.innerHTML = "";
  return boardElement;
}

const getPlayerElement = getMemoizedElementById("player");

function getClearPlayerElement() {
  const playerElement = getPlayerElement();
  playerElement.innerHTML = "";
  return playerElement;
}

const createGameControlElement = (game, onGameUpdate) => (columnIndex) => {
  const controlElement = document.createElement("th");

  controlElement.addEventListener("click", () =>
    onGameUpdate(game, columnIndex)
  );

  return controlElement;
};

function createGameControlElements(game, onGameUpdate) {
  const boardControlWidth = getBoardWidth(game.board);

  const createControlElement = createGameControlElement(game, onGameUpdate);
  const toControlElement = (_, index) => createControlElement(index);

  return range(boardControlWidth).map(toControlElement);
}

function createGameBoardControl(game, onGameUpdate) {
  const controlElements = createGameControlElements(game, onGameUpdate);

  const boardControl = document.createElement("tr");
  appendChildren(boardControl, controlElements);

  return boardControl;
}

function updateGameBoardControl(boardControl, game, onGameUpdate) {
  const controlElements = createGameControlElements(game, onGameUpdate);
  boardControl.innerHTML = "";
  appendChildren(boardControl, controlElements);
  return boardControl;
}

function createPlayerElement(player) {
  const playerElement = document.createElement("div");
  playerElement.classList.add("player-piece");
  playerElement.style.backgroundColor = player.color;
  playerElement.setAttribute("title", player.name);
  return playerElement;
}

function createBoardElement(player) {
  const boardElement = document.createElement("td");

  if (!!player) {
    const playerElement = createPlayerElement(player);
    boardElement.appendChild(playerElement);
  }

  return boardElement;
}

function updateBoardElement(boardElement, player) {
  if (!!player) {
    const playerElement = createPlayerElement(player);
    boardElement.innerHTML = "";
    boardElement.appendChild(playerElement);
  }

  return boardElement;
}

const createGameBoardRow = (game) => (rowIndex) => {
  const boardWidth = getBoardWidth(game.board);
  const toBoardElement = createBoardElement;
  const boardRowElements = range(boardWidth).map((_, columnIndex) => {
    const player = getPlayerOnBoard(game, rowIndex, columnIndex);
    return toBoardElement(player);
  });

  const boardRow = document.createElement("tr");
  appendChildren(boardRow, boardRowElements);

  return { boardRow, boardRowElements };
};

export function renderGameBoard(game, onGameUpdate) {
  const boardElement = getClearBoardElement();

  const boardControl = createGameBoardControl(game, onGameUpdate);
  boardElement.appendChild(boardControl);

  const boardHeight = getBoardHeight(game.board);
  const toBoardRow = createGameBoardRow(game);
  const { boardRows, boardElements } = range(boardHeight).reduce(
    ({ boardRows, boardElements }, _, index) => {
      const { boardRow, boardRowElements } = toBoardRow(index);

      return {
        boardRows: [...boardRows, boardRow],
        boardElements: [...boardElements, ...boardRowElements],
      };
    },
    { boardRows: [], boardElements: [] }
  );
  appendChildren(boardElement, boardRows);

  return { boardControl, boardElements };
}

function createPlayerNameElement(player) {
  const playerNameElement = document.createElement("span");
  playerNameElement.innerText = player.name;
  playerNameElement.style.color = player.color;
  return playerNameElement;
}

export function renderPlayerInfo(player, isWinner = false) {
  const playerElement = getClearPlayerElement();
  playerElement.appendChild(createPlayerNameElement(player));
  playerElement.appendChild(
    document.createTextNode(isWinner ? " is a winner!" : " is on turn")
  );
  return playerElement;
}

export function renderDrawStatus() {
  const playerElement = getClearPlayerElement();
  playerElement.innerText = "It's a draw!";
  return playerElement;
}

export function updateGameBoard(
  { boardControl, boardElements },
  game,
  updatedGame,
  onGameUpdate
) {
  updateGameBoardControl(boardControl, updatedGame, onGameUpdate);

  const revertIndex = fromFlatIndex(getBoardHeight(game.board));
  const convertIndex = toFlatIndex(getBoardWidth(game.board));
  const transformIndexForBoardElements = (index) => {
    const [x, y] = revertIndex(index);
    return convertIndex([y, x]);
  };

  const boardsDiffIndexes = boardsDiffSequence(game.board, updatedGame.board);
  boardsDiffIndexes.map((index) => {
    const boardElementIndex = transformIndexForBoardElements(index);
    const boardElement = boardElements[boardElementIndex];
    const player = getCurrentPlayer(game);
    return updateBoardElement(boardElement, player);
  });

  return { boardControl, boardElements };
}

function highlightWinningBoardElement(boardElement) {
  boardElement.classList.add("winning-piece");
  return boardElement;
}

export function highlightWinningBoardElements(boardElements, game) {
  if (!game.winningIndexes) {
    return;
  }

  const convertIndex = toFlatIndex(getBoardWidth(game.board));
  game.winningIndexes.map(([x, y]) => {
    const boardElementIndex = convertIndex([y, x]);
    const boardElement = boardElements[boardElementIndex];
    highlightWinningBoardElement(boardElement);
  });
}

export function hydrateResetButton(onClick) {
  const buttonElement = document.getElementById("reset-button");
  buttonElement.addEventListener("click", onClick);
  return buttonElement;
}
