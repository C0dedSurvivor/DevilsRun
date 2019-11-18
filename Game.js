
// #1 - Create a new Pixi application
// http://pixijs.download/dev/docs/PIXI.Application.html
const app = new PIXI.Application(600, 400);

//Sets up the multiplayer connection
const client = new DeepstreamClient('wss://devilsrunscribe.csh.rit.edu:9090')
client.login()

let stateObjects = {};

let isMobile, state, worldID, worldRecord;

setup();

function setup() {
    // #2 - Append its "view" (a <canvas> tag that it created for us) to the DOM
    document.body.appendChild(app.view);

    app.renderer.backgroundColor = 0x42dcff;

    //Detects if we are on mobile or PC
    let ua = window.navigator.userAgent.toLowerCase();
    isMobile = typeof window.orientation !== "undefined" || ua.indexOf('iemobile') !== -1 || ua.indexOf('mobile') !== -1 || ua.indexOf('android') !== -1;

    worldID = "0001";
    worldRecord = client.record.getRecord(`worlds/${worldID}`);

    worldRecord.whenReady(function () {
        if (isMobile) {
            setupController();
        }
        else {
            setupDisplay();
        }
    });
}

function setupController() {
    //Sets up the player ID
    stateObjects.playerID = worldRecord.get('numOfPlayers');

    console.log(worldRecord.get('numOfPlayers'));

    worldRecord.setWithAck('numOfPlayers', worldRecord.get('numOfPlayers') + 1).then(function () {

        client.event.emit('controllerConnecting', stateObjects.playerID);

        // Make a square
        const moveLeftButton = new PIXI.Graphics();
        moveLeftButton.beginFill(0xFF0000); 	// red in hexadecimal
        moveLeftButton.lineStyle(3, 0xFFFF00, 1); // lineWidth,color in hex, alpha
        moveLeftButton.drawRect(0, 0, 40, 40); 	// x,y,width,height
        moveLeftButton.endFill();
        moveLeftButton.x = 25;
        moveLeftButton.y = 50;
        moveLeftButton.interactive = true;
        moveLeftButton.on('touchstart', function (e) {
            console.log("touch started left");
            client.event.emit("beginMoveLeft", stateObjects.playerID);
        });
        moveLeftButton.on('touchend', function (e) {
            console.log("touch ended left");
            client.event.emit("endMoveLeft", stateObjects.playerID);
        });
        app.stage.addChild(moveLeftButton);  	// now you can see it

        // Make a square
        const moveRightButton = new PIXI.Graphics();
        moveRightButton.beginFill(0xFF0000); 	// red in hexadecimal
        moveRightButton.lineStyle(3, 0xFFFF00, 1); // lineWidth,color in hex, alpha
        moveRightButton.drawRect(0, 0, 40, 40); 	// x,y,width,height
        moveRightButton.endFill();
        moveRightButton.x = 75;
        moveRightButton.y = 50;
        moveRightButton.interactive = true;
        moveRightButton.on('touchstart', function (e) {
            console.log("touch started right");
            client.event.emit("beginMoveRight", stateObjects.playerID);
        });
        moveRightButton.on('touchend', function (e) {
            console.log("touch ended right");
            client.event.emit("endMoveRight", stateObjects.playerID);
        });
        app.stage.addChild(moveRightButton);  	// now you can see it
    });
}

function setupDisplay() {
    stateObjects.players = [];

    worldRecord.setWithAck('numOfPlayers', 0).then(function () {

        console.log(worldRecord.get());

        //Capture the keyboard arrow keys
        stateObjects.confirm = keyboard("Enter");
        stateObjects.back = keyboard("Escape");

        client.event.subscribe('beginMoveLeft', beginMoveLeft);
        client.event.subscribe('beginMoveRight', beginMoveRight);
        client.event.subscribe('endMoveLeft', endMoveLeft);
        client.event.subscribe('endMoveRight', endMoveRight);

        client.event.subscribe('controllerConnecting', playerLogin);

        //Set the game state
        state = play;

        //Start the game loop 
        app.ticker.add(delta => gameLoop(delta));
    });
}

function gameLoop(delta) {
    //Update the current game state:
    state(delta);
}

function play(delta) {
    stateObjects.players.forEach(function (player) { player.x += player.vx; });
}

function beginMoveLeft(value) {
    stateObjects.players[value].vx = -3;
}

function beginMoveRight(value) {
    stateObjects.players[value].vx = 3;
}

function endMoveLeft(value) {
    if (stateObjects.players[value].vx == -3)
        stateObjects.players[value].vx = 0;
}

function endMoveRight(value) {
    if (stateObjects.players[value].vx == 3)
        stateObjects.players[value].vx = 0;
}

function playerLogin() {
    console.log("Logging in");
    //make a circle player stand-in
    let player = new PIXI.Graphics();
    player.beginFill(0xFF0000);
    player.drawCircle(0, 0, 20);
    player.endFill();
    player.x = 125;
    player.y = 50;
    player.vx = 0;
    stateObjects.players.push(player);
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

