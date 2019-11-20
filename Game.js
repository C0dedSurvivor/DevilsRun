
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
    stateObjects.roomSelectScene = new PIXI.Container();
    app.stage.addChild(stateObjects.roomSelectScene);
    
    stateObjects.teamSelectScene = new PIXI.Container();
    stateObjects.teamSelectScene.visible = false;
    app.stage.addChild(stateObjects.teamSelectScene);
    
    stateObjects.controllerScene = new PIXI.Container();
    stateObjects.controllerScene.visible = false;
    app.stage.addChild(stateObjects.controllerScene);

    worldRecord.whenReady(record => {

        //Sets up the player ID
        stateObjects.playerID = -1;
        client.event.subscribe('getPlayerID', function (id) { stateObjects.playerID = id; client.event.unsubscribe('getPlayerID'); });

        record.whenReady(record => {

            client.event.emit('controllerConnecting');

            // Make a square
            const moveLeftButton = new PIXI.Graphics();
            moveLeftButton.beginFill(0xFF0000); 	// red in hexadecimal
            moveLeftButton.lineStyle(3, 0xFFFF00, 1); // lineWidth,color in hex, alpha
            moveLeftButton.drawRect(0, 0, 80, 80); 	// x,y,width,height
            moveLeftButton.endFill();
            moveLeftButton.x = 10;
            moveLeftButton.y = 10;
            moveLeftButton.interactive = true;
            moveLeftButton.on('touchstart', function (e) {
                console.log("touch started left");
                client.event.emit("beginMoveLeft", stateObjects.playerID);
            });
            moveLeftButton.on('touchend', function (e) {
                console.log("touch ended left");
                client.event.emit("endMove", stateObjects.playerID);
            });
            app.stage.addChild(moveLeftButton);  	// now you can see it

            // Make a square
            const moveRightButton = new PIXI.Graphics();
            moveRightButton.beginFill(0xFF0000); 	// red in hexadecimal
            moveRightButton.lineStyle(3, 0xFFFF00, 1); // lineWidth,color in hex, alpha
            moveRightButton.drawRect(0, 0, 80, 80); 	// x,y,width,height
            moveRightButton.endFill();
            moveRightButton.x = 100;
            moveRightButton.y = 10;
            moveRightButton.interactive = true;
            moveRightButton.on('touchstart', function (e) {
                console.log("touch started right");
                client.event.emit("beginMoveRight", stateObjects.playerID);
            });
            moveRightButton.on('touchend', function (e) {
                console.log("touch ended right");
                client.event.emit("endMove", stateObjects.playerID);
            });
            app.stage.addChild(moveRightButton);  	// now you can see it
        });
    });

}

function setupDisplay() {
    stateObjects.players = [];

    //Capture the keyboard arrow keys
    stateObjects.confirm = keyboard("Enter");
    stateObjects.back = keyboard("Escape");

    client.event.subscribe('beginMoveLeft', beginMoveLeft);
    client.event.subscribe('beginMoveRight', beginMoveRight);
    client.event.subscribe('endMove', endMove);

    client.event.subscribe('controllerConnecting', playerLogin);

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
    stateObjects.players.forEach(function (player) { player.move(); });
}

function beginMoveLeft(value) {
    stateObjects.players[value].vx = -3;
}

function beginMoveRight(value) {
    stateObjects.players[value].vx = 3;
}

function endMove(value) {
    stateObjects.players[value].vx = 0;
}

function playerLogin() {
    console.log("Logging in");
    //make a Player stand-in
    let player = new Player();
    app.stage.addChild(player);
    stateObjects.players.push(player);
    client.event.emit('getPlayerID', stateObjects.players.length - 1);
    console.log("Now joining: Player ID " + (stateObjects.players.length - 1));
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

class Player extends PIXI.Graphics{
    constructor(color=0xFF0000, radius=20, x=125, y=50){
        super();
        this.beginFill(color);
        this.drawCircle(0, 0, radius);
        this.endFill();
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
    }

    move(){
        this.x += this.vx;
        this.y += this.vy;
    }

}