
// #1 - Create a new Pixi application
// http://pixijs.download/dev/docs/PIXI.Application.html
const app = new PIXI.Application(600, 400);

//Sets up the multiplayer connection
const client = new DeepstreamClient('wss://devilsrunscribe.csh.rit.edu:9090')
client.login()

let stateObjects = {};

let isMobile, state, worldID, worldRecord;


app.renderer.backgroundColor = 0x42dcff;

//Detects if we are on mobile or PC
let ua = window.navigator.userAgent.toLowerCase();
isMobile = typeof window.orientation !== "undefined" || ua.indexOf('iemobile') !== -1 || ua.indexOf('mobile') !== -1 || ua.indexOf('android') !== -1;

setup();

function setup() {
    if (isMobile) {
        stateObjects.playerID = -1;
        document.querySelector("main").innerHTML = "<input id='roomselector' type='text' size='4' maxlength='4' autofocus value='Q0X3' /><button type='button' id='roombutton' onclick='joinRoom()'>Join Room</button>"
    }
    else {
        generateView("Q0X3");
    }
}

function joinRoom() {
    let room = document.querySelector("#roomselector").value;
    document.querySelector("#roombutton").interactive = false;

    client.event.subscribe(`getPlayerID${room}`, function (id) {
        stateObjects.playerID = id;
        generateView(room);
        document.querySelector("main").innerHTML = "";
        client.event.unsubscribe(`getPlayerID${room}`);
        client.event.unsubscribe(`rejectPlayer${room}`);
    });

    client.event.subscribe(`rejectPlayer${room}`, function (id) {
        document.querySelector("#roombutton").interactive = true;
        client.event.unsubscribe(`getPlayerID${room}`);
        client.event.unsubscribe(`rejectPlayer${room}`);
    });
    
    setTimeout(function(){
        client.event.emit(`controllerConnecting${room}`);
    }, 1000);
}

function generateView(roomID) {
    // #2 - Append its "view" (a <canvas> tag that it created for us) to the DOM
    document.querySelector("main").appendChild(app.view);

    worldID = roomID;
    worldRecord = client.record.getRecord(`worlds/${worldID}`);

    client.event.subscribe(`moveToRound${worldID}`, moveToRound);

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
    stateObjects.touchX = -1;
    stateObjects.touchY = -1;

    document.addEventListener("touchstart", function(e){onTouch(e);});
    document.addEventListener("touchmove", function(e){onTouch(e);});
    document.addEventListener("touchend", function(e){onTouchEnd(e);});

    stateObjects.teamSelectScene = new PIXI.Container();
    stateObjects.activeScene = stateObjects.teamSelectScene;
    app.stage.addChild(stateObjects.teamSelectScene);

    stateObjects.controllerScene = new PIXI.Container();
    const moveLeftButton = new TouchButton(10, 10, 80, 80, 0xFF0000, 3, 0xFFFF00, outlineAlpha = 1, onTap = null, onHoverDown = function (e) { client.event.emit(`moveLeft${worldID}`, stateObjects.playerID); });
    stateObjects.controllerScene.addChild(moveLeftButton);

    const moveRightButton = new TouchButton(100, 10, 80, 80, 0xFF0000, 3, 0xFFFF00, outlineAlpha = 1, onTap = null, onHoverDown = function (e) { client.event.emit(`moveRight${worldID}`, stateObjects.playerID); });
    stateObjects.controllerScene.addChild(moveRightButton);

    stateObjects.controllerScene.visible = false;
    app.stage.addChild(stateObjects.controllerScene);

    //Set the game state
    state = control;

    //Start the game loop 
    app.ticker.add(delta => gameLoop(delta));
}

function setupDisplay() {
    stateObjects.players = [];

    //Capture the keyboard arrow keys
    stateObjects.confirm = keyboard("Enter");
    stateObjects.back = keyboard("Escape");

    client.event.subscribe(`moveLeft${worldID}`, moveLeft);
    client.event.subscribe(`moveRight${worldID}`, moveRight);

    client.event.subscribe(`controllerConnecting${worldID}`, playerLogin);

    stateObjects.teamSelectScene = new PIXI.Container();
    stateObjects.activeScene = stateObjects.teamSelectScene;
    app.stage.addChild(stateObjects.teamSelectScene);

    stateObjects.gameScene = new PIXI.Container();
    stateObjects.gameScene.visible = false;
    app.stage.addChild(stateObjects.gameScene);

    stateObjects.confirm.press = function (e) {
        client.event.emit(`moveToRound${worldID}`, "");
    };

    //Set the game state
    state = play;

    //Start the game loop 
    app.ticker.add(delta => gameLoop(delta));
}

function onTouch(event) {
    stateObjects.touchX = event.pageX;
    stateObjects.touchY = event.pageY;
    console.log(stateObjects.touchX + " | " + stateObjects.touchY)
}

function onTouchEnd(event) {
    stateObjects.touchX = -1;
    stateObjects.touchY = -1;
}

function gameLoop(delta) {
    //Update the current game state:
    state(delta);
}

function play(delta) {
    if (stateObjects.activeScene == stateObjects.teamSelectScene) {

    } else if (stateObjects.activeScene == stateObjects.gameScene) {
        stateObjects.players.forEach(function (player) { player.move(); });
    }
}

function control(delta) {
    if (stateObjects.activeScene && stateObjects.touchX != -1) {
        stateObjects.activeScene.children.forEach(function (child) {
            if (child instanceof TouchButton && child.onHoverDown && child.hoveredOver(stateObjects.touchX, stateObjects.touchY)) {
                child.onHoverDown();
            };
        });
    }
}

function moveLeft(value) {
    stateObjects.players[value].x += -3;
}

function moveRight(value) {
    stateObjects.players[value].x += 3;
}

function playerLogin() {
    console.log("Logging in");
    if (stateObjects.activeScene != stateObjects.gameScene) {
        //make a Player stand-in
        let player = new Player();
        stateObjects.gameScene.addChild(player);
        stateObjects.players.push(player);
        client.event.emit(`getPlayerID${worldID}`, stateObjects.players.length - 1);
        console.log("Now joining: Player ID " + (stateObjects.players.length - 1));
    } else {
        client.event.emit(`rejectPlayer${worldID}`, "");
        console.log("Player rejected");
    }
}

function moveToRound() {
    if (isMobile) {
        stateObjects.teamSelectScene.visible = false;
        stateObjects.controllerScene.visible = true;
        stateObjects.activeScene = stateObjects.controllerScene;
    }
    else {
        stateObjects.teamSelectScene.visible = false;
        stateObjects.gameScene.visible = true;
        stateObjects.activeScene = stateObjects.gameScene;
        stateObjects.confirm.press = null;
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

class Player extends PIXI.Graphics {
    constructor(color = 0xFF0000, radius = 20, x = 125, y = 50) {
        super();
        this.beginFill(color);
        this.drawCircle(0, 0, radius);
        this.endFill();
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
    }

    move() {
        this.x += this.vx;
        this.y += this.vy;
    }
}

class TouchButton extends PIXI.Graphics {
    constructor(x, y, width, height, fillColor, outlineWidth, outlineColor, outlineAlpha = 1, onTap = null, onHoverDown = null) {
        super();
        this.beginFill(fillColor);
        this.lineStyle(outlineWidth, outlineColor, outlineAlpha);
        this.drawRect(0, 0, width, height);
        this.endFill();
        this.x = x;
        this.y = y;
        this.interactive = true;
        this.onHoverDown = onHoverDown;
        if (onTap) {
            this.on('tap', onTap);
        }
    }

    hoveredOver(x, y) {
        return (x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height);
    }
}