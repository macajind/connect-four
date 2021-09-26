"use strict";

import {
  extractSequence2D,
  repeat,
  replaceAt,
  sequenceContains,
  toSequenceString,
} from "./utils.js";

const WIDTH = 7;
const HEIGHT = 6;

const WINNING_SEQUENCE_LENGTH = 4;

export const createNewGame = () => ({
  board: Array(WIDTH).fill(Array(HEIGHT).fill(null)),
  players: [
    { name: "Player 1", color: "red" },
    { name: "Player 2", color: "blue" },
  ],
  currentPlayer: 0,
  ended: false,
  isBoardFull: false,
});

export const getBoardWidth = (board) => board?.length ?? 0;

const getBoardIndexWidth = (board) => getBoardWidth(board) - 1;

export const getBoardHeight = (board) => board[0]?.length ?? 0;

const getBoardIndexHeight = (board) => getBoardHeight(board) - 1;

export function getPlayerOnBoard({ board, players }, rowIndex, columnIndex) {
  const playerId = board[columnIndex][rowIndex];
  const player = players[playerId] ?? null;
  return player;
}

export function getCurrentPlayer({ players, currentPlayer }) {
  const player = players[currentPlayer];

  if (!player) {
    throw new Error("Could not get a current player");
  }

  return player;
}

const nextPlayer = ({ players, currentPlayer }) =>
  (currentPlayer + 1) % players.length;

function updateBoardColumn(column, player) {
  const lastEmptySpaceIndex = column.lastIndexOf(null);

  if (lastEmptySpaceIndex === -1) {
    return {
      updatedColumn: column,
      updatedRowIndex: null,
    };
  }

  return {
    updatedColumn: replaceAt(column, lastEmptySpaceIndex, player),
    updatedRowIndex: lastEmptySpaceIndex,
  };
}

function getRowSequence(board, columnIndex) {
  const boardWidth = getBoardIndexWidth(board);

  const start = [0, columnIndex];
  const end = [boardWidth, columnIndex];
  const step = ([x, y]) => [x + 1, y];

  return extractSequence2D(board, start, step, end);
}

function getColumnSequence(board, rowIndex) {
  const boardHeight = getBoardIndexHeight(board);

  const start = [rowIndex, 0];
  const step = ([x, y]) => [x, y + 1];
  const end = [rowIndex, boardHeight];

  return extractSequence2D(board, start, step, end);
}

function getDiagonalSequence(board, rowIndex, columnIndex) {
  const boardWidth = getBoardIndexWidth(board);
  const boardHeight = getBoardIndexHeight(board);

  const start = [
    Math.max(rowIndex - columnIndex, 0),
    Math.max(columnIndex - rowIndex, 0),
  ];
  const end = [
    Math.min(boardHeight + rowIndex - columnIndex, boardWidth),
    Math.min(boardWidth + columnIndex - rowIndex, boardHeight),
  ];
  const step = ([x, y]) => [x + 1, y + 1];

  return extractSequence2D(board, start, step, end);
}

function getCounterDiagonalSequence(board, rowIndex, columnIndex) {
  const boardWidth = getBoardIndexWidth(board);
  const boardHeight = getBoardIndexHeight(board);

  const start = [
    Math.min(rowIndex + columnIndex, boardWidth),
    Math.max(rowIndex - (boardWidth - columnIndex), 0),
  ];
  const end = [
    Math.max(columnIndex - (boardHeight - rowIndex), 0),
    Math.min(rowIndex + columnIndex, boardHeight),
  ];
  const step = ([x, y]) => [x - 1, y + 1];

  return extractSequence2D(board, start, step, end);
}

function isolateWinningSequenceIndexes(winningSequence, { sequence, indexes }) {
  const sequenceStartIndex = toSequenceString(sequence).indexOf(
    toSequenceString(winningSequence)
  );

  if (sequenceStartIndex === -1) {
    return null;
  }

  return indexes.slice(
    sequenceStartIndex,
    sequenceStartIndex + winningSequence.length
  );
}

function getWinningSequence(board, currentPlayer, rowIndex, columnIndex) {
  const row = getRowSequence(board, columnIndex);
  const column = getColumnSequence(board, rowIndex);
  const diagonal = getDiagonalSequence(board, rowIndex, columnIndex);
  const counterDiagonal = getCounterDiagonalSequence(
    board,
    rowIndex,
    columnIndex
  );

  const playerWinningSequence = repeat(currentPlayer, WINNING_SEQUENCE_LENGTH);

  const winningSequence = [row, column, diagonal, counterDiagonal].find(
    ({ sequence }) => sequenceContains(sequence, playerWinningSequence)
  );

  return !!winningSequence
    ? {
        ...winningSequence,
        winningIndexes: isolateWinningSequenceIndexes(
          playerWinningSequence,
          winningSequence
        ),
      }
    : null;
}

function isBoardFull(board) {
  const emptySpaces = board.flat().filter((element) => element == null);
  return emptySpaces.length === 0;
}

export function playTurn(game, columnIndex) {
  if (game.ended) {
    return game;
  }

  const gameColumn = game.board[columnIndex];

  if (!gameColumn) {
    throw new Error("Invalid column index");
  }

  const { updatedColumn, updatedRowIndex } = updateBoardColumn(
    gameColumn,
    game.currentPlayer
  );

  if (updatedRowIndex == null) {
    return game;
  }

  const updatedBoard = replaceAt(game.board, columnIndex, updatedColumn);

  const winningSequence = getWinningSequence(
    updatedBoard,
    game.currentPlayer,
    columnIndex,
    updatedRowIndex
  );
  const isWinner = !!winningSequence;

  const isGameBoardFull = isBoardFull(updatedBoard);

  return {
    ...game,
    board: updatedBoard,
    currentPlayer: isWinner ? game.currentPlayer : nextPlayer(game),
    ended: isWinner || isGameBoardFull,
    isBoardFull: isGameBoardFull,
    ...(isWinner &&
      winningSequence.winningIndexes && {
        winningIndexes: winningSequence.winningIndexes,
      }),
  };
}

export function boardsDiffSequence(board1, board2) {
  const board1Width = getBoardIndexWidth(board1);
  const board1Height = getBoardIndexHeight(board1);

  const board2Width = getBoardIndexWidth(board2);
  const board2Height = getBoardIndexHeight(board2);

  if (board1Width !== board2Width || board1Height !== board2Height) {
    throw new Error("Can not compare boards with different dimensions");
  }

  const board1Elements = board1.flat();
  const board2Elements = board2.flat();

  return board1Elements.reduce(
    (diff, element, index) =>
      board2Elements[index] !== element ? [...diff, index] : diff,
    []
  );
}
