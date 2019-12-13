//https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
function onTouchStart(event) {
    event.preventDefault();
    let touches = event.changedTouches;
    for (let i = 0; i < touches.length; i++) {
        console.log("touchstart:" + i + "...");
        stateObjects.currentTouches.push(copyTouch(touches[i]));
    }
    checkTouchInteractions();
}

function onTouchMove(event) {
    event.preventDefault();
    let touches = event.changedTouches;

    for (let i = 0; i < touches.length; i++) {
        let idx = ongoingTouchIndexById(touches[i].identifier);
        if (idx >= 0) {
            stateObjects.currentTouches.splice(idx, 1, copyTouch(touches[i]));  // swap in the new touch record
        } else {
            console.log("can't figure out which touch to continue");
        }
    }
    checkTouchInteractions();
}

function onTouchEnd(event) {
    event.preventDefault();
    console.log("touchend");
    let touches = event.changedTouches;

    for (let i = 0; i < touches.length; i++) {
        let idx = ongoingTouchIndexById(touches[i].identifier);

        if (idx >= 0) {
            stateObjects.currentTouches.splice(idx, 1);  // remove it; we're done
        } else {
            console.log("can't figure out which touch to end");
        }
    }
    checkTouchInteractions();
}

function onTouchCancel(event) {
    event.preventDefault();
    console.log("touchcancel.");
    let touches = event.changedTouches;

    for (let i = 0; i < touches.length; i++) {
        let idx = ongoingTouchIndexById(touches[i].identifier);
        stateObjects.currentTouches.splice(idx, 1);  // remove it; we're done
    }
    checkTouchInteractions();
}

function copyTouch({ identifier, pageX, pageY }) {
    return { identifier, pageX, pageY };
}

function ongoingTouchIndexById(idToFind) {
    for (let i = 0; i < stateObjects.currentTouches.length; i++) {
        if (stateObjects.currentTouches[i].identifier == idToFind) {
            return i;
        }
    }
    return -1;    // not found
}

function checkTouchInteractions() {
    if (stateObjects.activeScene) {
        stateObjects.activeScene.children.forEach(function (child) {
            if (child instanceof TouchButton) {
                if (child.hovered) {
                    child.hovered = false;
                    for (let i = 0; i < stateObjects.currentTouches.length; i++) {
                        if (child.hoveredOver(stateObjects.currentTouches[i].pageX, stateObjects.currentTouches[i].pageY)) {
                            child.hovered = true;
                        }
                    }
                    if (!child.hovered && child.onHoverEnd) {
                        child.onHoverEnd();
                    }
                } else {
                    for (let i = 0; i < stateObjects.currentTouches.length; i++) {
                        if (child.hoveredOver(stateObjects.currentTouches[i].pageX, stateObjects.currentTouches[i].pageY)) {
                            child.hovered = true;
                        }
                    }
                    if (child.hovered && child.onHoverStart) {
                        child.onHoverStart();
                    }
                }
            }
        });
    }
}