//Global vars
const BOMB = '💣';
const FLAG = '🚩';
var gBoard;
var gCount;
var gNegs;
var gStartTime;
var gLivesLeft;
var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
};
var gIntervalID;
var gClickCounter;
var gLevel = {
    size: 6,
    mines: 4,
};

//Innitiate
function init() {
    gGame.isOn = true;
    gBoard = createTable(gLevel.size);
    gClickCounter = 0;
    gLivesLeft = 2;
    renderLives();
    gGame = {
        isOn: true,
        shownCount: 0,
        markedCount: 0,
    };
    renderTable();
}

//Create the table to the Model
function createTable(size) {
    var board = [];

    for (var i = 0; i < size; i++) {
        board[i] = [];
        for (var j = 0; j < size; j++) {
            var cell = {
                minesAroundCount: 4,
                isMine: false,
                isMarked: false,
                isShown: false,
            };
            board[i][j] = cell;
        }
    }

    return board;
}

//Set the game difficulty
function setDifficulty(size, mines) {
    clearInterval(gIntervalID);
    gLevel.size = size;
    gLevel.mines = mines;

    renderTable();
    init();
}

//creating the mines
function getRandomMine(num, i, j) {
    var mines = 0;
    while (mines < num) {
        var celli = getRandomInt(i, gBoard.length);
        var cellj = getRandomInt(i, gBoard[0].length);
        if (celli === i && cellj === j) continue;
        gBoard[celli][cellj].isMine = true;
        mines++;
    }
}

//flagging the possible mine - need to unflag
function cellFlagged(elCell, e, i, j) {
    e.preventDefault();
    if (!gGame.isOn) return;
    var cell = gBoard[i][j];

    if (cell.isMarked === false) {
        cell.isMarked = true;
        elCell.innerText = FLAG;
        console.log('cell.isMarked:', cell.isMarked);
    } else {
        cell.isMarked = false;
        elCell.innerText = '';
    }
    if (cell.isMarked && cell.isMine) {
        gGame.markedCount++;
        console.log('gGame.markedCount:', gGame.markedCount);
    }
    if (gGame.shownCount - gLevel.mines && gGame.markedCount === gLevel.mines) {
        gameWon();
    }
}

//Click cells to reveal + placing mines for the first time
function cellClicked(elCell, i, j) {
    if (!gGame.isOn) return;
    if (gClickCounter === 0) {
        getRandomMine(gLevel.mines, i, j);
        startTimeInterval();
        gClickCounter++;
    }
    var cell = gBoard[i][j];
    console.log('cell:', cell);

    if (cell.isShown) return;
    if (!cell.isShown) {
        cell.isShown = true;
        elCell.classList.add('shown');
        gGame.shownCount++;
        console.log('gGame.shownCount:', gGame.shownCount);
    }
    if (cell.isMine === true) {
        gLivesLeft--;
        var elLives = document.querySelector('.lives');
        elLives.innerHTML = gLivesLeft;
        elCell.innerText = BOMB;
        if (gLivesLeft === 0) {
            gameOver();
        }
    } else {
        var negs = countNegs(i, j);
        elCell.innerText = negs;
        if (negs === 0) {
            checksRight(i, j);
            checksLeft(i, j);
            checksUp(i, j);

        }
        if (gGame.shownCount - gLevel.mines === 0) {
            gameWon();
        }
    }
}

function expandShown(i, j) {
    // loop through neighbours and change their isShown to true
    // if one of them has 0 mines around call this function again
    var cell = gBoard[i][j];
    var elCell = document.querySelector(`.cell-${i}-${j}`);
    if (cell.isShown) return;
    cell.isShown = true;
    gGame.shownCount++;
    var negsCount = countNegs(i, j);
    cell.minesAroundCount = negsCount;
    elCell.innerText = negsCount;
    if (negsCount === 0) {
        checksRight(i, j);
        checksLeft(i, j);
        checksUp(i, j);
    }
}
//counting the number of mines around the cell


function checksRight(i, j) {
    if (j < gBoard.length - 1) {
        var uCell = document.getElementById(gBoard.length * i + (j + 1));
        if (!gBoard[i][j + 1].isShown && !gBoard[i][j + 1].isMarked) {
            cellClicked(uCell, i, j + 1);
        }
    }
}

function checksLeft(i, j) {
    if (j > 0) {
        var uCell = document.getElementById(gBoard.length * i + (j - 1));
        if (!gBoard[i][j - 1].isShown && !gBoard[i][j - 1].isMarked) {
            cellClicked(uCell, i, j - 1);
        }
    }
}

function checksUp(i, j) {
    if (i > 0) {
        var uCell = document.getElementById(gBoard.length * (i - 1) + j);
        if (!gBoard[i - 1][j].isShown && !gBoard[i - 1][j].isMarked) {
            cellClicked(uCell, i - 1, j);
        }
    }
}

function renderRestartButton(value) {
    var elLife = document.querySelector('.restart');
    elLife.innerText = value;
}

function restartGame() {
    renderRestartButton('😀');
    init();
    renderTable();
}

function renderLives() {
    var elCell = document.querySelector('.lives');
    elCell.innerHTML = gLivesLeft;
}

//render the table updating the dom
function renderTable() {
    var strHTML = '';
    for (var i = 0; i < gBoard.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < gBoard[0].length; j++) {
            // var cell = gBoard[i][j];
            var className = 'cell';
            var cellId = gBoard.length * i + j;
            strHTML += `<td class="${className}" id="${cellId}" 
        oncontextmenu="cellFlagged(this, event, ${i}, ${j})"
        onclick="cellClicked(this, ${i}, ${j})"></td>`;
        }
        strHTML += '</tr>';
    }
    var elBoard = document.querySelector('.board');
    elBoard.innerHTML = strHTML;
}

//counting neighbors
function countNegs(cellI, cellJ) {
    var negsCount = 0;
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i > gBoard.length - 1) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j > gBoard[i].length - 1) continue;
            if (i === cellI && j === cellJ) continue;

            if (gBoard[i][j].isMine) {
                negsCount++;
            }
            if (negsCount === 0) {}
        }
    }
    return negsCount;
}

// game is over
function revealAllMines() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].isMine) {
                var elCell = document.getElementById(gBoard.length * i + j);
                elCell.innerText = BOMB;
            }
        }
    }
}

function revealAllCells() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var cell = gBoard[i][j];
            if (!cell.isMine) {
                var elCell = document.getElementById(gBoard.length * i + j);
                elCell.classList.add('shown');
                var negs = countNegs(i, j);
                elCell.innerText = negs;
            }
        }
    }
}

function gameOver() {
    gGame.isOn = false;
    renderRestartButton('😖');
    clearInterval(gIntervalID);
    revealAllMines()
    revealAllCells()
}

function gameWon() {
    gGame.isOn = false;
    console.log('GAME won!');
    renderRestartButton('😁');
    clearInterval(gIntervalID);
}

//timer
function startTimeInterval() {
    gStartTime = Date.now();
    gIntervalID = setInterval(function() {
        var elTimer = document.querySelector('.time');
        var miliSecs = Date.now() - gStartTime;
        elTimer.innerText = (miliSecs / 1000).toFixed(1);
    }, 10);
}

//random number
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}