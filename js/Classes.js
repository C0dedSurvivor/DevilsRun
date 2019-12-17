class Mover extends PIXI.Graphics {
    constructor() {
        super();
        this.vx = 0;
        this.vy = 0;
    }

    get boundingObjects() {
        return [
            new CollisionPoly([
                new PIXI.Point(this.x, this.y),
                new PIXI.Point(this.x + this.width, this.y),
                new PIXI.Point(this.x + this.width, this.y + this.height),
                new PIXI.Point(this.x, this.y + this.height)
            ])
        ]
    }

    move(delta) {
        this.vy += this.ay * delta;
        //If falling
        if (this.vy > 0) {
            let distToFloor = getClosestFloorDistance(this);
            if (distToFloor < this.vy * delta) {
                this.vy = 0;
                this.y += distToFloor;
            }
            else {
                this.y += this.vy * delta;
            }
        }
        //If rising
        else if (this.vy < 0) {
            let distToCeiling = getClosestCeilingDistance(this);
            if (distToCeiling > this.vy * delta) {
                this.vy = 0;
                this.y += distToCeiling;
            }
            else {
                this.y += this.vy * delta;
            }
        }

        //If moving right
        if (this.vx > 0) {
            let distToRightWall = getClosestRightWallDistance(this);
            if (distToRightWall < this.vx * delta) {
                this.x += distToRightWall;
            }
            else {
                this.x += this.vx * delta;
            }
        }
        //If moving left
        else if (this.vx < 0) {
            let distToLeftWall = getClosestLeftWallDistance(this);
            if (distToLeftWall > this.vx * delta) {
                this.x += distToLeftWall;
            }
            else {
                this.x += this.vx * delta;
            }
        }
    }
}

class Player extends Mover {
    constructor(id, color = 0xFF00FF, x = 125, y = 60) {
        super();
        this.beginFill(color);
        this.drawRect(0, 0, 40, 40);
        this.endFill();
        this.label = new PIXI.Text(id, {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: "white",
            align: "center"
        });
        this.label.anchor.set(0.5, 0.5);
        this.label.x = 20;
        this.label.y = 20;
        this.addChild(this.label);
        this.x = x;
        this.y = y;
        this.ay = GRAVITY;
        this.health = 3;
        this.iFrameTimer = 0;
    }

    die() {
        this.clear();
        this.beginFill(0xa1a1a1);
        this.drawRect(10, 0, 20, 40);
        this.drawRect(0, 10, 40, 10);
        this.endFill();
        this.label.style.fill = "black";
        this.vx = 0;
        this.vy = 0;
    }
}

class Devil extends Mover {
    constructor(id, color = 0xFF0000, x = 125, y = 40) {
        super();
        this.beginFill(color);
        this.drawRect(0, 0, 40, 40);
        this.endFill();
        let label = new PIXI.Text(id, {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: "white",
            align: "center"
        });
        label.anchor.set(0.5, 0.5);
        label.x = 20;
        label.y = 20;
        this.addChild(label);
        this.x = x;
        this.y = y;
        this.ay = 0;
        this.leftLaserCD = 0;
        this.centerLaserCD = 0;
        this.rightLaserCD = 0;
        this.health = 1;
    }

    update(delta) {
        if (this.leftLaserCD > 0) {
            this.leftLaserCD -= delta;
        }
        if (this.centerLaserCD > 0) {
            this.centerLaserCD -= delta;
        }
        if (this.rightLaserCD > 0) {
            this.rightLaserCD -= delta;
        }
    }
}

class TouchButton extends PIXI.Graphics {
    constructor(x, y, width, height, fillColor, outlineWidth, outlineColor, outlineAlpha = 1, text = "", textStyle = null, onTap = null) {
        super();
        this.beginFill(fillColor);
        this.lineStyle(outlineWidth, outlineColor, outlineAlpha);
        this.drawRect(0, 0, width, height);
        this.endFill();
        if (text) {
            let buttonText = new PIXI.Text(text);
            textStyle.align = 'center';
            buttonText.style = textStyle;
            buttonText.anchor.set(0.5, 0.5);
            buttonText.x = width / 2;
            buttonText.y = height / 2;
            this.addChild(buttonText);
        }
        this.x = x;
        this.y = y;
        this.interactive = true;
        this.hovered = false;
        if (onTap) {
            this.on('tap', onTap);
        }
    }

    hoveredOver(x, y) {
        return (x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height);
    }
}

class Ground extends PIXI.Graphics {
    constructor(x, y, width, height) {
        super();
        this.beginFill(0x753a1a);
        this.drawRect(0, 0, width, height);
        this.endFill();
        this.beginFill(0x1bba06);
        this.drawRect(0, 0, width, Math.min(height / 4, 10));
        this.endFill();
        this.x = x;
        this.y = y;
    }
}

class Laser extends PIXI.Graphics {
    constructor(points, timer, alpha = 1) {
        super();
        this.points = points;
        this.boundingObjects = [new CollisionPoly(points)];
        this.alpha = alpha;
        this.beginFill(0xf7f719);
        this.drawPolygon(points);
        this.endFill();
        this.fullTimer = timer;
        this.timer = timer;
    }

    update(delta) {
        this.timer -= delta;
    }
}

class CollisionPoly {
    constructor(vertexList) {
        this.vertexList = vertexList;
    }
}

class CollisionCircle {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
    }
}