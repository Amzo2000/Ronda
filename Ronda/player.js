class Player {
    constructor(pos, canPlay, game) {
        this.pos = pos;
        this.cards = [];
        this.cardOrigins = [];
        this.canPlay = canPlay;
        this.cardToPlay = null;
        this.score = 0;
        this.time = 0;
        this.cardsIsEmpty = false;
        this.firstToFinish = false;
        this.game = game;
    }
    initCardOrigins() {
        this.cardOrigins = [];
        for (let i = -this.cards.length * .5; i < this.cards.length * .5; i++) {
            const step = 90;
            this.cardOrigins.push(this.pos.add(new Vector2(step * (i + .5), 0)));
        }
    }
    getRandomCard() {
        return this.cards[Math.floor(this.cards.length * Math.random())];
    }
    autoPlay() {
        this.time += 1000 / FPS;
        if (this.time >= 1000 && !this.cardToPlay) {
            new Audio('./songs/switch.ogg').play();
            this.ready = true;
            const card = this.getRandomCard();
            card.onSwitched = true;
            card.setToFirstPlace();
            this.cardToPlay = card;
            this.time = 0;
        }
        if (this.time >= 500 && this.cardToPlay) {
            this.game.middleCards.collectCards(this.cardToPlay, this);
            this.cardToPlay = null;
            this.time = 0;
        }
    }
    addCard(card) {
        card.player = this;
        this.cards.push(card);
    }
    removeCard(card) {
        let players = this.game.players;

        const indexPlayer = players.indexOf(this);
        const nextPlayer = players[(indexPlayer + 1) % players.length];
        this.canPlay = false;
        nextPlayer.canPlay = true;

        const index = this.cards.indexOf(card);
        this.cards.splice(index, 1);

        if (this.game.finished && this.cards.length === 0 && nextPlayer.cards.length !== 0) {
            this.firstToFinish = true;
        }
    }
    collisionToMiddle(card) {
        if (!card.unleashed) return;
        const constrains = this.game.middleCards.constrains;
        if (card.unleashed.y >= constrains[0].y && card.unleashed.y <= constrains[1].y) {
            return true;
        }
        return;
    }
    repositionCards() {
        if (this.cards.length === 0 && this.game.cardsConfigured) {
            this.cardsIsEmpty = true;
            this.game.canPlay = false;
        }
        const isAI = this.game.players[0] !== this;
        if (this.cardsIsEmpty) {
            if (this.game.setupCardByStep(this, 3, !isAI)) {
                this.cardsIsEmpty = false;
                this.game.canPlay = true;
            }
        }
        //circle(this.pos, 4, 'red');
        this.initCardOrigins();
        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];
            if (!card.ondrag) {
                if (this.collisionToMiddle(card)) {
                    this.game.middleCards.collectCards(card, this);
                } else {
                    card.repositionTarget(this.cardOrigins[i]);
                }
            }
        }

        if (this.game.finished && this.cards.length === 0 && !this.firstToFinish && this.game.canPlay) {
            this.time += 1000 / FPS;
            if (this.time >= 500) {
                this.game.canPlay = false;
                this.game.collectedCards.beginCollectingLastCards(this);
                this.time = 0;
            }
        }
    }
    update() {
        this.repositionCards();
        if (this === this.game.players[1] && this.canPlay && this.game.canPlay) this.autoPlay();
    }
}