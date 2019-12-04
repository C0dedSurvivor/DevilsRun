// #1 - Create a new Pixi application
// http://pixijs.download/dev/docs/PIXI.Application.html
const app = new PIXI.Application(600, 400);

//Sets up the multiplayer connection
var db = firebase.firestore();

const client = new DeepstreamClient('wss://devilsrunscribe.csh.rit.edu:9090')
client.login()

let stateObjects = {};

let isMobile, state, worldID;

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
    document.querySelector("#roombutton").disabled = true;

    var roomDocRef = db.collection("rooms").doc(room);

    roomDocRef.get().then(function (doc) {
        if (doc.exists) {
            console.log("Document data:", doc.data());
            roomDocRef.collection("data").doc("playerCount").get().then(function (doc) {
                if (doc.exists) {
                    var playerCount = doc.data().count;
                    if (playerCount <= 7) {
                        roomDocRef.collection("data").doc("playerCount").update({
                            count: firebase.firestore.FieldValue.increment(1)
                        });
                        stateObjects.playerID = playerCount;
                        document.querySelector("main").innerHTML = "";
                        generateView(room);
                    } else {
                        console.log("Sorry! Room is full.");
                        document.querySelector("#roombutton").removeAttribute("disabled");
                    }
                } else {
                    // doc.data() will be undefined in this case
                    console.log("That room is not valid!");
                }
            }).catch(function (error) {
                console.log("Error getting document:", error);
            });

            /*             db.runTransaction(function (transaction) {
                            return transaction.get(roomDocRef.collection("data").doc("playerCount")).then(function (roomDoc) {
                                if (!roomDoc.exists) {
                                    throw "Document does not exist!";
                                }
            
                                var playerCount = roomDoc.data().count + 1;
                                if (playerCount <= 8) {
                                    transaction.update(roomDocRef.collection("data").doc("playerCount"), { count: playerCount });
                                    return playerCount - 1;
                                } else {
                                    return Promise.reject("Sorry! Room is full.");
                                }
                            });
                        }).then(function (playerID) {
                            stateObjects.playerID = playerID;
                            document.querySelector("main").innerHTML = "";
                            generateView(room);
                        }).catch(function (err) {
                            // This will be an "room is full" error.
                            console.error(err);
                            document.querySelector("#roombutton").removeAttribute("disabled");
                        });
             */
        } else {
            // doc.data() will be undefined in this case
            console.log("That room is not valid!");
            document.querySelector("#roombutton").removeAttribute("disabled");
        }
    }).catch(function (error) {
        console.log("Error getting document:", error);
    });
}

function generateView(roomID) {
    // #2 - Append its "view" (a <canvas> tag that it created for us) to the DOM
    document.querySelector("main").appendChild(app.view);

    worldID = roomID;

    db.collection("rooms").doc(worldID).collection("data").doc("gameState")
        .onSnapshot(function (doc) {
            switchState(doc.data().state);
        });

    if (isMobile) {
        setupController();
    }
    else {
        setupDisplay();
    }
}

function setupController() {
    stateObjects.touchX = -1;
    stateObjects.touchY = -1;

    app.view.addEventListener("touchstart", function (e) { onTouch(e); });
    app.view.addEventListener("touchmove", function (e) { onTouch(e); });
    app.view.addEventListener("touchend", function (e) { onTouchEnd(e); });
    document.addEventListener("scroll", onScroll);

    textStyle = {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: "white"
    }

    stateObjects.teamSelectScene = new PIXI.Container();
    stateObjects.activeScene = stateObjects.teamSelectScene;
    app.stage.addChild(stateObjects.teamSelectScene);

    stateObjects.controllerScene = new PIXI.Container();
    const moveLeftButton = new TouchButton(10, 10, 80, 80, 0xFF0000, 3, 0xFFFF00, outlineAlpha = 1, "<-", textStyle, onTap = null);
    moveLeftButton.onHoverStart = function (e) {
        client.event.emit(`moveLeft${worldID}`, stateObjects.playerID);
    };
    moveLeftButton.onHoverEnd = function (e) {
        client.event.emit(`stopMove${worldID}`, stateObjects.playerID);
    };
    stateObjects.controllerScene.addChild(moveLeftButton);

    const moveRightButton = new TouchButton(100, 10, 80, 80, 0xFF0000, 3, 0xFFFF00, outlineAlpha = 1, "->", textStyle, onTap = null);
    moveRightButton.onHoverStart = function (e) {
        client.event.emit(`moveRight${worldID}`, stateObjects.playerID);
    };
    moveRightButton.onHoverEnd = function (e) {
        client.event.emit(`stopMove${worldID}`, stateObjects.playerID);
    };
    stateObjects.controllerScene.addChild(moveRightButton);

    stateObjects.controllerScene.visible = false;
    app.stage.addChild(stateObjects.controllerScene);

    //Set the game state
    state = control;

    //Start the game loop 
    app.ticker.add(delta => gameLoop(delta));
}

function setupDisplay() {
    //Resets the room db
    db.collection("rooms").doc(worldID).collection("data").doc("playerCount").set({
        count: 0
    })
        .then(function () {
            db.collection("rooms").doc(worldID).collection("data").doc("playerCount")
                .onSnapshot(function (doc) {
                    playerLogin(doc.data().count - 1);
                });
        });

    client.event.subscribe(`moveLeft${worldID}`, moveLeft);
    client.event.subscribe(`moveRight${worldID}`, moveRight);
    client.event.subscribe(`stopMove${worldID}`, stopMove);

    stateObjects.players = [];

    //Capture the keyboard arrow keys
    stateObjects.confirm = keyboard("Enter");
    stateObjects.back = keyboard("Escape");

    stateObjects.teamSelectScene = new PIXI.Container();
    let instructions = new PIXI.Text("Press Enter to start the game", {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: "white"
    });
    instructions.x = 10;
    instructions.y = 10;
    stateObjects.teamSelectScene.addChild(instructions);
    stateObjects.activeScene = stateObjects.teamSelectScene;
    app.stage.addChild(stateObjects.teamSelectScene);

    stateObjects.gameScene = new PIXI.Container();
    app.stage.addChild(stateObjects.gameScene);

    stateObjects.confirm.press = function (e) {
        db.collection("rooms").doc(worldID).collection("data").doc("gameState").set({
            state: "game"
        })
            .then(function () {
                console.log("Successfuly moved to game!");
            })
            .catch(function (error) {
                console.error("Error writing document: ", error);
            });
    };

    db.collection("rooms").doc(worldID).collection("data").doc("gameState").set({
        state: "setup"
    });

    //Set the game state
    state = play;

    //Start the game loop 
    app.ticker.add(delta => gameLoop(delta));
}

function onTouch(event) {
    if (event.targetTouches) {
        stateObjects.touchX = event.targetTouches[0].clientX;
        stateObjects.touchY = event.targetTouches[0].clientY;
    }
}

function onTouchEnd(event) {
    stateObjects.touchX = -1;
    stateObjects.touchY = -1;
    if (stateObjects.activeScene) {
        stateObjects.activeScene.children.forEach(function (child) {
            if (child instanceof TouchButton) {
                if (child.hovered) {
                    if (child.onHoverEnd) {
                        child.onHoverEnd();
                    }
                    child.hovered = false;
                }
            }
        });
    }
    console.log("Touch ended");
}

function onScroll() {
    window.scroll(0, 0);
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
            if (child instanceof TouchButton) {
                if (child.onHoverStart && !child.hovered && child.hoveredOver(stateObjects.touchX, stateObjects.touchY)) {
                    child.onHoverStart();
                    child.hovered = true;
                }
                else if (child.hovered && !child.hoveredOver(stateObjects.touchX, stateObjects.touchY)) {
                    if (child.onHoverEnd) {
                        child.onHoverEnd();
                    }
                    child.hovered = false;
                }
            }
        });
    }
}

function moveLeft(value) {
    stateObjects.players[value].vx = -3;
}

function moveRight(value) {
    stateObjects.players[value].vx = 3;
}

function stopMove(value){
    stateObjects.players[value].vx = 0;
}

function playerLogin(id) {
    //Stops a player from being generated the first time the script connects to the db
    if (id == stateObjects.players.length) {
        console.log("Logging in");
        //make a Player stand-in
        let player = new Player(id);
        stateObjects.gameScene.addChild(player);
        stateObjects.players.push(player);
        console.log("Now joining: Player ID " + id);
    } else {
        console.log("Denied false login: " + id + "|" + stateObjects.players.length);
    }
}

function switchState(newState) {
    if (newState == "setup") {
        stateObjects.teamSelectScene.visible = true;
        if (isMobile) {
            stateObjects.controllerScene.visible = false;
        }
        else {
            stateObjects.gameScene.visible = false;
        }
        stateObjects.activeScene = stateObjects.teamSelectScene;
    }
    if (newState == "game") {
        stateObjects.teamSelectScene.visible = false;
        if (isMobile) {
            stateObjects.controllerScene.visible = true;
            stateObjects.activeScene = stateObjects.controllerScene;
        }
        else {
            stateObjects.gameScene.visible = true;
            stateObjects.activeScene = stateObjects.gameScene;
            stateObjects.confirm.press = null;
        }
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