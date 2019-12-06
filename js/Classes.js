class Mover extends PIXI.Graphics {
    constructor() {
        super();
        this.vx = 0;
        this.vy = 0;
    }

    move(delta){
        this.vy += this.ay * delta;
        //If falling
        if(this.vy > 0){
            let distToFloor = getClosestFloorDistance(this);
            if(distToFloor < this.vy * delta){
                this.vy = 0;
                this.y += distToFloor;
            }
            else{
                this.y += this.vy * delta;
            }
        }
        //If rising
        else if(this.vy < 0){
            let distToCeiling = getClosestCeilingDistance(this);
            if(distToCeiling > this.vy * delta){
                this.vy = 0;
                this.y += distToCeiling;
            }
            else{
                this.y += this.vy * delta;
            }
        }
        
        //If moving right
        if(this.vx > 0){
            let distToRightWall = getClosestRightWallDistance(this);
            if(distToRightWall < this.vx * delta){
                this.x += distToRightWall;
            }
            else{
                this.x += this.vx * delta;
            }
        }
        //If moving left
        else if(this.vx < 0){
            let distToLeftWall = getClosestLeftWallDistance(this);
            if(distToLeftWall > this.vx * delta){
                this.x += distToLeftWall;
            }
            else{
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
        let label = new PIXI.Text(id, {
            fontFamily : 'Arial',
            fontSize: 24,
            fill : "white"
        });
        label.style.align = 'center';
        label.anchor.set(0.5, 0.5);
        label.x = 20;
        label.y = 20;
        this.addChild(label);
        this.x = x;
        this.y = y;
        this.ay = GRAVITY;
    }
}

class Devil extends Mover {
    constructor(id, color = 0xFF0000, x = 125, y = 40) {
        super();
        this.beginFill(color);
        this.drawCircle(0, 0, 20);
        this.endFill();
        let label = new PIXI.Text(id, {
            fontFamily : 'Arial',
            fontSize: 24,
            fill : "white"
        });
        label.style.align = 'center';
        label.anchor.set(0.5, 0.5);
        this.addChild(label);
        this.x = x;
        this.y = y;
        this.ay = 0;
    }
}

class TouchButton extends PIXI.Graphics {
    constructor(x, y, width, height, fillColor, outlineWidth, outlineColor, outlineAlpha = 1, text = "", textStyle = null, onTap = null) {
        super();
        this.beginFill(fillColor);
        this.lineStyle(outlineWidth, outlineColor, outlineAlpha);
        this.drawRect(0, 0, width, height);
        this.endFill();
        if(text){
            let buttonText = new PIXI.Text(text);
            textStyle.align = 'center';
            buttonText.style = textStyle;
            buttonText.anchor.set(0.5, 0.5);
            buttonText.x = width/2;
            buttonText.y = height/2;
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

class Ground extends PIXI.Graphics{
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