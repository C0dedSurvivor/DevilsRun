// #1 - Create a new Pixi application
// http://pixijs.download/dev/docs/PIXI.Application.html
const app = new PIXI.Application(600, 400);

//Sets up the multiplayer connection
let db = firebase.firestore();

const client = new DeepstreamClient('wss://devilsrunscribe.csh.rit.edu:9090')
client.login()

let stateObjects = {};

let isMobile, state, worldID;

app.renderer.backgroundColor = 0x42dcff;

const GRAVITY = 1;

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

    let roomDocRef = db.collection("rooms").doc(room);

    roomDocRef.get().then(function (doc) {
        if (doc.exists) {
            console.log("Document data:", doc.data());
            db.runTransaction(function (transaction) {
                return transaction.get(roomDocRef.collection("data").doc("playerCount")).then(function (roomDoc) {
                    if (!roomDoc.exists) {
                        throw "Document does not exist!";
                    }

                    let playerCount = roomDoc.data().count + 1;
                    if (playerCount <= 8) {
                        transaction.update(roomDocRef.collection("data").doc("playerCount"), { count: firebase.firestore.FieldValue.increment(1) });
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
    stateObjects.currentTouches = [];

    app.view.addEventListener("touchstart", onTouchStart, false);
    app.view.addEventListener("touchmove", onTouchMove, false);
    app.view.addEventListener("touchend", onTouchEnd, false);
    app.view.addEventListener("touchcancel", onTouchCancel, false);
    document.addEventListener("scroll", onScroll);

    textStyle = {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: "white"
    }

    stateObjects.team = "Runners";

    stateObjects.teamSelectScene = new PIXI.Container();

    let teamInfoText = new PIXI.Text(`Player ID: ${stateObjects.playerID} | Team: Runners`, {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: "black"
    });
    teamInfoText.x = 200;
    teamInfoText.y = 25;
    teamInfoText.anchor.set(0.5, 0.5);
    stateObjects.teamSelectScene.addChild(teamInfoText);

    const switchRunnerButton = new TouchButton(10, 50, 185, 185, 0xFF0000, 3, 0xFFFF00, outlineAlpha = 1, "Join Runners", textStyle,
        function (e) {
            app.renderer.backgroundColor = 0x42dcff;
            stateObjects.team = "Runners";
            teamInfoText.text = `Player ID: ${stateObjects.playerID} | Team: ${stateObjects.team}`;
            client.event.emit(`switchRunner${worldID}`, stateObjects.playerID);
        });
    stateObjects.teamSelectScene.addChild(switchRunnerButton);

    const switchDevilButton = new TouchButton(205, 50, 185, 185, 0xFF0000, 3, 0xFFFF00, outlineAlpha = 1, "Join Devils", textStyle,
        function (e) {
            app.renderer.backgroundColor = 0xc71400;
            stateObjects.team = "Devils";
            teamInfoText.text = `Player ID: ${stateObjects.playerID} | Team: ${stateObjects.team}`;
            client.event.emit(`switchDevil${worldID}`, stateObjects.playerID);
        });
    stateObjects.teamSelectScene.addChild(switchDevilButton);

    app.stage.addChild(stateObjects.teamSelectScene);

    stateObjects.controllerScene = new PIXI.Container();
    stateObjects.controllerScene.visible = false;

    stateObjects.playerIDText = new PIXI.Text(`Player ID: ${stateObjects.playerID}`, {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: "black"
    });
    stateObjects.playerIDText.x = 200;
    stateObjects.playerIDText.y = 25;
    stateObjects.playerIDText.anchor.set(0.5, 0.5);
    stateObjects.controllerScene.addChild(stateObjects.playerIDText);

    const moveLeftButton = new TouchButton(10, 50, 185, 185, 0xFF0000, 3, 0xFFFF00, outlineAlpha = 1, "<-", textStyle);
    moveLeftButton.onHoverStart = function (e) {
        client.event.emit(`moveLeft${worldID}`, stateObjects.playerID);
    };
    moveLeftButton.onHoverEnd = function (e) {
        client.event.emit(`stopMove${worldID}`, stateObjects.playerID);
    };
    stateObjects.controllerScene.addChild(moveLeftButton);

    const moveRightButton = new TouchButton(205, 50, 185, 185, 0xFF0000, 3, 0xFFFF00, outlineAlpha = 1, "->", textStyle);
    moveRightButton.onHoverStart = function (e) {
        client.event.emit(`moveRight${worldID}`, stateObjects.playerID);
    };
    moveRightButton.onHoverEnd = function (e) {
        client.event.emit(`stopMove${worldID}`, stateObjects.playerID);
    };
    stateObjects.controllerScene.addChild(moveRightButton);

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
    client.event.subscribe(`jump${worldID}`, jump);
    client.event.subscribe(`leftLaser${worldID}`, shootLeftLaser);
    client.event.subscribe(`laser${worldID}`, shootDownwardLaser);
    client.event.subscribe(`rightLaser${worldID}`, shootRightLaser);
    client.event.subscribe(`stopMove${worldID}`, stopMove);
    client.event.subscribe(`switchRunner${worldID}`, switchRunner);
    client.event.subscribe(`switchDevil${worldID}`, switchDevil);

    stateObjects.players = [];
    stateObjects.playerTeams = [];
    stateObjects.attacks = [];

    //Capture the keyboard arrow keys
    stateObjects.confirm = keyboard("Enter");
    stateObjects.back = keyboard("Escape");

    let textStyle = {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: "black",
        align: "center"
    }

    stateObjects.teamSelectScene = new PIXI.Container();

    stateObjects.playerCountText = new PIXI.Text("Number of players: 0", textStyle);
    stateObjects.playerCountText.x = 300;
    stateObjects.playerCountText.y = 100;
    stateObjects.playerCountText.anchor.set(0.5, 0.5);
    stateObjects.teamSelectScene.addChild(stateObjects.playerCountText);

    stateObjects.playerTeamText = new PIXI.Text("Runners: None\nDevils: None", textStyle);
    stateObjects.playerTeamText.x = 300;
    stateObjects.playerTeamText.y = 160;
    stateObjects.playerTeamText.anchor.set(0.5, 0.5);
    stateObjects.teamSelectScene.addChild(stateObjects.playerTeamText);
    app.stage.addChild(stateObjects.teamSelectScene);

    let instructions = new PIXI.Text(`Connect on your phone by going to\nhttps://people.rit.edu/jbb7824/DevilsRunTest\nand using room code ${worldID}.\n When everyone has joined, press Enter to start the game`, {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: "black",
        align: "center"
    });
    instructions.x = 300;
    instructions.y = 240;
    instructions.anchor.set(0.5, 0.5);
    stateObjects.teamSelectScene.addChild(instructions);

    stateObjects.gameScene = new PIXI.Container();
    stateObjects.gameScene.addChild(new Ground(0, 300, 200, 100));
    stateObjects.gameScene.addChild(new Ground(200, 350, 200, 50));
    stateObjects.gameScene.addChild(new Ground(400, 300, 200, 100));
    stateObjects.gameScene.addChild(new Ground(200, 150, 200, 50));
    stateObjects.gameScene.addChild(new Ground(-5, 0, 5, 400));
    stateObjects.gameScene.addChild(new Ground(600, 0, 5, 400));

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

function switchRunner(id) {
    stateObjects.playerTeams[id] = "Runners";
    updateTeamText();
}

function switchDevil(id) {
    stateObjects.playerTeams[id] = "Devils";
    updateTeamText();
}

function updateTeamText() {
    let runnerText = "Runners:";
    let devilText = "Devils:";
    for (let i = 0; i < stateObjects.playerTeams.length; i++) {
        if (stateObjects.playerTeams[i] == "Runners") {
            runnerText += ` ${i}`;
        } else {
            devilText += ` ${i}`;
        }
    }
    if (runnerText == "Runners:") { runnerText += " None"; }
    if (devilText == "Devils:") { devilText += " None"; }
    stateObjects.playerTeamText.text = `${runnerText}\n${devilText}`;
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
        stateObjects.players.forEach(function (player) { player.move(delta); });
        for (let i = 0; i < stateObjects.attacks.length; i++) {
            stateObjects.attacks[i].update(delta);
            if (stateObjects.attacks[i].timer <= 0) {
                stateObjects.activeScene.removeChild(stateObjects.attacks[i]);
                stateObjects.attacks.splice(i, 1);
                i--;
            }
        }
        for (let i = 0; i < stateObjects.players.length; i++) {
            if (stateObjects.players[i] instanceof Player) {
                if (stateObjects.players[i].iFrameTimer <= 0) {
                    for (let j = 0; j < stateObjects.attacks.length; j++) {
                        if (colliding(stateObjects.players[i], stateObjects.attacks[j])) {
                            console.log("COLLIDING!!!");
                        } else {
                            console.log("not colliding");
                        }
                    }
                } else {
                    stateObjects.players[i].iFrameTimer -= delta;
                }
            }
        }
    }
}

function control(delta) {
}

function shootLeftLaser(id) {
    stateObjects.attacks.push(new Laser([
        new PIXI.Point(stateObjects.players[id].x + stateObjects.players[id].width / 4, stateObjects.players[id].y + stateObjects.players[id].height / 2),
        new PIXI.Point(stateObjects.players[id].x + stateObjects.players[id].width * 0.75, stateObjects.players[id].y + stateObjects.players[id].height / 2),
        new PIXI.Point(stateObjects.players[id].x + stateObjects.players[id].width * 0.75 - 150, stateObjects.players[id].y + stateObjects.players[id].height / 2 + 400),
        new PIXI.Point(stateObjects.players[id].x + stateObjects.players[id].width / 4 - 150, stateObjects.players[id].y + stateObjects.players[id].height / 2 + 400)]
        , 10));
    stateObjects.activeScene.addChild(stateObjects.attacks[stateObjects.attacks.length - 1]);
}

function shootDownwardLaser(id) {
    stateObjects.attacks.push(new Laser([
        new PIXI.Point(stateObjects.players[id].x + stateObjects.players[id].width / 4, stateObjects.players[id].y + stateObjects.players[id].height / 2),
        new PIXI.Point(stateObjects.players[id].x + stateObjects.players[id].width * 0.75, stateObjects.players[id].y + stateObjects.players[id].height / 2),
        new PIXI.Point(stateObjects.players[id].x + stateObjects.players[id].width * 0.75, stateObjects.players[id].y + stateObjects.players[id].height / 2 + 400),
        new PIXI.Point(stateObjects.players[id].x + stateObjects.players[id].width / 4, stateObjects.players[id].y + stateObjects.players[id].height / 2 + 400)]
        , 10));
    stateObjects.activeScene.addChild(stateObjects.attacks[stateObjects.attacks.length - 1]);
}

function shootRightLaser(id) {
    stateObjects.attacks.push(new Laser([
        new PIXI.Point(stateObjects.players[id].x + stateObjects.players[id].width / 4, stateObjects.players[id].y + stateObjects.players[id].height / 2),
        new PIXI.Point(stateObjects.players[id].x + stateObjects.players[id].width * 0.75, stateObjects.players[id].y + stateObjects.players[id].height / 2),
        new PIXI.Point(stateObjects.players[id].x + stateObjects.players[id].width * 0.75 + 150, stateObjects.players[id].y + stateObjects.players[id].height / 2 + 400),
        new PIXI.Point(stateObjects.players[id].x + stateObjects.players[id].width / 4 + 150, stateObjects.players[id].y + stateObjects.players[id].height / 2 + 400)]
        , 10));
    stateObjects.activeScene.addChild(stateObjects.attacks[stateObjects.attacks.length - 1]);
}

function playerLogin(id) {
    //Stops a player from being generated the first time the script connects to the db
    if (id == stateObjects.playerTeams.length) {
        console.log("Logging in: Player ID " + id);
        switchRunner(id);
        stateObjects.playerCountText.text = `Number of players: ${stateObjects.playerTeams.length}`;
    } else {
        console.log("Denied false login: " + id + "|" + stateObjects.playerTeams.length);
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
            let buttonStyle = {
                fontFamily: 'Arial',
                fontSize: 24,
                fill: "black"
            };
            if (stateObjects.team == "Runners") {
                //Adds the jump button to the controller
                const jumpButton = new TouchButton(10, 245, 380, 150, 0xFF0000, 3, 0xFFFF00, outlineAlpha = 1, "Jump", buttonStyle);
                jumpButton.onHoverStart = function (e) {
                    client.event.emit(`jump${worldID}`, stateObjects.playerID);
                };
                stateObjects.controllerScene.addChild(jumpButton);
            } else {
                //Adds the laser buttons to the controller
                const leftLaserButton = new TouchButton(10, 245, 120, 150, 0xFF0000, 3, 0xFFFF00, outlineAlpha = 1, "Laser", buttonStyle);
                leftLaserButton.onHoverStart = function (e) {
                    client.event.emit(`leftLaser${worldID}`, stateObjects.playerID);
                };
                stateObjects.controllerScene.addChild(leftLaserButton);
                const laserButton = new TouchButton(140, 245, 120, 150, 0xFF0000, 3, 0xFFFF00, outlineAlpha = 1, "Laser", buttonStyle);
                laserButton.onHoverStart = function (e) {
                    client.event.emit(`laser${worldID}`, stateObjects.playerID);
                };
                stateObjects.controllerScene.addChild(laserButton);
                const rightLaserButton = new TouchButton(270, 245, 120, 150, 0xFF0000, 3, 0xFFFF00, outlineAlpha = 1, "Laser", buttonStyle);
                rightLaserButton.onHoverStart = function (e) {
                    client.event.emit(`rightLaser${worldID}`, stateObjects.playerID);
                };
                stateObjects.controllerScene.addChild(rightLaserButton);
            }
        }
        else {
            for (let i = 0; i < stateObjects.playerTeams.length; i++) {
                //make a Player stand-in
                let player;
                if (stateObjects.playerTeams[i] == "Runners") {
                    player = new Player(i);
                } else {
                    player = new Devil(i);
                }
                stateObjects.gameScene.addChild(player);
                stateObjects.players.push(player);
            }
            stateObjects.gameScene.visible = true;
            stateObjects.activeScene = stateObjects.gameScene;
            stateObjects.confirm.press = null;
        }
    }
}