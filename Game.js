
// #1 - Create a new Pixi application
// http://pixijs.download/dev/docs/PIXI.Application.html
const app = new PIXI.Application(600, 400);

//Sets up the multiplayer connection
const client = new DeepstreamClient('wss://devilsrunscribe.csh.rit.edu:9090')
client.login()

let gameObjects = {};

let isMobile, state, playerID, worldID, left, right, up, down;

setup();

function setup() {
    // #2 - Append its "view" (a <canvas> tag that it created for us) to the DOM
    document.body.appendChild(app.view);

    app.renderer.backgroundColor = 0xFF00FF;

    //Detects if we are on mobile or PC
    let ua = window.navigator.userAgent.toLowerCase();
    isMobile = typeof window.orientation !== "undefined" || ua.indexOf('iemobile') !== -1 || ua.indexOf('mobile') !== -1 || ua.indexOf('android') !== -1;

    worldID = "0001";

    if (isMobile) {
        setupController();
    }
    else {
        setupDisplay();
    }
}

function setupController() {
    let numOfPlayers = client.record.getRecord("worlds/" + worldID);

    //Sets up the player ID
    playerID = numOfPlayers.get('numOfPlayers');

    numOfPlayers.set('numOfPlayers', numOfPlayers.get('numOfPlayers') + 1);

    // #1 - make a square
    // http://pixijs.download/dev/docs/PIXI.Graphics.html
    const moveLeftButton = new PIXI.Graphics();
    moveLeftButton.beginFill(0xFF0000); 	// red in hexadecimal
    moveLeftButton.lineStyle(3, 0xFFFF00, 1); // lineWidth,color in hex, alpha
    moveLeftButton.drawRect(0, 0, 40, 40); 	// x,y,width,height
    moveLeftButton.endFill();
    moveLeftButton.x = 25;
    moveLeftButton.y = 50;
    moveLeftButton.on('pointerdown', function(e) {
        client.record.getRecord("worlds/" + worldID).set("moveLeft", playerID);
    });
    app.stage.addChild(moveLeftButton);  	// now you can see it

    // #1 - make a square
    // http://pixijs.download/dev/docs/PIXI.Graphics.html
    const moveRightButton = new PIXI.Graphics();
    moveRightButton.beginFill(0xFF0000); 	// red in hexadecimal
    moveRightButton.lineStyle(3, 0xFFFF00, 1); // lineWidth,color in hex, alpha
    moveRightButton.drawRect(0, 0, 40, 40); 	// x,y,width,height
    moveRightButton.endFill();
    moveRightButton.x = 75;
    moveRightButton.y = 50;
    moveRightButton.on('pointerdown', function(e) {
        client.record.getRecord("worlds/" + worldID).set("moveRight", playerID);
    });
    app.stage.addChild(moveRightButton);  	// now you can see it

}

function setupDisplay() {
    gameObjects.players = [];

    let worldRecord = client.record.getRecord("worlds/" + worldID);

    worldRecord.set("numOfPlayers", 0);

    //Capture the keyboard arrow keys
    left = keyboard("ArrowLeft");
    up = keyboard("ArrowUp");
    right = keyboard("ArrowRight");
    down = keyboard("ArrowDown");

    worldRecord.subscribe('numOfPlayers', playerLogin);
    worldRecord.subscribe('moveLeft', moveLeft);
    worldRecord.subscribe('moveRight', moveRight);

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
}

function moveLeft(value){
    gameObjects.players[value].x -= 3;
}

function moveRight(value){
    gameObjects.players[value].x += 3;
}

function playerLogin() {
    //make a circle player stand-in
    let player = new PIXI.Graphics();
    player.beginFill(0xFF0000);
    player.drawCircle(0, 0, 20);
    player.endFill();
    player.x = 125;
    player.y = 50;
    gameObjects.players.push(player);
    app.stage.addChild(player);
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

