class Card {
    SCALE;
    SCALE_DEFAULT = 0.4;
    constructor(x, y, group, value, player, game) {
        this.pos = new Vector2(x, y);
        this.size;
        this.group = group;
        this.value = value;
        this.texture;
        this.backgroundTexture;
        this.ondrag = false;
        this.shadowOffset = new Vector2(5, 5);
        this.initTexture(group + value);
        this.setScale(this.SCALE_DEFAULT);
        this.switched = true;
        this.onSwitched = false;
        this.switchValue = 210;
        this.increaseSign = -1;
        this.allowShadow = false;
        this.player = player;
        this.unleashed = null;
        this.game = game;
        this.getUp = false;
        this.onCollecting = false;
        this.blocked = false;
        this.finishScaling = true;
        this.target = null;
        this.animationCollectedSize = 1;
    }
    collectedAnimation() {
        const animation = new Animation2({ begin: 1, end: 1.25, time: 200 });
        animation.onUpdate(value => {
            this.animationCollectedSize = value;
            this.setToFirstPlace();
        });
        animation.onFinish(() => this.onCollecting = false);
        const animationToBegin = new Animation2({ time: 100 });
        animationToBegin.onFinish(() => {
            animation.start();
            this.onCollecting = true;
        });
        animationToBegin.start();
    }
    repositionToTarget() {
        this.pos = this.pos.add(this.target.sub(this.pos).mul(.1));
    }
    restart(x, y) {
        this.pos = new Vector2(x, y);
        this.player = null;
        this.switched = true;
        this.onSwitched = false;
        this.allowShadow = false;
        this.unleashed = null;
        this.ondrag = false;
        this.getUp = false;
        this.onCollecting = false;
        this.animationCollectedSize = 1;
        this.finishScaling = true;
        this.target = null;
        this.setToFirstPlace();
    }
    setScale(value) {
        this.size = new Vector2(210, 330).mul(value);
        this.SCALE = value;
    }
    initTexture(value) {

        this.texture = new Image();
        this.texture.src = './assets/textures/' + value + '.png';

        this.texture.onload = () => {
            this.game.fileLoadedCount += 1;
        };

        this.backgroundTexture = new Image();
        this.backgroundTexture.src = './assets/textures/cardBackground.png';
    }
    repositionTarget(target) {
        this.pos = this.pos.add(target.sub(this.pos).mul(.1));
    }
    setToFirstPlace() {
        const index = this.game.cards.findIndex(card => {
            return card === this;
        });
        this.game.cards.splice(index, 1);
        this.game.cards.push(this);
    }
    selectedEffect() {
        context.beginPath();
        context.lineWidth = 3;
        context.shadowColor = '#00000000';
        context.strokeStyle = '#68ff00';
        context.translate(this.pos.x, this.pos.y);
        context.rect(this.size.x * -.5, this.size.y * -.5, this.size.x, this.size.y);
        context.setLineDash([120, 15]);
        context.stroke();
        context.closePath();
        context.resetTransform();

        context.setLineDash([]);
    }
    borderBoxEffect() {
        context.beginPath();
        context.lineWidth = 1;
        context.shadowColor = '#00000000';
        context.strokeStyle = '#3d3d3d';
        context.translate(this.pos.x, this.pos.y);
        context.rect(this.size.x * -.5, this.size.y * -.5, this.size.x, this.size.y);
        context.stroke();
        context.closePath();
        context.resetTransform();
    }
    animateCardSelected() {
        if (this.ondrag) {
            if (this.SCALE < 0.5) {
                this.setScale(this.SCALE + 0.01);
            }
        } else {
            if (this.SCALE > this.SCALE_DEFAULT) {
                this.setScale(this.SCALE - 0.02);
                this.finishScaling = false;
            } else {
                if (!this.finishScaling) {
                    this.setScale(this.SCALE_DEFAULT);
                    this.finishScaling = true;
                }
            }
        }
        if (this.onSwitched) {
            if (this.size.x <= 0) {
                this.increaseSign *= -1;
                this.switched = !this.switched;
            }
            this.size.x += this.increaseSign * 10;
            if (this.size.x >= 210 * this.SCALE) {
                this.size.x = 210 * this.SCALE;
                this.onSwitched = false;
                this.increaseSign *= -1;
            }
        }
    }
    showShadow() {
        context.shadowColor = '#00000099';
        context.shadowOffsetX = this.shadowOffset.x;
        context.shadowOffsetY = this.shadowOffset.y;
        context.shadowBlur = 5;
    }
    draw() {

        if (this.allowShadow) {
            this.showShadow();
        } else {
            context.shadowColor = '#00000000';
        }
        context.imageSmoothingEnabled = true;
        context.translate(this.pos.x, this.pos.y);
        if (!this.switched) {
            context.drawImage(this.texture, this.size.x * -.5, this.size.y * -.5, this.size.x, this.size.y);
        } else {
            context.drawImage(this.backgroundTexture, this.size.x * -.5, this.size.y * -.5, this.size.x, this.size.y);
        }
        context.resetTransform();

        this.borderBoxEffect();


        if (this.ondrag) {
            this.getUp = true;
            this.shadowOffset = new Vector2(20, 20);
            this.selectedEffect();
        } else {
            this.shadowOffset = new Vector2(5, 5);
            if (this.getUp && this.player === this.game.players[0]) {
                new Audio('./songs/reland.ogg').play();
                this.getUp = false;
            }
        }

        if (this.onCollecting) {
            const size = this.animationCollectedSize;
            const a = (size - 1) * 4;
            const color = `rgba(0, 223, 255, ${1 - a})`;
            strokeRect(this.pos, this.size.x * size, this.size.y * size, color, 5);
        }
    }
    update() {
        this.animateCardSelected();
        this.draw();
    }
}