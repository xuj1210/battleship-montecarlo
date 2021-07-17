let boardNode = document.getElementById('main-board');
let hidden = document.getElementById('internal-board');
let status = document.getElementById('game-status');
let turnCount = document.getElementById('turn-count');
let resetBtn = document.getElementById('reset');
let startAIBtn = document.getElementById('start-ai');
let aggregateBoard = document.getElementById('aggregate-board');
let statsBar = document.getElementById('stats');

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

const SLEEPTIME = 400;

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

let shipAt = (board, index) => {
  return invalidSpot.has(board[index]);
}

let randomInt = (range) => {
  return Math.floor(Math.random() * range);
}

let getIdx = (length, orientation) => {
  let column, row;
  if (orientation === VERTICAL) {
    column = randomInt(COLUMNS - 1) + 1;
    row = randomInt(ROWS - length) + 1;
  } else {
    column = randomInt(COLUMNS - length) + 1;
    row = randomInt(ROWS - 1) + 1;
  }

  let index = row * COLUMNS + column;
  // console.log(`(${column}, ${row})`)
  return index;
}

// let placedFirstSub = false;

let shipLocations = [-1, -1, [], [], [], [], []];

let placeShip = (length, board, secondSub, saveLocations, locationArr) => {

  let placeable = false;
  let orientation = randomInt(2);
  let originIdx = getIdx(length, orientation);
  let index = originIdx;
  let maxTries = 100;
  if (orientation === HORIZONTAL) {
    // place horizontal
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
        ++index;
      }
    }

  } else {
    // place vertical
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
        index += COLUMNS;
      }
    }
  }
  if (placeable) {
    let ship = length;
    if (ship === 3 && secondSub) {
      ship = 6;
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




}

let initBoard = (board) => {
  board.internal.length = 0;
  board.visible.length = 0;
  for (let i = 0; i < numTiles; ++i) {
    board.internal.push(DEFAULT);
    board.visible.push(DEFAULT);
  }
  // make legends
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

let boardState = {
  "internal": [],
  "visible": []
}

let checkWin = () => {
  // return (shipHits.carrier.hits === 5) && (shipHits.battleship.hits === 4) && (shipHits.submarine1.hits === 3) && (shipHits.submarine2.hits === 3) && (shipHits.destroyer.hits === 2);
  return shipHits.carrier.sunk && shipHits.battleship.sunk && shipHits.submarine1.sunk && shipHits.submarine2.sunk && shipHits.destroyer.sunk;
}

let checkDestroy = (ship) => {
  let tiles = boardNode.childNodes;
  for (const index of shipLocations[ship]) {
    // for (const className of tiles[index].classList) {
    //   if (className === 'default') {
    //     return false;
    //   }
    // }
    if (boardState.visible[index] == DEFAULT) {
      return false;
    }
  }
  // destroyed
  console.log('destroyed');

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
    won = true;
    boardNode.style.background = "#11ab68"
    console.log('DONE');
  };
  return true;

}

let handleMove = (event) => {
  let clickedItem = event.srcElement;
  clickedItem.removeEventListener('click', handleMove);
  clickedItem.classList.remove('default');
  let index = +clickedItem.innerText;
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

}

let displayBoard = (board) => {
  let boardLength = board.visible.length;
  let temp = document.createElement('div');
  boardNode.appendChild(temp);
  for (let i = 1; i < 11; ++i) {
    let item = document.createElement('div');
    item.classList.add('board-item');
    item.innerText = board.visible[i]
    boardNode.appendChild(item);
  }
  for (let i = 11; i < boardLength; ++i) {
    let item = document.createElement('div');
    item.classList.add('board-item');
    item.innerText = i;
    if (board.visible[i] === DEFAULT) {
      item.classList.add('default', 'game-item');
      item.addEventListener('click', handleMove);
    } else {
      item.innerText = board.visible[i];
    }
    boardNode.appendChild(item);
  }

}

let displayInternal = (board) => {
  let length = hidden.childNodes.length;
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

status.innerText = 'INITIALIZING';
initBoard(boardState);
displayBoard(boardState);
// displayInternal(boardState);

status.innerText = 'READY';

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
};



let randomMoves = async () => {
  let tried = new Set();
  let children = boardNode.childNodes;
  while (!won) {
    console.log('moving');
    let index = randomInt(numTiles);
    while (tried.has(index)) {
      index = randomInt(numTiles);
    }
    tried.add(index);
    children[index].click();
    if (boardState.visible[index] === HIT) {
      seekDestroy(index, children);
    }
    await sleep(SLEEPTIME);
  }
}


let heatMapColorforValue = (value) => {
  let h = (1.0 - value) * 240;
  return "hsl(" + h + ", 100%, 50%)";
}


let generatePossible = (gameBoard) => {
  // clear gameboard
  while (gameBoard.length) {
    gameBoard.pop();
  }

  for (let i = 0; i < numTiles; ++i) {
    gameBoard.push(boardState.visible[i]);
  }
  if (!shipHits.carrier.sunk) {
    placeShip(CARRIER, gameBoard, false, false, []);
  }
  if (!shipHits.battleship.sunk) {
    placeShip(BATTLESHIP, gameBoard, false, false, []);
  }
  if (!shipHits.submarine1.sunk) {
    placeShip(SUBMARINE1, gameBoard, false, false, []);
  }
  if (!shipHits.submarine2.sunk) {
    placeShip(SUBMARINE1, gameBoard, true, false, []);
  }
  if (!shipHits.destroyer.sunk) {
    placeShip(DESTROYER, gameBoard, false, false, []);
  }
  return gameBoard;
}


let aggregateSets = (board) => {
  let prevAggregateBoard = aggregateBoard.childNodes;
  let prevLen = prevAggregateBoard.length;
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
    // console.log('before-possible');
    let possible = generatePossible(tempArr);
    // console.log('after possible');

    for (let j = 0; j < numTiles; ++j) {
      if (possible[j] && (possible[j] !== MISS && possible[j] !== DESTROYED)) {
        ++aggregate[j];
      }
    }
  }
  console.log('after tests');
  let temp = document.createElement('div');
  temp.classList.add('board-item');
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
  for (let i = 11; i < numTiles; i += 11) {
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
  // console.log(maxIdx, max);
  return maxIdx;

}

let lettersNumbers = new Set();
for (let i = 1; i <= 10; ++i) {
  lettersNumbers.add(i);
}

for (let i = 65; i <= 74; ++i) {
  invalidSpot.add(String.fromCharCode(i));
};

let placeShipFromTo = (length, board, secondSub, idx, direction) => {
  // let orientation = randomInt(4);
  let placed = false;
  let curIdx = idx;


  // let increment;
  // switch (direction) {
  //   case UP:
  //     increment = UP;
  //     break;
  //   case DOWN:
  //     increment = DOWN;
  //     break;
  //   case LEFT:
  //     increment = LEFT;
  //     break;
  //   default:
  //     increment = RIGHT;
  // }
  // if (direction === UP) {
  //   // place UPWARDS
  //   increment = UP;
  // } else if (direction === DOWN) {
  //   // place DOWNWARDS
  //   increment = DOWN;
  // } else if (direction === LEFT) {
  //   increment = LEFT;
  // } else {
  //   increment = RIGHT;
  // }
  for (let i = 0; i < length; ++i) {
    curIdx += direction;
    if (!inRange(curIdx) || lettersNumbers.has(board[curIdx]) || board[curIdx] === MISS || board[curIdx] === DESTROYED) {
      return;
    }
    //  else if (i === (length - 1)) {
    //   placeable = true;
    // }
  }
  // if (placeable) {
  let ship = length;
  if (ship === 3 && secondSub) {
    ship = SUBMARINE2;
  }
  curIdx = idx;
  for (let i = 0; i < length; ++i) {
    board[curIdx] = ship;
    curIdx += direction;
  }
  // }
  return;
}

let generatePossibleAt = (idx, direction, prevCorrect) => {
  let spots = [];
  for (let i = 0; i < numTiles; ++i) {
    spots.push(boardState.visible[i]);
  }
  let remainingShips = [];

  if (!shipHits.carrier.sunk && (prevCorrect <= CARRIER)) {
    remainingShips.push(CARRIER);
  }
  if (!shipHits.battleship.sunk && (prevCorrect < BATTLESHIP)) {
    remainingShips.push(BATTLESHIP);
  }
  if (!shipHits.submarine1.sunk && (prevCorrect < SUBMARINE1)) {
    remainingShips.push(SUBMARINE1);
  }
  if (!shipHits.submarine2.sunk && (prevCorrect < SUBMARINE1)) {
    remainingShips.push(SUBMARINE2);
  }
  if (!shipHits.destroyer.sunk && (prevCorrect < DESTROYER)) {
    remainingShips.push(DESTROYER);
  }

  let randomShip = remainingShips[randomInt(remainingShips.length)];
  let secondSub = false;
  if (randomShip === SUBMARINE2) {
    secondSub = true;
    randomShip = SUBMARINE1;
  }
  placeShipFromTo(randomShip - prevCorrect, spots, secondSub, idx, direction);
  placeShipFromTo(randomShip, spots, secondSub, idx, direction * -1);
  return spots;
}

let aggregateOnHit = (hitIdx, direction, prevCorrect) => {
  let prevAggregateBoard = aggregateBoard.childNodes;
  let prevLen = prevAggregateBoard.length;
  for (let i = 0; i < prevLen; ++i) {
    prevAggregateBoard[0].remove();
  }

  let aggregate = [];
  for (let i = 0; i < numTiles; ++i) {
    aggregate.push(0);
  }
  const numTests = 1000;
  for (let i = 0; i < numTests; ++i) {
    let possible = generatePossibleAt(hitIdx, direction, prevCorrect);
    for (let j = 0; j < numTiles; ++j) {
      if (possible[j] && (/*possible[j] !== HIT && */possible[j] !== MISS && possible[j] !== DESTROYED)) {
        ++aggregate[j];
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
  for (let i = 11; i < numTiles; i += 11) {
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

let inRange = (idx) => {
  return (idx >= 12) && (idx <= 120);
}

let tryDirection = async (curIdx, increment, tiles, correctCount) => {
  curIdx += increment;
  if (inRange(curIdx)) {
    await sleep(SLEEPTIME);
    tiles[curIdx].click();
    // aggregateSets(boardState);

    while (boardState.visible[curIdx] === HIT) {
      ++correctCount;
      aggregateOnHit(curIdx, increment, correctCount);


      curIdx += increment;
      await sleep(SLEEPTIME);
      if (inRange(curIdx)) {
        tiles[curIdx].click();
      } else {
        return correctCount;
      }

    }
    // aggregateSets(boardState);
    return correctCount;
  } else {

    return 0;
  }
}

let seekDestroy = async (startingIdx, tiles) => {

  let curIdx = startingIdx;
  let correctCount = 1;

  if (inRange(startingIdx + RIGHT) && !shipAt(startingIdx + RIGHT)) {
    await tryDirection(curIdx, RIGHT, tiles, correctCount).then(result => { correctCount = result });
    curIdx = startingIdx;
    if (boardState.visible[startingIdx] === DESTROYED) {
      return;
    }
  }

  console.log(correctCount);

  if (inRange(startingIdx + LEFT) && !shipAt(startingIdx + LEFT)) {
    await tryDirection(curIdx, LEFT, tiles, correctCount).then(result => { correctCount = result });
    curIdx = startingIdx;
    if (boardState.visible[startingIdx] === DESTROYED) {
      return;
    }
  }

  console.log(correctCount);

  if (inRange(startingIdx + UP) && !shipAt(startingIdx + UP)) {
    await tryDirection(curIdx, UP, tiles, correctCount).then(result => { correctCount = result });
    curIdx = startingIdx;
    if (boardState.visible[startingIdx] === DESTROYED) {
      return;
    }
  }

  console.log(correctCount);

  if (inRange(startingIdx + DOWN) && !shipAt(startingIdx + DOWN)) {
    await tryDirection(curIdx, DOWN, tiles, correctCount).then(result => { correctCount = result });
    curIdx = startingIdx;
    if (boardState.visible[startingIdx] === DESTROYED) {
      return;
    }
  }

  console.log(correctCount);

}

let aiMoves = async () => {
  let tiles = boardNode.childNodes;
  let idx = aggregateSets(boardState);

  while (!won) {

    await sleep(SLEEPTIME);
    tiles[idx].click();

    if (checkWin()) {

      return;
    }

    if (boardState.visible[idx] === HIT) {

      await seekDestroy(idx, tiles);

    }

    idx = aggregateSets(boardState);
    console.log(idx);

  }
}



let resetForAi = (board) => {
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
  won = false;
  shipHits = {
    carrier: { hits: 0, sunk: false },
    battleship: { hits: 0, sunk: false },
    submarine1: { hits: 0, sunk: false },
    submarine2: { hits: 0, sunk: false },
    destroyer: { hits: 0, sunk: false }
  };
  let tiles = boardNode.childNodes;
  let length = tiles.length;
  for (let i = 0; i < length; ++i) {
    tiles[0].remove();
  }
  boardNode.style.background = "#ddd";
  displayBoard(boardState);
}




resetBtn.onclick = () => {
  let playerTurns = turnCount.innerText;
  let savePlayer = document.createElement('span');
  savePlayer.innerText = `Your amount of turns: ${playerTurns}`;
  statsBar.appendChild(savePlayer);
  resetForAi(boardState);

  
}

startAIBtn.onclick = async () => {
  await aiMoves();
  let aiTurns = turnCount.innerText;
  let saveAI = document.createElement('span');
  saveAI.innerText = `AI's amount of turns: ${aiTurns}`;
  statsBar.appendChild(saveAI);
}

// displayInternal(boardState);