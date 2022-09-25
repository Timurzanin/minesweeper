const DEFAULT_SMILEY = '😊'
const DEAD_SMILEY = '🥴'
const WINNER_SMILEY = '😎'
const HINT = '💡'
const MINE = '💣'
const FLAG = '🚩'
const EMPTY = ' '

var gBoard
var gMinesPos = []


var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    isHintMode: false,
    isSafeMode: false,
    isTimerOn: false,
    level: { SIZE: 4, MINES: 2 },
    livesCount: 3,
    safeClicksCount: 3,
    hintsCount: 3,
    flaggedMinesCount: 0
}
var gTimerInterval
var gCurrHintId

function initGame() {
    gBoard = buildBoard(gGame.level.SIZE, gGame.level.MINES)
    gGame.flaggedMinesCount = 0
    renderBoard(gBoard, '.board-container')
    gGame.markedCount = 0
    gGame.shownCount = 0
    gGame.secsPassed = 0
    gGame.livesCount = 3
    var elLivesSpan = document.querySelector('.lives span')
    elLivesSpan.innerText = gGame.livesCount
    gMinesPos = []
    gGame.isTimerOn = false
    renderSmiley(DEFAULT_SMILEY)
    gGame.hintsCount = 3
    gCurrHintId = null
    gGame.isHintMode = false
    renderHints()
    gGame.safeClicksCount = 3
    var elSafeClickBtnTxt = document.querySelector('.btn span span')
    elSafeClickBtnTxt.innerText = `${gGame.safeClicksCount}`
    gGame.isSafeMode = false
    renderBestScore()
    gGame.isOn = true
}

function resetGame() {
    gGame.isOn = !gGame.isOn
    clearInterval(gTimerInterval)
    if (gTimerInterval) gTimerInterval = null
    var elTimerSpan = document.querySelector('.timer span')
    elTimerSpan.innerText = '00:00:00'
    var elGameOverModal = document.querySelector('.finish-modal')
    elGameOverModal.style.display = 'none'
    var elModalTxt = elGameOverModal.querySelector('p')
    elModalTxt.innerText = ''
    gMinesPos = []
    gGame.secsPassed = 0
    var elSafeClickBtn = document.querySelector('.btn')
    elSafeClickBtn.style.opacity = '1'
    initGame()
}

function buildBoard(size) {
    var board = []
    for (var i = 0; i < size; i++) {
        board.push([])
        for (var j = 0; j < size; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false,
            }
        }
    }
    return board
}

function renderBoard(board, selector) {
    var strHTML = `<table oncontextmenu="return false" border="0"><tbody>`
    for (var i = 0; i < board.length; i++) {
        strHTML += `<tr>`
        for (var j = 0; j < board[0].length; j++) {
            var className = `cell cell-${i}-${j}`
            strHTML += `<td class="${className}" onmousedown="cellClicked(this,${i},${j},event)"></td>`
        }
        strHTML += `<tr>`
    }
    strHTML += `</tbody></table>`
    var elContainer = document.querySelector(selector)
    elContainer.innerHTML = strHTML
}

// Shows The board in the developer tools for debugging
function printBoard(board) {
    var printedBoard = []
    for (var i = 0; i < board.length; i++) {
        printedBoard[i] = []
        for (var j = 0; j < board.length; j++) {
            var currCell = board[i][j]
            var isMine = currCell.isMine ? true : false
            printedBoard[i][j] = isMine ? MINE : currCell.minesAroundCount
        }
    }
    console.table(printedBoard)
}

function renderCell(pos, value) {
    var selector = getClassName(pos)
    var elCell = document.querySelector(`.${selector}`)
    elCell.innerHTML = value
}

function getClassName(pos) {
    var cellClass = 'cell-' + pos.i + '-' + pos.j
    return cellClass
}

// The maximum is inclusive and the minimum is inclusive
function getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1) + min)
}
'use strict'


function cellClicked(elCell, i, j, event) {
    if (!gGame.isOn) return
    if (gBoard[i][j].isShown) return
    if (!gGame.isTimerOn) {
        startTimer(Date.now())
        gGame.isTimerOn = !gGame.isTimerOn
    }

    if (event.button === 2) {
        if (gGame.isHintMode)
            handleElIndicator(
                'visible',
                'red',
                'CANNOT DO THIS\nYOU ARE ON HINT MODE'
            )
        else handleRightClick(i, j)
        return
    }
    if (gBoard[i][j].isMarked) return
    if (gGame.isHintMode) {
        cellClickedHintMode(i, j)
        return
    }
    var cellPos = { i, j }
        // First click
    if (!gGame.shownCount) {
        // Model:
        gBoard[i][j].isShown = !gBoard[i][j].isShown
            // DOM:
        renderCell(cellPos, EMPTY)
        elCell.classList.toggle('revealed')
        gGame.shownCount++
            // First click is never a mine
            gBoard = setMinesOnBoard(gBoard, gGame.level.MINES)
        setMinesNegsCount(gBoard)
        expandShown(gBoard, i, j)
        printBoard(gBoard)
        return
    }
    if (gBoard[i][j].isMine) {
        if (!gGame.livesCount) gameOver()
            // Model:
        gBoard[i][j].isShown = !gBoard[i][j].isShown
            // DOM:
        renderCell(cellPos, MINE)
        elCell.classList.toggle('revealed')
        elCell.classList.toggle('mine')
        gGame.shownCount++
            updateLives()
        return
    }
    var cellNegsCount = gBoard[i][j].minesAroundCount
    var cellVal = cellNegsCount > 0 ? cellNegsCount : EMPTY
    if (cellNegsCount) {
        // Model:
        gBoard[i][j].isShown = !gBoard[i][j].isShown
            // DOM:
        renderCell(cellPos, cellVal)
        elCell.classList.toggle('revealed')
        gGame.shownCount++
    } else {
        expandShown(gBoard, i, j)
    }
    checkVictory()
}

function handleRightClick(i, j) {
    cellMarked(i, j)
    var currCell = gBoard[i][j]
    gGame.markedCount = currCell.isMarked ?
        gGame.markedCount + 1 :
        gGame.markedCount - 1
    if (currCell.isMine) {
        gGame.flaggedMinesCount = currCell.isMarked ?
            gGame.flaggedMinesCount + 1 :
            gGame.flaggedMinesCount - 1
    }
    checkVictory()
}

function cellMarked(i, j) {
    var pos = { i, j }
    var currCell = gBoard[i][j]
    if (!currCell.isMarked) renderCell(pos, FLAG)
    else renderCell(pos, '')
    currCell.isMarked = !gBoard[i][j].isMarked
}

function expandShown(board, cellI, cellJ) {
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= board[i].length) continue
            if (!board[i][j].isMarked &&
                !board[i][j].isShown &&
                !board[i][j].isMine
            ) {
                board[i][j].isShown = !board[i][j].isShown
                var className = getClassName({ i, j })
                var elCell = document.querySelector(`.${className}`)
                elCell.classList.toggle('revealed')
                gGame.shownCount++
                    var pos = { i, j }
                        // Model:
                var cellNegsCount = board[i][j].minesAroundCount
                var cellVal = cellNegsCount > 0 ? cellNegsCount : EMPTY
                    // DOM:
                renderCell(pos, cellVal)
                if (!cellNegsCount) {
                    expandShown(board, pos.i, pos.j)
                }
            }
        }
    }
}

function setMinesOnBoard(board, minesCount) {
    for (var i = 0; i < minesCount; i++) {
        var pos = getEmptyLocations(board)
        gMinesPos.push(pos)
        var cell = board[pos.i][pos.j]
        cell.isMine = !cell.isMine
        if (cell.isMarked && cell.isMine) gGame.flaggedMinesCount++
    }
    return board
}

function getEmptyLocations(board) {
    var nonMineCells = []
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (!board[i][j].isMine && !board[i][j].isShown)
                nonMineCells.push({ i: i, j: j })
        }
    }
    if (!nonMineCells.length) return false
    var randIdx = getRandomInt(0, nonMineCells.length - 1)
    var randCellPos = nonMineCells[randIdx]
    return randCellPos
}

function setMinesNegsCount(board) {
    var negsCount = 0
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            negsCount = countMineNegs(i, j, board)
            if (board[i][j].isShown) continue
            board[i][j].minesAroundCount = negsCount
        }
    }
}

function countMineNegs(cellI, cellJ, board) {
    var mineNegsCount = 0
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue
            if (j < 0 || j >= board[i].length) continue
            if (board[i][j].isMine) mineNegsCount++
        }
    }
    return mineNegsCount
}

function cellClickedHintMode(i, j) {
    gGame.isOn = !gGame.isOn
    var hintCells = getNegsPos(i, j, gBoard)
    for (var i = 0; i < hintCells.length; i++) {
        var cellPos = hintCells[i]
        var selector = '.' + getClassName(cellPos)
        var elCurrCell = document.querySelector(selector)
        var currCell = gBoard[cellPos.i][cellPos.j]
        if (currCell.isMine) {
            renderCell(cellPos, MINE)
            elCurrCell.classList.toggle('mine')
        }
        if (!currCell.isMine) {
            if (currCell.minesAroundCount > 0)
                renderCell(cellPos, currCell.minesAroundCount)
            else renderCell(cellPos, EMPTY)
        }
        elCurrCell.classList.toggle('revealed')
    }
    setTimeout(() => {
        for (var i = 0; i < hintCells.length; i++) {
            var cellPos = hintCells[i]
            var selector = '.' + getClassName(cellPos)
            var elCurrCell = document.querySelector(selector)
            var currCell = gBoard[cellPos.i][cellPos.j]
            renderCell(cellPos, EMPTY)
            if (currCell.isMine) elCurrCell.classList.toggle('mine')
            elCurrCell.classList.toggle('revealed')
            gCurrHintId = null
            gGame.isHintMode = false
        }
        gGame.isOn = !gGame.isOn
    }, 1000)

    var elCurrHint = document.querySelector(`[data-hint="${gCurrHintId}"]`)
    elCurrHint.innerText = ''
    handleElIndicator('hidden', 'red', '')
    gGame.isHintMode = !gGame.isHintMode
}

function getNegsPos(cellI, cellJ, board) {
    var negsPosToShow = [] // cells we want to show for a second
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            // if (i === cellI && j === cellJ) continue
            if (j < 0 || j >= board[i].length) continue
            if (!board[i][j].isShown && !board[i][j].isMarked) {
                negsPosToShow.push({ i, j })
            }
        }
    }
    return negsPosToShow
}

function handleHintMode(elHint) {
    if (gGame.isHintMode && elHint.dataset.hint !== gCurrHintId) return
    if (!gGame.shownCount) {
        handleElIndicator(
            'visible',
            'red',
            'YOU CAN ONLY USE HINT\n AFTER FIRST LEFT CLICK ON BOARD'
        )
        gGame.isOn = !gGame.isOn
        setTimeout(() => {
            handleElIndicator('hidden', 'red', '')
            gGame.isOn = !gGame.isOn
        }, 1000)
        return
    }
    if (!gGame.isHintMode && gCurrHintId === null) {
        gCurrHintId = elHint.dataset.hint
        gGame.isHintMode = !gGame.isHintMode
            // elHint.style.transform = 'rotate(90deg)'
        handleElIndicator('visible', 'yellow', 'HINT MODE: ON')
        return
    }
    if (gGame.isHintMode && gCurrHintId === elHint.dataset.hint) {
        gCurrHintId = null
        gGame.isHintMode = !gGame.isHintMode
            // elHint.style.transform = 'rotate(0deg)'
        handleElIndicator('hidden', 'red', '')
        return
    }
}

function safeClick() {
    if (gGame.isSafeMode || !gGame.safeClicksCount) return
    if (!gGame.shownCount) {
        handleElIndicator(
            'visible',
            'red',
            'YOU CAN ONLY USE SAFE CLICK AFTER FIRST CLICK'
        )
        gGame.isOn = !gGame.isOn
        setTimeout(() => {
            handleElIndicator('hidden', 'red', '')
            gGame.isOn = !gGame.isOn
        }, 1000)
        return
    }
    var cellPos = getEmptyLocations(gBoard)
    if (!cellPos) {
        var elSafeClickBtn = document.querySelector('.btn')
        elSafeClickBtn.style.opacity = '0.3'
        handleElIndicator('visible', 'red', 'NO SAFE CELLS AVAILABLE')
        return
    }
    gGame.isOn = !gGame.isOn
    gGame.safeClicksCount--
        var elSafeClickBtnTxt = document.querySelector('.btn span span')
    elSafeClickBtnTxt.innerText = `${gGame.safeClicksCount}`
    gGame.isSafeMode = !gGame.isSafeMode
    var selector = '.' + getClassName(cellPos)
    var elCurrCell = document.querySelector(selector)
    elCurrCell.classList.toggle('safe')
    setTimeout(() => {
        elCurrCell.classList.toggle('safe')
        gGame.isSafeMode = !gGame.isSafeMode
        gGame.isOn = !gGame.isOn
    }, 1000)
    if (!gGame.safeClicksCount) {
        var elSafeClickBtn = document.querySelector('.btn')
        elSafeClickBtn.style.opacity = '0.3'
    }
}

function setGameMode(elMode) {
    switch (elMode.dataset.level) {
        case 'Beginner':
            gGame.level.SIZE = 4
            gGame.level.MINES = 2
            break
        case 'Medium':
            gGame.level.SIZE = 8
            gGame.level.MINES = 12
            break
        case 'Expert':
            gGame.level.SIZE = 12
            gGame.level.MINES = 30
            break
        default:
            gGame.level.SIZE = 4
            gGame.level.MINES = 2
            break
    }

    resetGame()
}

function gameOver() {
    for (var i = 0; i < gMinesPos.length; i++) {
        var currMinePos = gMinesPos[i]
            // Model:
        gBoard[currMinePos.i][currMinePos.j].isShown = true
            // DOM:
        renderCell(currMinePos, MINE)
    }
    gMinesPos = []
    openFinishModal(false)
}

function checkVictory() {
    var totalCells = gGame.level.SIZE ** 2
    var playedCellsCount = gGame.shownCount + gGame.flaggedMinesCount
    var isWinner = playedCellsCount === totalCells ? true : false
    if (!isWinner) return
    openFinishModal(isWinner)
    handleLocalStorage()
}

function openFinishModal(isWin) {
    gGame.isOn = !gGame.isOn
    clearInterval(gTimerInterval)
    if (gTimerInterval) gTimerInterval = null
    var elGameOverModal = document.querySelector('.finish-modal')
    elGameOverModal.style.display = 'block'
    var elModalTxt = elGameOverModal.querySelector('p')
    elModalTxt.innerText = isWin ? 'VICTORY' : 'GAMEOVER'
    if (isWin) renderSmiley(WINNER_SMILEY)
    else renderSmiley(DEAD_SMILEY)
}

function handleLocalStorage() {
    var highestScore = +localStorage.getItem(`bestScore-board-${gGame.level.SIZE}`)
    if (highestScore === 0) {
        localStorage.setItem(`bestScore-board-${gGame.level.SIZE}`, gGame.secsPassed)
    } else {
        if (gGame.secsPassed < highestScore) {
            localStorage.setItem(`bestScore-board-${gGame.level.SIZE}`, gGame.secsPassed)
        }
    }
}

function updateLives() {
    if (!gGame.livesCount) return
    gGame.livesCount--
        renderSmiley(DEAD_SMILEY)
    var elLivesSpan = document.querySelector('.lives span')
    elLivesSpan.innerText = gGame.livesCount
    handleElIndicator('visible', 'red', 'YOU STEPPED ON A MINE!')
    gGame.isOn = !gGame.isOn
    setTimeout(() => {
        handleElIndicator('hidden', 'red', '')
        renderSmiley(DEFAULT_SMILEY)
        gGame.isOn = !gGame.isOn
        checkVictory()
    }, 1000)
}

function handleElIndicator(visibility, color, msg) {
    var elIndicator = document.querySelector('.indicator')
    elIndicator.style.visibility = visibility
    var elIndicatorSpan = elIndicator.querySelector('span')
    elIndicatorSpan.innerText = msg
    elIndicatorSpan.style.color = color
}

function startTimer(startTime) {
    var elTimerSpan = document.querySelector('.timer span')
    var totalSecs = 0
    var time = 0
    gTimerInterval = setInterval(() => {
        totalSecs = Math.floor((Date.now() - startTime) / 1000)
        time = getTime(totalSecs)
        elTimerSpan.innerHTML = time
        gGame.secsPassed++
    }, 1000)
}

function renderBestScore() {
    var highestScore = +localStorage.getItem(`bestScore-board-${gGame.level.SIZE}`)
    if (!highestScore) {
        localStorage.setItem(`bestScore-board-${gGame.level.SIZE}`, gGame.secsPassed)
    }
    var time = getTime(highestScore)
    var elBestScoreSpan = document.querySelector('.best-score span')
    elBestScoreSpan.innerHTML = time
}

function getTime(totalSecs) {
    var hour = Math.floor(totalSecs / 3600).toString()
    var minute = Math.floor((totalSecs - hour * 3600) / 60).toString()
    var seconds = (totalSecs - (hour * 3600 + minute * 60)).toString()
    return `
  ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${seconds.padStart(2, '0')}`
}

function renderHints() {
    var elHints = document.querySelector('.hints')
    var strHTML = ''
    for (var i = 0; i < gGame.hintsCount; i++) {
        strHTML += `<span data-hint="${i}" onclick="handleHintMode(this)">${HINT}</span>`
    }
    elHints.innerHTML = strHTML
}

function renderSmiley(smiley) {
    var elGameController = document.querySelector('.game-controller')
    elGameController.innerHTML = `<span class="btn smiley" onclick="resetGame()">${smiley}</span>`
}



var checkbox = document.querySelector('input[name=mode]');

checkbox.addEventListener('change', function() {
    if (this.checked) {
        trans()
        document.documentElement.setAttribute('data-theme', 'dark')
    } else {
        trans()
        document.documentElement.setAttribute('data-theme', 'light')
    }
})

var trans = () => {
    document.documentElement.classList.add('transition');
    window.setTimeout(() => {
        document.documentElement.classList.remove('transition');
    }, 1000)
}
