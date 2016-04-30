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
});

// meteorjs helpers
Template.hello.helpers({
    player() {
        return Template.instance().player.get();
    },
    won() {
        return Template.instance().won.get();
    }
});

// meteorjs helpers
Template.hello.events({
    "click button" (event, instance) {
        Template.instance().player.set(RED);
        Template.instance().won.set(ONGOING);
        drawBoard();
        if (!VS_HUMAN) {
            // randomize first player.
            var headsOrTails = Math.floor(Math.random() * 2);
            if (headsOrTails) {
                computerMove();
            }
        }
    },
    "click #a" (event) {
        VS_HUMAN = true;
        document.getElementById("computer_level").disabled = true;
    },
    "click #b" (event) {
        VS_HUMAN = false;
        document.getElementById("computer_level").disabled = false;
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
            var dropped = drop(canvas.getContext("2d"), Math.floor(x / 100), currentPlayer.get());
            if (dropped) {

                // check if game is won.
                if (checkWin(currentPlayer.get(), STATE_TABLE) === WON) {
                    Template.instance().won.set(currentPlayer.get() + " wins!");
                    alert(currentPlayer.get() + " wins!");
                    document.getElementById("reset").focus();
                }

                // change players
                getNextPlayer(currentPlayer);
                //if()
            }
        }
    }
});

// draw the board
function drawBoard() {

    // initialize array
    STATE_TABLE = new Array(MAX_X);
    for (i = 0; i < STATE_TABLE.length; i++) {
        STATE_TABLE[i] = new Array(MAX_Y); //y
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
                STATE_TABLE[x][y] = WHITE;
                drawCircle(ctx, x, y, WHITE);
            }
        }
    } else {
        // canvas-unsupported code here
        alert("Please use browser with HTML5 Canvas support.");
    }
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
function drop(ctx, x, color) {

    // might not work for older browsers.
    var snd = new Audio("http://wornoutbackpack.com/wp-content/uploads/2016/04/coin-drop-5.mp3"); // buffers automatically when created
    console.log("dropping " + color + "@" + x);
    for (y = MAX_Y - 1; y >= 0; y--) {
        if (STATE_TABLE[x][y] === WHITE) {
            STATE_TABLE[x][y] = color;
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
