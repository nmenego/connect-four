/**
 * @author NMEnego 2016
 */
import {
    Template
} from 'meteor/templating';
import {
    ReactiveVar
} from 'meteor/reactive-var';

import './main.html';

// container for state table
var STATE_TABLE = null;
const RED = "red";
const BLACK = "black";
const WHITE = "white";
const ONGOING = "Ongoing...";
const MAX_X = 7;
const MAX_Y = 6;
const IN_A_ROW = 4;

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
    'click button' (event, instance) {
        Template.instance().player.set(RED);
        Template.instance().won.set(ONGOING);
        drawBoard();
    },
    // when the canvas is clicked...
    'click #mycanvas' (event) {
        if (Template.instance().won.get() !== ONGOING) {
            alert("Game over. Please restart the game.");
            return;
        }
        // calculate click.
        var x = event.pageX,
            y = event.pageY;
        var canvas = event.target;
        if (canvas.getContext) {
            // increment the counter when button is clicked
            var currentPlayer = Template.instance().player;
            var dropped = drop(canvas.getContext('2d'), Math.floor(x / 100), currentPlayer.get());
            if (dropped) {

                // check if game is won.
                if (checkWin(currentPlayer.get())) {
                    Template.instance().won.set(currentPlayer.get() + " wins!");
                    alert(currentPlayer.get() + " wins!");
                }

                // change players
                getNextPlayer(currentPlayer);
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
        var ctx = canvas.getContext('2d');
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

    // buffers automatically when created
    var snd = new Audio("coin-drop-5.mp3");
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
function checkWin(currentPlayer) {
    // check horizontals (starting from the bottom)
    for (y = MAX_Y - 1, count = 0; y >= 0; y--, count = 0) {
        for (x = 0; x < MAX_X; x++) {
            if (STATE_TABLE[x][y] === currentPlayer) {
                count++;
                if (count >= IN_A_ROW) return true;
            } else {
                count = 0;
            }
        }
    }
    // check verticals (starting from the left)
    for (x = 0, count = 0; x < MAX_X; x++, count = 0) {
        for (y = MAX_Y - 1; y >= 0; y--) {
            if (STATE_TABLE[x][y] === currentPlayer) {
                count++;
                if (count >= IN_A_ROW) return true;
            } else {
                count = 0;
            }
        }
    }
    // check diagonals (top-to-right)
    for (x = 0, count = 0; x <= MAX_X - IN_A_ROW; x++, count = 0) {
        for (y = 0, xTemp = x; y < MAX_Y && xTemp < MAX_X; y++, xTemp++) {
            if (STATE_TABLE[xTemp][y] === currentPlayer) {
                count++;
                if (count >= IN_A_ROW) return true;
            } else {
                count = 0;
            }
        }
    }
    // check diagonals (left-to-bottom)
    for (y = 1, count = 0; y <= MAX_Y - IN_A_ROW; y++, count = 0) {
        for (x = 0, yTemp = y; x < MAX_X && yTemp < MAX_Y; x++, yTemp++) {
            if (STATE_TABLE[x][yTemp] === currentPlayer) {
                count++;
                if (count >= IN_A_ROW) return true;
            } else {
                count = 0;
            }
        }
    }
    // check diagonals (top-to-left)
    for (x = MAX_X - 1, count = 0; x >= IN_A_ROW - 1; x--, count = 0) {
        for (y = 0, xTemp = x; y < MAX_Y && xTemp >= 0; y++, xTemp--) {
            if (STATE_TABLE[xTemp][y] === currentPlayer) {
                count++;
                if (count >= IN_A_ROW) return true;
            } else {
                count = 0;
            }
        }
    }
    // check diagonals (right-to-bottom)
    for (y = 1, count = 0; y <= MAX_Y - IN_A_ROW; y++, count = 0) {
        for (x = MAX_X - 1, yTemp = y; yTemp < MAX_Y && x >= 0; x--, yTemp++) {
            if (STATE_TABLE[x][yTemp] === currentPlayer) {
                count++;
                if (count >= IN_A_ROW) return true;
            } else {
                count = 0;
            }
        }
    }
    return false;
}
