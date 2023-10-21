class MiddleCards {
    constructor(pos, game) {
        this.pos = pos;
        this.cards = [];
        this.cardOrigins = [];
        this.constrains = [
            new Vector2(width * .5, height * .5 - 70),
            new Vector2(width * .5, height * .5 + 70)
        ];
        this.time = 0;
        this.game = game;
    }
    initCardOrigins() {
        this.cardOrigins = [];
        for (let j = 0; j < 2; j++) {
            for (let i = -this.cards.length * .5; i < this.cards.length * .5; i++) {
                const step = 100;
                this.cardOrigins.push(this.pos.add(new Vector2(step * (i + .5), 0)));
            }
        }
    }
    addCard(card) {
        card.allowShadow = false;
        card.player = this;
        this.cards.push(card);
    }
    removeCard(card) {
        const index = this.cards.indexOf(card);
        this.cards.splice(index, 1);
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
                this.game.collectedCards.startCollecting(card, player);
                player.removeCard(card);
            } else {
                new Audio('./songs/land.ogg').play();
                this.addCard(card);
                player.removeCard(card);
            }
        }
    }
    repositionCards() {
        //circle(this.pos, 4, 'red');
        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];
            card.repositionTarget(this.cardOrigins[i]);
        }
    }
    update() {
        this.initCardOrigins();
        this.repositionCards();
    }
}