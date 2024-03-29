// @ts-check

import { updateAiStats, getAiStats } from "./database.js";

/* ------- INITIALIZATIONS ------- */
let boardBar = document.getElementById('board-bar');
let mainBoard = document.getElementById('main-board');
let hidden = document.getElementById('internal-board');
// let status = document.getElementById('game-status');
let turnCount = document.getElementById('turn-count');
let resetBtn = document.getElementById('reset');
// let startAIBtn = document.getElementById('start-ai');
let aggregateBoard = document.getElementById('aggregate-board');
let gameBar = document.getElementById('game-bar');
let matchHistory = document.getElementById('matches');
let newGameBtn = document.getElementById('new-game');
let gameWrapper = document.getElementById('game-wrapper');
let buttonBar = document.getElementById('button-bar');
let balanceButtons = document.getElementById('buttons-balance');
let startAIBtn = document.getElementById('start-ai');

const numTiles = 100 + 21; // 21 for extra spaces for legends
const DEFAULT = 0;
const HIT = 10;
const MISS = 20;
const DESTROYED = 30;
const COLUMNS = 11;
const ROWS = 11;
const SHIP = -1;
const INVALID = -2;
const HORIZONTAL = 0;
const VERTICAL = 1;
const RIGHT = 1;
const LEFT = -1;
const UP = -11;
const DOWN = 11;

let won = false;
let hitCount = 0;
const totalHits = 17;

const CARRIER = 5;
const BATTLESHIP = 4;
const SUBMARINE1 = 3;
const DESTROYER = 2;
const SUBMARINE2 = 6;

const validShips = new Set();
validShips.add(CARRIER);
validShips.add(BATTLESHIP);
validShips.add(SUBMARINE1);
validShips.add(SUBMARINE2);
validShips.add(DESTROYER);

const SLEEPTIME = 500;

const WON_MATCH = 'linear-gradient(90deg, #67e99d, #36e27e)';
const LOST_MATCH = 'linear-gradient(90deg, #ea6666, #e74b4b)';

let shipLocations;
let numTurns, playerTurns, aiTurns;
let aiPlayed = false;

let boardState = {
  "internal": [],
  "visible": []
}

let shipHits = {
  carrier: { hits: 0, sunk: false },
  battleship: { hits: 0, sunk: false },
  submarine1: { hits: 0, sunk: false },
  submarine2: { hits: 0, sunk: false },
  destroyer: { hits: 0, sunk: false }
}

const invalidSpot = new Set();
invalidSpot.add(HIT);
invalidSpot.add(MISS);
invalidSpot.add(DESTROYED);
invalidSpot.add(CARRIER);
invalidSpot.add(BATTLESHIP);
invalidSpot.add(SUBMARINE1);
invalidSpot.add(SUBMARINE2);
invalidSpot.add(DESTROYER);

for (let i = 65; i <= 74; ++i) {
  invalidSpot.add(String.fromCharCode(i));
};
for (let i = 1; i <= 10; ++i) {
  invalidSpot.add(i);
}

const lettersNumbers = new Set();
for (let i = 1; i <= 10; ++i) {
  lettersNumbers.add(i);
}

/* ------- FUNCTIONS ------- */

function shipAt(board, index) {
  return invalidSpot.has(board[index]);
}

function randomInt(range) {
  return Math.floor(Math.random() * range);
}

function getIdx(length, orientation) {
  let column, row;

  if (orientation === VERTICAL) {
    column = randomInt(COLUMNS - 1) + 1;
    row = randomInt(ROWS - length) + 1;
  } else {
    column = randomInt(COLUMNS - length) + 1;
    row = randomInt(ROWS - 1) + 1;
  }

  let index = row * COLUMNS + column;
  return index;
}

function placeShip(length, board, secondSub, saveLocations, locationArr) {
  let placeable = false;
  let orientation = randomInt(2);
  let originIdx = getIdx(length, orientation);
  let index = originIdx;
  let maxTries = 100;

  let increment;
  if (orientation === HORIZONTAL) {
    increment = 1;
  } else {
    increment = COLUMNS;
  }

  let tryCount = 0;
  while ((tryCount < maxTries) && !placeable) {
    ++tryCount;
    for (let j = 0; j < length; ++j) {
      if (shipAt(board, index)) {
        originIdx = getIdx(length, orientation);
        index = originIdx;
        break;
      } else if (j === (length - 1)) {
        placeable = true;
        break;
      }
      index += increment;
    }
  }

  if (!placeable) return;

  let ship = length;
  if (ship === SUBMARINE1 && secondSub) {
    ship = SUBMARINE2;
  }
  for (let j = 0; j < length; ++j) {
    if (saveLocations) {
      locationArr[ship].push(originIdx);
    }

    board[originIdx] = ship;
    if (orientation === HORIZONTAL) {
      ++originIdx;
    } else {
      originIdx += COLUMNS;
    }

  }
}

function initBoard(board) {
  board.internal.length = 0;
  board.visible.length = 0;
  numTurns = 0;

  for (let i = 0; i < numTiles; ++i) {
    board.internal.push(DEFAULT);
    board.visible.push(DEFAULT);
  }

  // make legends:
  // rows
  for (let i = 0; i < COLUMNS; ++i) {
    board.visible[i] = i;
    board.internal[i] = INVALID;
  }
  // columns
  for (let i = 1; i < ROWS; ++i) {
    board.visible[i * COLUMNS] = String.fromCharCode(64 + i);
    board.internal[i * COLUMNS] = INVALID;
  }

  shipLocations = [-1, -1, [], [], [], [], []];

  // place ships
  for (let i = 5; i >= 2; --i) {
    if (i !== 3) {
      placeShip(i, board.internal, false, true, shipLocations);
    } else {
      placeShip(i, board.internal, false, true, shipLocations);
      placeShip(i, board.internal, true, true, shipLocations);
    }
  }
}

function checkWin() {
  return shipHits.carrier.sunk && shipHits.battleship.sunk && shipHits.submarine1.sunk && shipHits.submarine2.sunk && shipHits.destroyer.sunk;
}

function handleWin() {
  won = true;
  mainBoard.style.background = "#11ab68";
  let tiles = mainBoard.childNodes;
  for (let i = 0; i < numTiles; ++i) {
    tiles[i].removeEventListener('click', handleMove);
    tiles[i].style.cursor = 'default'
  }

  if (!aiPlayed) {
    startAIBtn.style.visibility = 'initial';
  }
}

function checkDestroy(ship) {
  let tiles = mainBoard.childNodes;
  for (const index of shipLocations[ship]) {
    if (boardState.visible[index] == DEFAULT) {
      return false;
    }
  }

  // destroyed
  for (const index of shipLocations[ship]) {
    tiles[index].classList.add('destroyed');
    tiles[index].classList.remove('hit');
    boardState.visible[index] = DESTROYED;
  }
  switch (ship) {
    case CARRIER:
      shipHits.carrier.sunk = true;
      break;
    case DESTROYER:
      shipHits.destroyer.sunk = true;
      break;
    case SUBMARINE1:
      shipHits.submarine1.sunk = true;
      break;
    case SUBMARINE2:
      shipHits.submarine2.sunk = true;
      break;
    case BATTLESHIP:
      shipHits.battleship.sunk = true;
      break;
  }

  if (checkWin()) {
    handleWin();
  };

  return true;
}

function handleMove(event) {
  let clickedItem = event.srcElement;
  clickedItem.removeEventListener('click', handleMove);
  clickedItem.classList.remove('default');
  const index = +clickedItem.innerText; // parse number from text

  if (shipAt(boardState.internal, index)) {
    boardState.visible[index] = HIT;
    clickedItem.classList.add('hit');
    let shipType = boardState.internal[index];
    switch (shipType) {
      case CARRIER:
        ++shipHits.carrier.hits;
        break;
      case DESTROYER:
        ++shipHits.destroyer.hits;
        break;
      case SUBMARINE1:
        ++shipHits.submarine1.hits;
        break;
      case SUBMARINE2:
        ++shipHits.submarine2.hits;
        break;
      case BATTLESHIP:
        ++shipHits.battleship.hits;
        break;
    }
    checkDestroy(shipType);
  } else {
    clickedItem.classList.add('miss');
    boardState.visible[index] = MISS;
  }

  turnCount.innerText = +turnCount.innerText + 1;
  ++numTurns;
}

function displayBoard(board) {
  const boardLength = board.visible.length;
  let temp = document.createElement('div');
  mainBoard.appendChild(temp);

  for (let i = 1; i < 11; ++i) {
    let item = document.createElement('div');
    item.classList.add('board-item');
    item.innerText = board.visible[i]
    mainBoard.appendChild(item);
  }

  for (let i = ROWS; i < boardLength; ++i) {
    let item = document.createElement('div');
    item.classList.add('board-item');
    item.innerText = i;
    if (board.visible[i] === DEFAULT) {
      item.classList.add('default', 'game-item');
      item.addEventListener('click', handleMove);
    } else {
      item.innerText = board.visible[i];
    }
    mainBoard.appendChild(item);
  }
}

function displayInternal(board) {
  const length = hidden.childNodes.length;

  for (let i = 0; i < length; ++i) {
    hidden.childNodes[0].remove();
  }

  for (let i = 0; i < numTiles; ++i) {
    let item = document.createElement('div');
    item.innerText = board.internal[i];
    if (shipAt(board.internal, i)) {
      item.style.background = '#595959';
    }
    hidden.appendChild(item);
  }
}

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
};

// let randomMoves = async () => {
//   let tried = new Set();
//   let children = mainBoard.childNodes;
//   while (!won) {
//     console.log('moving');
//     let index = randomInt(numTiles);
//     while (tried.has(index)) {
//       index = randomInt(numTiles);
//     }
//     tried.add(index);
//     children[index].click();
//     if (boardState.visible[index] === HIT) {
//       seekDestroy(index, children);
//     }
//     await sleep(SLEEPTIME);
//   }
// }

function heatMapColorforValue(value) {
  if (value === 0) {
    return "hsl(240, 100%, 30%)";
  }
  let h = (1.0 - value) * 240;
  return "hsl(" + h + ", 100%, 50%)";
}

function generatePossible(sourceBoard, possibleBoard) {
  // clear possibleBoard
  while (possibleBoard.length) {
    possibleBoard.pop();
  }

  for (let i = 0; i < numTiles; ++i) {
    possibleBoard.push(sourceBoard[i]);
  }

  if (!shipHits.carrier.sunk) {
    placeShip(CARRIER, possibleBoard, false, false, []);
  }
  if (!shipHits.battleship.sunk) {
    placeShip(BATTLESHIP, possibleBoard, false, false, []);
  }
  if (!shipHits.submarine1.sunk) {
    placeShip(SUBMARINE1, possibleBoard, false, false, []);
  }
  if (!shipHits.submarine2.sunk) {
    placeShip(SUBMARINE1, possibleBoard, true, false, []);
  }
  if (!shipHits.destroyer.sunk) {
    placeShip(DESTROYER, possibleBoard, false, false, []);
  }
  return possibleBoard;
}

function aggregateSets(board) {
  let prevAggregateBoard = aggregateBoard.childNodes;
  const prevLen = prevAggregateBoard.length;
  for (let i = 0; i < prevLen; ++i) {
    prevAggregateBoard[0].remove();
  }

  let aggregate = [];
  for (let i = 0; i < numTiles; ++i) {
    aggregate.push(0);
  }
  const numTests = 50000;
  let tempArr = [];
  for (let i = 0; i < numTests; ++i) {
    let possible = generatePossible(board, tempArr);

    for (let j = 0; j < numTiles; ++j) {
      if (possible[j] && (possible[j] !== MISS && possible[j] !== DESTROYED)) {
        ++aggregate[j];
      }
    }
  }

  let temp = document.createElement('div');
  aggregateBoard.appendChild(temp);

  for (let i = 1; i < 11; ++i) {
    let temp = document.createElement('div');
    temp.classList.add('board-item');
    aggregateBoard.appendChild(temp);
    temp.innerText = i;
  }

  let max = +aggregate[12] / numTests; // first value
  let maxIdx = 12;
  let letter = 65;
  for (let i = ROWS; i < numTiles; i += COLUMNS) {
    let temp = document.createElement('div');
    temp.classList.add('board-item');
    temp.innerText = String.fromCharCode(letter);
    ++letter;
    aggregateBoard.appendChild(temp);
    for (let j = 1; j <= 10; ++j) {
      let item = document.createElement('div');
      let index = i + j;
      let value = +aggregate[index] / numTests;
      if (value > max) {
        max = value;
        maxIdx = index;
      }
      item.style.background = heatMapColorforValue(value);
      item.classList.add('board-item');
      aggregateBoard.appendChild(item);
    }
  }

  return maxIdx;
}

function placeShipFromTo(length, board, secondSub, idx, direction) {
  let placed = false;
  let curIdx = idx;

  if (!inRange(curIdx) || invalidSpot.has(board[curIdx])) {
    return;
  }

  for (let i = 0; i < length; ++i) {
    curIdx += direction;

    if (!inRange(curIdx) || invalidSpot.has(board[curIdx]) || board[curIdx] === MISS || board[curIdx] === DESTROYED) {
      return;
    }
  }

  let ship = length;
  if (ship === SUBMARINE1 && secondSub) {
    ship = SUBMARINE2;
  }
  curIdx = idx;
  for (let i = 0; i < length; ++i) {
    ++board[curIdx];
    curIdx += direction;
  }
  return;
}

function generatePossibleAt(board, idx, direction, prevCorrect) {
  idx += direction;

  if (!invalidSpot.has(board[idx])) {
    let spots = [];

    for (let i = 0; i < numTiles; ++i) {
      spots.push(board[i]);
    }

    let shipsUsed = 0;
    if (!shipHits.carrier.sunk && (prevCorrect <= CARRIER)) {
      ++shipsUsed;
      placeShipFromTo(CARRIER - prevCorrect, spots, false, idx, direction);
      placeShipFromTo(CARRIER, spots, false, idx, (direction * -1));
    }
    if (!shipHits.battleship.sunk && (prevCorrect < BATTLESHIP)) {
      ++shipsUsed;
      placeShipFromTo(BATTLESHIP - prevCorrect, spots, false, idx, direction);
      placeShipFromTo(BATTLESHIP, spots, false, idx, (direction * -1));
    }
    if (!shipHits.submarine1.sunk && (prevCorrect < SUBMARINE1)) {
      ++shipsUsed;
      placeShipFromTo(SUBMARINE1 - prevCorrect, spots, false, idx, direction);
      placeShipFromTo(SUBMARINE1, spots, false, idx, (direction * -1));
    }
    if (!shipHits.submarine2.sunk && (prevCorrect < SUBMARINE1)) {
      ++shipsUsed;
      placeShipFromTo(SUBMARINE1 - prevCorrect, spots, true, idx, direction);
      placeShipFromTo(SUBMARINE1, spots, true, idx, (direction * -1));
    }
    if (!shipHits.destroyer.sunk && (prevCorrect < DESTROYER)) {
      ++shipsUsed;
      placeShipFromTo(DESTROYER - prevCorrect, spots, false, idx, direction);
      placeShipFromTo(DESTROYER, spots, false, idx, (direction * -1));
    }

    for (let i = 12; i < numTiles; ++i) {
      if (spots[i]) {
        if (spots[i] === MISS || spots[i] === DESTROYED) {
          spots[i] = 0;
        } else if (spots[i] === HIT) {
          spots[i] = 10;
        }
      }
    }

    return spots;
  }

  return [];
}

function aggregateOnHit(board, hitIdx, direction, prevCorrect) {
  let prevAggregateBoard = aggregateBoard.childNodes;
  let prevLen = prevAggregateBoard.length;

  for (let i = 0; i < prevLen; ++i) {
    prevAggregateBoard[0].remove();
  }

  let aggregate = [];
  for (let i = 0; i < numTiles; ++i) {
    aggregate.push(0);
  }

  const numTests = 10;
  for (let i = 0; i < numTests; ++i) {
    let possible = generatePossibleAt(board, hitIdx, direction, prevCorrect);
    for (let j = 0; j < numTiles; ++j) {
      if (possible[j] && (possible[j] !== MISS && possible[j] !== DESTROYED)) {
        aggregate[j] = possible[j];
      }
    }
  }

  let temp = document.createElement('div');
  temp.classList.add('board-item');
  aggregateBoard.appendChild(temp);
  for (let i = 1; i < 11; ++i) {
    let temp = document.createElement('div');
    temp.classList.add('board-item');
    aggregateBoard.appendChild(temp);
    temp.innerText = i;
  }

  let letter = 65;
  for (let i = ROWS; i < numTiles; i += COLUMNS) {
    let temp = document.createElement('div');
    temp.classList.add('board-item');
    temp.innerText = String.fromCharCode(letter);
    ++letter;
    aggregateBoard.appendChild(temp);
    for (let j = 1; j <= 10; ++j) {
      let item = document.createElement('div');
      let index = i + j;
      let value = +aggregate[index] / numTests;

      item.style.background = heatMapColorforValue(value);
      item.classList.add('board-item');
      aggregateBoard.appendChild(item);
    }
  }
}

function inRange(idx) {
  return (idx >= 12) && (idx <= 120);
}

let tryDirection = async (board, curIdx, increment, tiles, correctCount) => {
  curIdx += increment;

  if (inRange(curIdx)) {
    await sleep(SLEEPTIME);
    tiles[curIdx].click();
    aggregateSets(board);

    while (board[curIdx] === HIT) {
      ++correctCount;
      aggregateSets(board);

      curIdx += increment;
      await sleep(SLEEPTIME);
      if (inRange(curIdx)) {
        tiles[curIdx].click();
        aggregateSets(board);
      } else {
        return correctCount;
      }
    }

    return correctCount;
  } else {
    return 0;
  }
}

function combineAggregate(...boards) {
  const boardCount = boards.length;
  if (boardCount <= 0) return;

  let final = [];
  for (let i = 0; i < numTiles; ++i) {
    final.push(0);
  }

  for (const board of boards) {
    console.log(board);
    for (let i = 0; i < numTiles; ++i) {
      console.log(board);
      if (validShips.has(board[i])) {
        ++final[i];
      }
    }
  }

  for (let i = 0; i < numTiles; ++i) {
    if (final[i] !== MISS || final[i] !== DESTROYED || lettersNumbers.has(final[i])) {
      final[i] /= boardCount;
    }
  }

  return final;
}

function aggregateHitAllDirections(board, hitIdx, prevCorrect) {
  let prevAggregateBoard = aggregateBoard.childNodes;
  const prevLen = prevAggregateBoard.length;

  for (let i = 0; i < prevLen; ++i) {
    prevAggregateBoard[0].remove();
  }

  let aggregate = [];
  for (let i = 0; i < numTiles; ++i) {
    aggregate.push(0);
  }

  const numTests = 10;
  for (let i = 0; i < numTests; ++i) {
    let possibleUp = generatePossibleAt(board, hitIdx, UP, prevCorrect);
    let possibleDown = generatePossibleAt(board, hitIdx, DOWN, prevCorrect);
    let possibleRight = generatePossibleAt(board, hitIdx, RIGHT, prevCorrect);
    let possibleLeft = generatePossibleAt(board, hitIdx, LEFT, prevCorrect);
    let possibleAll = combineAggregate(possibleUp, possibleDown, possibleRight, possibleLeft);
    for (let j = 0; j < numTiles; ++j) {
      if (possibleAll[j] && (possibleAll[j] !== HIT && possibleAll[j] !== MISS && possibleAll[j] !== DESTROYED)) {
        aggregate[j] = possibleAll[j];
      }
    }
  }

  let temp = document.createElement('div');
  temp.classList.add('board-item');
  aggregateBoard.appendChild(temp);
  for (let i = 1; i < 11; ++i) {
    let temp = document.createElement('div');
    temp.classList.add('board-item');
    aggregateBoard.appendChild(temp);
    temp.innerText = i;
  }

  let letter = 65;
  for (let i = ROWS; i < numTiles; i += COLUMNS) {
    let temp = document.createElement('div');
    temp.classList.add('board-item');
    temp.innerText = String.fromCharCode(letter);
    ++letter;
    aggregateBoard.appendChild(temp);
    for (let j = 1; j <= 10; ++j) {
      let item = document.createElement('div');
      const index = i + j;
      let value = +aggregate[index] / numTests;

      item.style.background = heatMapColorforValue(value);
      item.classList.add('board-item');
      aggregateBoard.appendChild(item);
    }
  }
}

let seekDestroy = async (board, startingIdx, tiles) => {
  let curIdx = startingIdx;
  let correctCount = 1;

  if (inRange(startingIdx + RIGHT) && !shipAt(board, startingIdx + RIGHT)) {
    await tryDirection(board, curIdx, RIGHT, tiles, correctCount).then(result => {
      correctCount = result;
    });
    curIdx = startingIdx;
    if (board[startingIdx] === DESTROYED) {
      return;
    }
  }

  if (inRange(startingIdx + LEFT) && !shipAt(board, startingIdx + LEFT)) {
    await tryDirection(board, curIdx, LEFT, tiles, correctCount).then(result => {
      correctCount = result;
    });
    curIdx = startingIdx;
    if (board[startingIdx] === DESTROYED) {
      return;
    }
  }

  if (inRange(startingIdx + UP) && !shipAt(board, startingIdx + UP)) {
    await tryDirection(board, curIdx, UP, tiles, correctCount).then(result => {
      correctCount = result;
    });
    curIdx = startingIdx;
    if (board[startingIdx] === DESTROYED) {
      return;
    }
  }

  if (inRange(startingIdx + DOWN) && !shipAt(board, startingIdx + DOWN)) {
    await tryDirection(board, curIdx, DOWN, tiles, correctCount).then(result => {
      correctCount = result;
    });
    curIdx = startingIdx;
    if (board[startingIdx] === DESTROYED) {
      return;
    }
  }
}

let aiMoves = async () => {
  let cover = document.createElement('div');
  cover.style.position = 'absolute';
  cover.style.height = `${boardBar.offsetHeight}px`;
  cover.style.width = `${boardBar.offsetWidth}px`;
  boardBar.appendChild(cover);

  let tiles = mainBoard.childNodes;
  let idx = aggregateSets(boardState.visible);

  while (!won) {
    await sleep(SLEEPTIME);
    tiles[idx].click();

    if (checkWin()) {
      return;
    }

    if (boardState.visible[idx] === HIT) {
      aggregateSets(boardState.visible);
      await seekDestroy(boardState.visible, idx, tiles);
    }
    idx = aggregateSets(boardState.visible);
  }
  cover.remove();
}

function resetBoard(board) {
  board.visible.length = 0;
  for (let i = 0; i < numTiles; ++i) {
    board.visible.push(DEFAULT);
  }

  // make legends
  // rows
  for (let i = 0; i < COLUMNS; ++i) {
    board.visible[i] = i;
  }
  // columns
  for (let i = 1; i < ROWS; ++i) {
    board.visible[i * COLUMNS] = String.fromCharCode(64 + i);
  }
  turnCount.innerText = 0;
  numTurns = 0;
  won = false;
  shipHits = {
    carrier: { hits: 0, sunk: false },
    battleship: { hits: 0, sunk: false },
    submarine1: { hits: 0, sunk: false },
    submarine2: { hits: 0, sunk: false },
    destroyer: { hits: 0, sunk: false }
  };
  let tiles = mainBoard.childNodes;
  let length = tiles.length;
  for (let i = 0; i < length; ++i) {
    tiles[0].remove();
  }
  mainBoard.style.background = "initial";
  displayBoard(boardState);
}

// startAIBtn.innerText = 'Let AI play';
// startAIBtn.id = 'start-ai';
startAIBtn.onclick = async () => {
  startAIBtn.style.visibility = 'hidden';
  newGameBtn.style.visibility = 'hidden';
  aiPlayed = true;
  if (!won) {
    return;
  }
  playerTurns = numTurns;
  resetBoard(boardState);

  aggregateBoard.style.display = 'grid';
  await aiMoves();
  aiTurns = numTurns;
  // let saveAI = document.createElement('span');
  // saveAI.innerText = `AI's amount of turns: ${aiTurns}`;

  newGameBtn.style.visibility = 'initial';
  displayMatch(playerTurns, aiTurns);
  let aiWon;
  if (playerTurns <= aiTurns) {
    aiWon = false;
  } else {
    aiWon = true;
  }

  updateAiStats(aiWon, aiTurns);
}

let displayMatch = (playerCount, aiCount) => {
  let matchCard = document.createElement('li');
  matchCard.classList.add('match');
  let decorLineType;
  // console.log('player:', playerCount, 'ai:', aiCount);
  if (playerCount <= aiCount) {
    matchCard.style.background = WON_MATCH;
    decorLineType = 'won';
  } else {
    matchCard.style.background = LOST_MATCH;
    decorLineType = 'lost';
  }
  matchCard.innerHTML = `<div class="decorative-line line-${decorLineType}"></div><div>Your turns: <b>${playerCount}</b> | AI's turns: <b>${aiCount}</b></div>`;
  matchHistory.prepend(matchCard);
}

function clickAll() {
  let tiles = mainBoard.childNodes;

  for (let i = 0; i < numTiles; ++i) {
    tiles[i].click();
  }
}

// let autoWin = document.getElementById('auto-win');
// autoWin.onclick = () => {
//   clickAll();
// }

function newGame(game) {
  initBoard(game);
  resetBoard(game);
}

newGameBtn.onclick = () => {
  aiPlayed = false;
  startAIBtn.style.visibility = 'hidden';
  aggregateBoard.style.display = 'none';
  newGame(boardState);
}

document.addEventListener('keydown', (event) => {
  if ((event.altKey || event.ctrlKey) && event.key === '1') {
    clickAll();
  }
});

/* ------- START GAME ------- */

initBoard(boardState);
displayBoard(boardState);
// displayInternal(boardState);

aggregateBoard.style.display = 'none';
// displayInternal(boardState);