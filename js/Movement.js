function moveLeft(value) {
    stateObjects.players[value].vx = -3;
}

function moveRight(value) {
    stateObjects.players[value].vx = 3;
}

function stopMove(value) {
    stateObjects.players[value].vx = 0;
}

function jump(value) {
    console.log("Trying to jump");
    if (getClosestFloorDistance(stateObjects.players[value]) == 0) {
        console.log("Jumping");
        stateObjects.players[value].vy = -17;
    }
}

function pointIntersection(point, min, max) {
    return point >= min && point <= max;
}

function intersection(min1, max1, min2, max2) {
    return pointIntersection(min1, min2, max2) || pointIntersection(max1, min2, max2) || pointIntersection(min2, min1, max1) || pointIntersection(max2, min1, max1);
}

function getClosestCeilingDistance(player) {
    if (stateObjects.activeScene == stateObjects.gameScene) {
        let minDistance = Number.MIN_SAFE_INTEGER;
        stateObjects.activeScene.children.forEach(function (child) {
            //If the player is in the same column as this section of ground
            if (child instanceof Ground && intersection(player.x, player.x + player.width, child.x, child.x + child.width)) {
                let distance = child.y + child.height - player.y;
                if (distance <= 0 && distance > minDistance) {
                    minDistance = distance;
                }
            }
        });
        return minDistance;
    }
    else {
        return 0;
    }
}

function getClosestFloorDistance(player) {
    if (stateObjects.activeScene == stateObjects.gameScene) {
        let minDistance = Number.MAX_SAFE_INTEGER;
        stateObjects.activeScene.children.forEach(function (child) {
            //If the player is in the same column as this section of ground
            if (child instanceof Ground && intersection(player.x, player.x + player.width, child.x, child.x + child.width)) {
                let distance = child.y - (player.y + player.height);
                if (distance >= 0 && distance < minDistance) {
                    minDistance = distance;
                }
            }
        });
        return minDistance;
    }
    else {
        return 0;
    }
}

function getClosestLeftWallDistance(player) {
    if (stateObjects.activeScene == stateObjects.gameScene) {
        let minDistance = Number.MIN_SAFE_INTEGER;
        stateObjects.activeScene.children.forEach(function (child) {
            //If the player is in the same column as this section of ground
            if (child instanceof Ground && intersection(player.y, player.y + player.height, child.y, child.y + child.height)) {
                let distance = child.x + child.width - player.x;
                if (distance <= 0 && distance > minDistance) {
                    minDistance = distance;
                }
            }
        });
        return minDistance;
    }
    else {
        return 0;
    }
}

function getClosestRightWallDistance(player) {
    if (stateObjects.activeScene == stateObjects.gameScene) {
        let minDistance = Number.MAX_SAFE_INTEGER;
        stateObjects.activeScene.children.forEach(function (child) {
            //If the player is in the same column as this section of ground
            if (child instanceof Ground && intersection(player.y, player.y + player.height, child.y, child.y + child.height)) {
                let distance = child.x - (player.x + player.width);
                if (distance >= 0 && distance < minDistance) {
                    minDistance = distance;
                }
            }
        });
        return minDistance;
    }
    else {
        return 0;
    }
}