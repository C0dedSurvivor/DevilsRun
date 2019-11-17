
// #1 - Create a new Pixi application
// http://pixijs.download/dev/docs/PIXI.Application.html
const app = new PIXI.Application(600, 400);

let isMobile, player, state, playerID, left, right, up, down;

// #1 - make a square
// http://pixijs.download/dev/docs/PIXI.Graphics.html
const square = new PIXI.Graphics();
square.beginFill(0xFF0000); 	// red in hexadecimal
square.lineStyle(3, 0xFFFF00, 1); // lineWidth,color in hex, alpha
square.drawRect(0, 0, 40, 40); 	// x,y,width,height
square.endFill();
square.x = 25;
square.y = 50;
app.stage.addChild(square);  	// now you can see it

setup();

function setup() {

    // #2 - Append its "view" (a <canvas> tag that it created for us) to the DOM
    document.body.appendChild(app.view);

    app.renderer.backgroundColor = 0xFF00FF;

    //Detects if we are on mobile or PC
    let ua = window.navigator.userAgent.toLowerCase();
    isMobile = typeof window.orientation !== "undefined" || ua.indexOf('iemobile') !== -1 || ua.indexOf('mobile') !== -1 || ua.indexOf('android') !== -1;

    if (isMobile) {
        setupController();
    }
    else {
        setupDisplay();
    }
}

function setupController() {

}

function setupDisplay() {
    //make a circle
    player = new PIXI.Graphics();
    player.beginFill(0xFF0000);
    player.drawCircle(0, 0, 20);
    player.endFill();
    player.x = 125;
    player.y = 50;
    app.stage.addChild(player);

    //Capture the keyboard arrow keys
    left = keyboard("ArrowLeft");
    up = keyboard("ArrowUp");
    right = keyboard("ArrowRight");
    down = keyboard("ArrowDown");

    //Set the game state
    state = play;

    //Start the game loop 
    app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta) {
    //Update the current game state:
    state(delta);
}

function play(delta) {
    if (up.isDown) {
        player.y -= 5;
    }
    if (down.isDown) {
        player.y += 5;
    }
    if (left.isDown) {
        player.x -= 5;
    }
    if (right.isDown) {
        player.x += 5;
    }
}

//https://github.com/kittykatattack/learningPixi#keyboard
function keyboard(value) {
    let key = {};
    key.value = value;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = event => {
        if (event.key === key.value) {
            if (key.isUp && key.press) key.press();
            key.isDown = true;
            key.isUp = false;
            event.preventDefault();
        }
    };

    //The `upHandler`
    key.upHandler = event => {
        if (event.key === key.value) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
            event.preventDefault();
        }
    };

    //Attach event listeners
    const downListener = key.downHandler.bind(key);
    const upListener = key.upHandler.bind(key);

    window.addEventListener(
        "keydown", downListener, false
    );
    window.addEventListener(
        "keyup", upListener, false
    );

    // Detach event listeners
    key.unsubscribe = () => {
        window.removeEventListener("keydown", downListener);
        window.removeEventListener("keyup", upListener);
    };

    return key;
}

