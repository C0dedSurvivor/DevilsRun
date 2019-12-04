class Player extends PIXI.Graphics {
    constructor(id, color = 0xFF0000, radius = 20, x = 125, y = 50) {
        super();
        this.beginFill(color);
        this.drawCircle(0, 0, radius);
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
        this.vx = 0;
        this.vy = 0;
    }

    move() {
        this.x += this.vx;
        this.y += this.vy;
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