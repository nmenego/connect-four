/**
 * Just a simple MeteorJS app.
 * @author NMEnego 2016
 */
import {
    Template
} from "meteor/templating";
import {
    ReactiveVar
} from "meteor/reactive-var";

import "./main.html";

// container for state table
var STATE_TABLE = null;
var VS_HUMAN = true;
var MAX_DEPTH = 5;

// constants
const RED = "red";
const BLACK = "black";
const WHITE = "white";
const ONGOING = "Ongoing...";
const MAX_X = 7;
const MAX_Y = 6;
const IN_A_ROW = 4;
const WON = "won";
const DRAW = "draw";

// meteorjs helpers
Template.hello.onCreated(function helloOnCreated() {
    // player starts with red
    this.player = new ReactiveVar(RED);
    this.won = new ReactiveVar(ONGOING);
    this.process = new ReactiveVar(true);
});

// meteorjs helpers
Template.hello.helpers({
    player() {
        return Template.instance().player.get();
    },
    won() {
        return Template.instance().won.get();
    },
    isProcessing() {
        if (Template.instance().process.get() == true) {
            showCanvas(false);
            return true;
        } else {
            showCanvas(true);
            return false;
        }
    }
});

// meteorjs helpers
Template.hello.events({
    "click button" (event, instance) {
        Template.instance().player.set(RED);
        Template.instance().won.set(ONGOING);
        Template.instance().process.set(false);
        STATE_TABLE = drawBoard(STATE_TABLE);
    },
    "click #a" (event) {
        VS_HUMAN = true;
        document.getElementById("computer_level").disabled = true;
    },
    "click #b" (event) {
        VS_HUMAN = false;
        document.getElementById("computer_level").disabled = false;
    },
    "change #computer_level" (event) {
        MAX_DEPTH = document.getElementById("computer_level").value
    },
    // when the canvas is clicked...
    "click #mycanvas" (event) {
        if (Template.instance().won.get() !== ONGOING) {
            alert("Game over. Please restart the game.");
            document.getElementById("reset").focus();
            return;
        }
        // calculate click with respect to canvas
        var canvas = event.target;
        var rect = canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;

        // draw move.
        if (canvas.getContext) {
            // increment the counter when button is clicked
            var currentPlayer = Template.instance().player;
            var dropped;
            if (!VS_HUMAN && currentPlayer.get() === BLACK) {
                console.log("computer is thinking...");
                var aiMove = getComputerMove(STATE_TABLE);
                dropped = drop(STATE_TABLE, canvas.getContext("2d"), aiMove, currentPlayer.get());
            } else {
                dropped = drop(STATE_TABLE, canvas.getContext("2d"), Math.floor(x / 100), currentPlayer.get());
            }

            if (dropped) {

                // check if game is won.
                if (checkWin(currentPlayer.get(), STATE_TABLE) === WON) {
                    Template.instance().won.set(currentPlayer.get() + " wins!");
                    alert(currentPlayer.get() + " wins!");
                    document.getElementById("reset").focus();
                }

                // change players
                getNextPlayer(currentPlayer);
                // call AI
                if (!VS_HUMAN && currentPlayer.get() === BLACK) {
                    setTimeout(function() {
                        document.getElementById("mycanvas").click();
                    }, 1000);
                }
            }
        }
    }
});

// draw the board
function drawBoard(stateTable) {

    // initialize array
    stateTable = new Array(MAX_X);
    for (i = 0; i < stateTable.length; i++) {
        stateTable[i] = new Array(MAX_Y); //y
    }

    // canvas
    var canvas = document.getElementById("mycanvas");
    if (canvas.getContext) {
        var ctx = canvas.getContext("2d");
        // clear previous data
        ctx.clearRect(0, 0, ctx.width, ctx.height);
        // main rectangle.
        ctx.rect(0, 0, MAX_X * 100, MAX_Y * 100);
        ctx.fillStyle = "yellow";
        ctx.stroke();
        ctx.fill();

        // // create circles..
        for (x = 0; x < MAX_X; x++) {
            for (y = 0; y < MAX_Y; y++) {
                stateTable[x][y] = WHITE;
                drawCircle(ctx, x, y, WHITE);
            }
        }
    } else {
        // canvas-unsupported code here
        alert("Please use browser with HTML5 Canvas support.");
    }
    return stateTable;
}

// draw a circle to the canvas.
function drawCircle(ctx, x, y, color) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc((x * 100) + 50, (y * 100) + 50, 30, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
}

// drop a coin.
function drop(stateTable, ctx, x, color) {

    // might not work for older browsers.
    var snd = new Audio("http://wornoutbackpack.com/wp-content/uploads/2016/04/coin-drop-5.mp3"); // buffers automatically when created
    console.log("dropping " + color + "@" + x);
    for (y = MAX_Y - 1; y >= 0; y--) {
        if (stateTable[x][y] === WHITE) {
            stateTable[x][y] = color;
            drawCircle(ctx, x, y, color);
            snd.play();
            return true;
        }
    }
    return false;
}

// get next player
function getNextPlayer(player) {
    if (player.get() === RED) {
        player.set(BLACK);
    } else {
        player.set(RED);
    }
}

// checking of winners
function checkWin(currentPlayer, table) {
    // check horizontals (starting from the bottom)
    for (y = MAX_Y - 1, count = 0; y >= 0; y--, count = 0) {
        for (x = 0; x < MAX_X; x++) {
            if (table[x][y] === currentPlayer) {
                count++;
                if (count >= IN_A_ROW) return WON;
            } else {
                count = 0;
            }
        }
    }
    // check verticals (starting from the left)
    for (x = 0, count = 0; x < MAX_X; x++, count = 0) {
        for (y = MAX_Y - 1; y >= 0; y--) {
            if (table[x][y] === currentPlayer) {
                count++;
                if (count >= IN_A_ROW) return WON;
            } else {
                count = 0;
            }
        }
    }
    // check diagonals (top-to-right)
    for (x = 0, count = 0; x <= MAX_X - IN_A_ROW; x++, count = 0) {
        for (y = 0, xTemp = x; y < MAX_Y && xTemp < MAX_X; y++, xTemp++) {
            if (table[xTemp][y] === currentPlayer) {
                count++;
                if (count >= IN_A_ROW) return WON;
            } else {
                count = 0;
            }
        }
    }
    // check diagonals (left-to-bottom)
    for (y = 1, count = 0; y <= MAX_Y - IN_A_ROW; y++, count = 0) {
        for (x = 0, yTemp = y; x < MAX_X && yTemp < MAX_Y; x++, yTemp++) {
            if (table[x][yTemp] === currentPlayer) {
                count++;
                if (count >= IN_A_ROW) return WON;
            } else {
                count = 0;
            }
        }
    }
    // check diagonals (top-to-left)
    for (x = MAX_X - 1, count = 0; x >= IN_A_ROW - 1; x--, count = 0) {
        for (y = 0, xTemp = x; y < MAX_Y && xTemp >= 0; y++, xTemp--) {
            if (table[xTemp][y] === currentPlayer) {
                count++;
                if (count >= IN_A_ROW) return WON;
            } else {
                count = 0;
            }
        }
    }
    // check diagonals (right-to-bottom)
    for (y = 1, count = 0; y <= MAX_Y - IN_A_ROW; y++, count = 0) {
        for (x = MAX_X - 1, yTemp = y; yTemp < MAX_Y && x >= 0; x--, yTemp++) {
            if (table[x][yTemp] === currentPlayer) {
                count++;
                if (count >= IN_A_ROW) return WON;
            } else {
                count = 0;
            }
        }
    }
    // check draw (all states black/red)
    for (x = 0; x < MAX_X; x++) {
        // we just have to check top row y=0
        if (table[x][0] === "white") {
            return ONGOING;
        }
    }

    return DRAW;
}

// calculate next move by computer
function getComputerMove(boardStateOrig) {

    var count = 0;
    for (y = 0; y < MAX_Y; y++) {
        for (x = 0; x < MAX_X; x++) {
            if (boardStateOrig[x][y] !== WHITE) {
                count++;
            }
        }
    }

    // move in the center.
    if (count == 0 || count == 1) {
        return 3;
    }

    return miniMax(boardStateOrig, -1000000, 0, -1);
}

// minimax algorithm
function miniMax(boardStateOrig, score, depth, color) {
    var boardState = cloneBoard(boardStateOrig);
    var bestPath = 0;
    var bestScore = score;

    var myColor;
    if (color == 1) {
        myColor = RED;
    } else {
        myColor = BLACK;
    }

    if (checkWin(RED, boardState) === WON) {
        // RED player won
        bestScore = color * (-1000000 + depth);
    } else if (checkWin(BLACK, boardState) === WON) {
        // BLACK player won
        bestScore = color * (1000000 - depth);
    } else if (checkWin(BLACK, boardState) === DRAW || checkWin(RED, boardState) === DRAW) {
        // DRAW
        bestScore = 0;
    } else if (depth === MAX_DEPTH) {
        // heuristics...
        mid = evaluateBoard(boardState, myColor);
        if (mid != 0) {
            bestScore = color * (mid - depth);
        } else {
            bestScore = mid;
        }
    } else {
        // recursion
        rows: for (var x1 = 0; x1 < MAX_X; x1++) {
            var y1 = 0;
            // if column is full..
            if (boardState[x1][0] !== WHITE) continue;
            // get next empty cell
            for (var y = MAX_Y - 1; y >= 0; y--) {
                if (boardState[x1][y] === WHITE) {
                    y1 = y;
                    break;
                }
            }

            // check nodes..
            if (depth < MAX_DEPTH) {
                var boardState2 = cloneBoard(boardState);
                boardState2[x1][y1] = myColor;
                val = -1 * miniMax(boardState2, -1000000, depth + 1, color * -1);
                if (val >= bestScore) {
                    bestPath = x1;
                    bestScore = val;
                }
            }
        }
    }

    if (depth === 0) {
        // console.log("bestScore", bestScore);
        // console.log("turn end", bestPath);
        return bestPath;
    } else {
        return bestScore;
    }
}

// I refered to the following links:
// resource 1: http://roadtolarissa.com/connect-4-ai-how-it-works/
// resource 2: https://github.com/jl23889/Code-Foo.git
function evaluateBoard(board, player) {
    var v = 1;
    var d = 2;
    var h = 3;
    var twoIn = 10;
    var threeIn = 100;

    var val = 0
        //Check for horizontal 2-in-a-row.
    for (var row = 0; row < 6; row++) {

        for (var col = 0; col < 4; col++) {
            //(xx00)
            if (board[col][row] == player &&
                board[col][row] == board[col + 1][row] &&
                board[col + 2][row] == WHITE &&
                board[col + 3][row] == WHITE) {
                val += twoIn * h;
            }
            //(x0x0)
            else if (board[col][row] == player &&
                board[col + 2][row] == player &&
                board[col + 1][row] == WHITE &&
                board[col + 3][row] == WHITE) {
                val += twoIn * h;
            }
            //(x00x)
            else if (board[col][row] == player &&
                board[col + 3][row] == player &&
                board[col + 1][row] == WHITE &&
                board[col + 2][row] == WHITE) {
                val += twoIn * h;
            }
            //(0xx0)
            else if (board[col][row] == WHITE &&
                board[col + 1][row] == player &&
                board[col + 2][row] == player &&
                board[col + 3][row] == WHITE) {
                val += 2 * twoIn * h;
            }
            //(0x0x)
            else if (board[col][row] == WHITE &&
                board[col + 1][row] == player &&
                board[col + 2][row] == WHITE &&
                board[col + 3][row] == player) {
                val += twoIn * h;
            }
            //(00xx)
            else if (board[col][row] == WHITE &&
                board[col][row] == board[col + 1][row] &&
                board[col + 2][row] == player &&
                board[col + 3][row] == player) {
                val += twoIn * h;
            }
        }
    }

    //Check for vertical spaced 2-in-a-row.
    for (var row = 5; row > 1; row--) {
        for (var col = 0; col < 7; col++) {
            if (board[col][row] == player &&
                board[col][row] == board[col][row - 1] &&
                board[col][row - 2] == WHITE) {
                val += twoIn * v;
            }
        }
    }
    //Check for diagonal spaced 2-in-a-row (/).
    for (var row = 5; row > 2; row--) {
        for (var col = 0; col < 4; col++) {
            if (board[col][row] == player &&
                board[col][row] == board[col + 1][row - 1] &&
                board[col + 2][row - 2] == WHITE &&
                board[col + 3][row - 3] == WHITE) {
                val += twoIn * d;
            } else if (board[col][row] == player &&
                board[col + 1][row - 1] == WHITE &&
                board[col + 2][row - 2] == WHITE &&
                board[col][row] == board[col + 3][row - 3]) {
                val += twoIn * d;
            } else if (board[col][row] == WHITE &&
                board[col + 1][row - 1] == WHITE &&
                board[col + 2][row - 2] == player &&
                board[col + 3][row - 3] == player) {
                val += twoIn * d;
            } else if (board[col][row] == WHITE &&
                board[col + 1][row - 1] == player &&
                board[col][row] == board[col + 2][row - 2] &&
                board[col + 1][row - 1] == board[col + 3][row - 3]) {
                val += twoIn * d;
            } else if (board[col][row] == player &&
                board[col + 1][row - 1] == WHITE &&
                board[col][row] == board[col + 2][row - 2] &&
                board[col + 1][row - 1] == board[col + 3][row - 3]) {
                val += twoIn * d;
            } else if (board[col][row] == WHITE &&
                board[col + 1][row - 1] == player &&
                board[col + 1][row - 1] == board[col + 2][row - 2] &&
                board[col][row] == board[col + 3][row - 3]) {
                val += 2 * twoIn * d;
            }
        }
    }
    //Check for diagonal spaced 3-in-a-row (\).
    for (var row = 0; row < 3; row++) {
        for (var col = 0; col < 4; col++) {
            if (board[col][row] == player &&
                board[col][row] == board[col + 1][row + 1] &&
                board[col + 2][row + 2] == WHITE &&
                board[col + 3][row + 3] == WHITE) {
                val += twoIn * d;
            } else if (board[col][row] == player &&
                board[col + 1][row + 1] == WHITE &&
                board[col + 2][row + 2] == WHITE &&
                board[col][row] == board[col + 3][row + 3]) {
                val += twoIn * d;
            } else if (board[col][row] == WHITE &&
                board[col + 1][row + 1] == WHITE &&
                board[col + 2][row + 2] == player &&
                board[col + 3][row + 3] == player) {
                val += twoIn * d;
            } else if (board[col][row] == WHITE &&
                board[col + 1][row + 1] == player &&
                board[col][row] == board[col + 2][row + 2] &&
                board[col + 1][row + 1] == board[col + 3][row + 3]) {
                val += twoIn * d;
            } else if (board[col][row] == player &&
                board[col + 1][row + 1] == WHITE &&
                board[col][row] == board[col + 2][row + 2] &&
                board[col + 1][row + 1] == board[col + 3][row + 3]) {
                val += twoIn * d;
            } else if (board[col][row] == WHITE &&
                board[col + 1][row + 1] == player &&
                board[col + 1][row + 1] == board[col + 2][row + 2] &&
                board[col][row] == board[col + 3][row + 3]) {
                val += twoIn * 2 * d;
            }
        }
    }
    //Check for horizontal 3-in-a-row.
    for (var row = 0; row < 6; row++) {
        for (var col = 0; col < 4; col++) {
            //(xx0x)
            if (board[col][row] == player &&
                board[col + 1][row] == player &&
                board[col + 2][row] == WHITE &&
                board[col + 3][row] == player) {
                val += threeIn * h;
            }
            //(x0xx)
            else if (board[col][row] == player &&
                board[col + 1][row] == WHITE &&
                board[col + 2][row] == player &&
                board[col + 3][row] == player) {
                val += threeIn * h;
            }
            //(0xxx)
            else if (board[col][row] == WHITE &&
                board[col + 1][row] == player &&
                board[col + 1][row] == board[col + 2][row] &&
                board[col + 1][row] == board[col + 3][row]) {
                val += threeIn * h;
            }
            //(xxx0)
            else if (board[col][row] == player &&
                board[col + 1][row] == player &&
                board[col + 2][row] == player &&
                board[col + 3][row] == WHITE) {
                val += threeIn * h;
            }
        }
    }

    //Check for vertical spaced 3-in-a-row.
    for (var row = 5; row > 2; row--) {
        for (var col = 0; col < 7; col++) {
            if (board[col][row] == player &&
                board[col][row] == board[col][row - 1] &&
                board[col][row] == board[col][row - 2] &&
                board[col][row - 3] == WHITE) {
                val += threeIn * v;
            }
        }
    }
    //Check for diagonal spaced 3-in-a-row (/).
    for (var row = 5; row > 2; row--) {
        for (var col = 0; col < 4; col++) {
            if (board[col][row] == player &&
                board[col][row] == board[col + 1][row - 1] &&
                board[col][row] == board[col + 2][row - 2] &&
                board[col + 3][row - 3] == WHITE) {
                val += threeIn * d;
            } else if (board[col][row] == player &&
                board[col][row] == board[col + 1][row - 1] &&
                board[col + 2][row - 2] == WHITE &&
                board[col][row] == board[col + 3][row - 3]) {
                val += threeIn * d;
            } else if (board[col][row] == player &&
                board[col + 1][row - 1] == WHITE &&
                board[col][row] == board[col + 2][row - 2] &&
                board[col][row] == board[col + 3][row - 3]) {
                val += threeIn * d;
            } else if (board[col][row] == WHITE &&
                board[col + 1][row - 1] == player &&
                board[col + 1][row - 1] == board[col + 2][row - 2] &&
                board[col + 1][row - 1] == board[col + 3][row - 3]) {
                val += threeIn * d;
            }
        }
    }
    //Check for diagonal spaced 3-in-a-row (\).
    for (var row = 0; row < 3; row++) {
        for (var col = 0; col < 4; col++) {
            if (board[col][row] == WHITE &&
                board[col + 1][row + 1] == player &&
                board[col + 1][row + 1] == board[col + 2][row + 2] &&
                board[col + 1][row + 1] == board[col + 3][row + 3]) {
                val += threeIn * d;
            } else if (board[col][row] == player &&
                board[col + 1][row + 1] == WHITE &&
                board[col][row] == board[col + 2][row + 2] &&
                board[col][row] == board[col + 3][row + 3]) {
                val += threeIn * d;
            } else if (board[col][row] == player &&
                board[col][row] == board[col + 1][row + 1] &&
                board[col + 2][row + 2] == WHITE &&
                board[col][row] == board[col + 3][row + 3]) {
                val += threeIn * d;
            } else if (board[col][row] == player &&
                board[col][row] == board[col + 1][row + 1] &&
                board[col][row] == board[col + 2][row + 2] &&
                board[col + 3][row + 3] == WHITE) {
                val += threeIn * d;
            }
        }
    }
    //Check for open-ended 3-in-a-row. (0xxx0)
    for (var row = 0; row < 6; row++) {
        for (var col = 0; col < 3; col++) {
            //horizontal
            if (board[col][row] == WHITE &&
                board[col + 1][row] == player &&
                board[col + 2][row] == player &&
                board[col + 3][row] == player &&
                board[col][row] == board[col + 4][row]) {
                val += 2 * threeIn * h;
            }
        }
    }
    for (var row = 0; row < 2; row++) {
        for (var col = 0; col < 3; col++) {
            //diag(\)
            if (board[col][row] == WHITE &&
                board[col + 1][row + 1] == player &&
                board[col][row] == board[col + 2][row + 2] &&
                board[col][row] == board[col + 3][row + 3] &&
                board[col + 4][row + 4] == WHITE) {
                val += 2 * threeIn * d;
            }
        }
    }
    //diag(/)
    for (var row = 5; row > 3; row--) {
        for (var col = 0; col < 3; col++) {
            if (board[col][row] == WHITE &&
                board[col + 1][row - 1] == player &&
                board[col + 2][row - 2] == player &&
                board[col + 3][row - 3] == player &&
                board[col + 4][row - 4] == WHITE) {
                val += 2 * threeIn * d;
            }
        }
    }
    return val;
}

// UTILITY
// generate a random integer from min to max inclusive.
function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// create a clone of the given 2d array.
function cloneBoard(board) {
    var newBoard = board.slice();
    for (x = 0; x < MAX_X; x++) {
        newBoard[x] = board[x].slice();
    }
    return newBoard;
}

function showCanvas(show) {
    if (document.getElementById("mycanvas") == null) {
        return;
    }
    if (show) {
        document.getElementById("mycanvas").style.display = "block";
    } else {
        document.getElementById("mycanvas").style.display = "none";
    }
}
