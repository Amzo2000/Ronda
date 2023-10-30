class MiddleCards {
    constructor(pos, game) {
        this.pos = pos;
        this.cards = [];
        this.cardOrigins = [];
        this.constrains = [];
        this.time = 0;
        this.lastGetter = null;
        this.lastCard = null;
        this.isInitCards = false;
        //this.checkIsDerbaFinish = null;
        this.game = game;
    }
    initConstraints() {
        if (this.cards.length <= 5) {
            this.constrains = [
                new Vector2(width * .5, height * .5 - 70),
                new Vector2(width * .5, height * .5 + 70)
            ];
        } else {
            this.constrains = [
                new Vector2(width * .5, height * .5 - 140),
                new Vector2(width * .5, height * .5 + 140)
            ];
        }
    }
    initCardOrigins() {
        this.cardOrigins = [];

        let index = 0;

        // Grid Table (N x 1)
        /*for (let i = -this.cards.length * .5; i < this.cards.length * .5; i++) {
            const step = 100;
            this.cardOrigins.push(this.pos.add(new Vector2(step * (i + .5), 0)));
            this.cards[index].target = this.cardOrigins[index];
            index ++;
        }*/

        // Grid Table (5 x 5)
        let length = this.cards.length < 5 ? this.cards.length : 5;
        for (let i = -length * .5; i < length * .5; i++) {
            if (this.cardOrigins.length === 5) break;
            const yStep = this.cards.length > 5 ? -70 : 0;
            const step = 93;
            this.cardOrigins.push(this.pos.add(new Vector2(step * (i + .5), yStep)));
            this.cards[index].target = this.cardOrigins[index];
            index++;
        }
        if (this.cards.length > 5) {
            length = this.cards.length - 5;
            for (let i = -length * .5; i < length * .5; i++) {
                const step = 93;
                this.cardOrigins.push(this.pos.add(new Vector2(step * (i + .5), 70)));
                this.cards[index].target = this.cardOrigins[index];
                index++;
            }
        }

        this.isInitCards = true;
        this.initConstraints();
    }
    addCard(card) {
        card.allowShadow = false;
        card.player = this;
        this.cards.push(card);
        this.initCardOrigins();
    }
    removeCard(card) {
        const index = this.cards.indexOf(card);
        card.target = null;
        this.cards.splice(index, 1);
        this.isInitCards = false;
    }
    matchOneInTheMiddle(card) {
        return this.cards.find(cardMiddle => {
            return cardMiddle.value === card.value;
        });
    }
    collectCards(card, player) {
        if (!this.game.collectedCards.onCollecting) {
            const cardMatch = this.matchOneInTheMiddle(card);
            if (cardMatch) {
                if (this.lastCard !== cardMatch) {
                    this.lastCard = null;
                    // Commencer à collecter les cartes obtenus.
                    this.game.collectedCards.startCollecting(card, player);
                } else {
                    const anotherPlayer = player === this.game.players[0] ? this.game.players[1] : this.game.players[0];
                    for (let _card of anotherPlayer.cards) {
                        if (_card.value !== cardMatch.value) _card.blocked = true;
                    }
                    this.game.collectedCards.startCollectingDerba(card, cardMatch, player);
                }
                // Celui qui marqué le dernier.
                this.lastGetter = player;
                // Enlever la carte que le joueur a annoncé et donner son adversaire à jouer.
                player.removeCard(card);

            } else {
                this.lastCard = card;
                new Audio('./songs/land.ogg').play();
                this.addCard(card);
                player.removeCard(card);
            }
            //console.log(this.lastCard ? this.lastCard.value : '');
        }
    }
    repositionCards() {
        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];
            card.repositionToTarget();
        }
    }
    collisionToMiddle() {
        const constrains = this.constrains;
        const mouse = this.game.mouse;
        if (mouse.y >= constrains[0].y && mouse.y <= constrains[1].y) {
            return true;
        }
        return;
    }
    drawConstraint() {
        //circle(this.pos, 4, 'red');

        let ondrag = false;
        let onCollision = false;
        for (let card of this.game.players[0].cards) {
            if (card.ondrag) {
                ondrag = true;
                onCollision = this.collisionToMiddle();
                break;
            }
        }

        if (ondrag) {
            this.time += 0.3;
            for (let i = 0; i < this.constrains.length; i++) {
                const constrain = this.constrains[i];
                const sign = i !== 0 ? -1 : 1;
                line(
                    new Vector2(0, constrain.y),
                    new Vector2(width, constrain.y),
                    onCollision ? '#75FFFF' : '#3d3d3d',
                    2,
                    this.time * sign
                );
            }
        } else this.time = 0;
    }
    update() {
        this.drawConstraint();
        this.repositionCards();

        if (!this.game.collectedCards.onCollecting && !this.game.collectedCards.onGettingDerba && !this.isInitCards) {
            this.initCardOrigins();
        }
    }
}