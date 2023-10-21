class CollectedCards {
    constructor(pos_1, pos_2, game) {
        this.pos_1 = pos_1;
        this.pos_2 = pos_2;
        this.cards = { player: [], AI: [] };
        this.cardOrigins = [];
        this.onCollecting = false;
        this.cardOnCollecting = [];
        this.player = null;
        this.time = 0;
        this.searchSequential = false;
        this.lastCard = null;
        this.lastCardCollected = null;
        this.lastCardsSwitched = false;
        this.lastCollecting = false;
        this.lastPlayer = null;
        this.getted = false;
        this.game = game;
    }
    initCardOrigins() {
        this.cardOrigins = [];
        for (let i = 0; i < 2; i++) {
            this.cardOrigins.push(this.pos_1, this.pos_2);
        }
    }
    startCollecting(card, player) {
        this.setToThisClass(card);
        this.onCollecting = true;
        this.player = player;
        this.cardOnCollecting.push(card);
    }
    setToThisClass(card) {
        card.allowShadow = false;
        card.player = this;
    }
    addCard(card) {
        this.setToThisClass(card);
        card.onSwitched = false;
        this.cards.push(card);
    }
    sequenceInTheMiddle(card) {
        let cardToReturn = null;
        for (let cardMiddle of this.game.middleCards.cards) {
            if (cardMiddle.value === card.value + 1) {
                cardToReturn = cardMiddle;
                return cardMiddle;
            }
        }
        return cardToReturn;
    }
    matchOneInTheMiddle(card) {
        return this.game.middleCards.cards.find(cardMiddle => {
            return cardMiddle.value === card.value;
        });
    }
    collectingLastCards() {
        this.time += 1000 / FPS;
        if (this.time >= 200 && !this.lastCardsSwitched) {
            for (let card of this.game.middleCards.cards) {
                card.onSwitched = true;
            }
            new Audio('./songs/switch.ogg').play();
            this.lastCardsSwitched = true;
            this.time = 0;
        }
        if (this.time >= 200 && this.lastCardsSwitched) {
            this.game.gameFinished = true;
            for (let card of this.game.middleCards.cards) {
                new Audio('./songs/land.ogg').play();
                card.setToFirstPlace();
                this.setToThisClass(card);
                if (card.value >= 8) this.lastPlayer.score += 10;
                if (this.game.players[0] === this.lastPlayer) this.cards.player.push(card);
                if (this.game.players[1] === this.lastPlayer) this.cards.AI.push(card);
                this.game.middleCards.removeCard(card);
            }
            this.time = 0;
        }
    }
    beginCollectingLastCards(player) {
        this.lastPlayer = player;
        this.lastCollecting = true;
    }
    repositionCards() {
        if (this.onCollecting) {
            if (this.cardOnCollecting.length) {
                this.time += 1000 / FPS;
                for (let card of this.cardOnCollecting) {
                    let cardMatch;
                    if (this.cardOnCollecting.length === 1) {
                        if (!this.getted) {
                            new Audio('./songs/collect.ogg').play();
                            this.getted = true;
                        }
                        cardMatch = this.matchOneInTheMiddle(card);
                        if (card !== this.lastCardCollected) {
                            if (card.value >= 8) this.player.score += 20;
                            this.lastCardCollected = card;
                        }
                        if (cardMatch) this.lastCard = cardMatch;
                    }
                    if (this.time >= 500 && !this.searchSequential) {
                        this.getted = false;
                        this.setToThisClass(cardMatch);
                        this.game.middleCards.removeCard(cardMatch);
                        this.cardOnCollecting.push(cardMatch);
                        this.time = 0;
                        this.searchSequential = true;
                    }
                    if (this.searchSequential) {
                        let sequentialCard = this.sequenceInTheMiddle(card);
                        if (!sequentialCard) {
                            for (let _card of this.cardOnCollecting) {
                                if (_card.value > card.value)
                                    sequentialCard = this.sequenceInTheMiddle(_card);
                            }
                        }
                        if (sequentialCard) {
                            if (sequentialCard !== this.lastCardCollected) {
                                if (sequentialCard.value >= 8) this.player.score += 10;
                                this.lastCardCollected = sequentialCard;
                            }
                            this.lastCard = sequentialCard;
                            if (this.time >= 200) {
                                new Audio('./songs/arrive.ogg').play();
                                this.setToThisClass(sequentialCard);
                                this.game.middleCards.removeCard(sequentialCard);
                                this.cardOnCollecting.push(sequentialCard);
                                this.time = 0;
                            }
                        } else {
                            if (this.time >= 500) {
                                for (let _card of this.cardOnCollecting) {
                                    _card.setToFirstPlace();
                                    _card.onSwitched = true;
                                    if (this.game.players[0] === this.player) {
                                        this.cards.player.push(_card);
                                    }
                                    if (this.game.players[1] === this.player) {
                                        this.cards.AI.push(_card);
                                    }
                                }
                                new Audio('./songs/land.ogg').play();
                                this.game.canPlay = true;
                                this.cardOnCollecting.length = 0;
                                this.searchSequential = false;
                                this.player = null;
                                this.time = 0;
                                this.onCollecting = false;
                            }
                        }
                    }
                    if (this.lastCard) {
                        card.repositionTarget(this.lastCard.pos);
                    }
                }
            }
        }

        this.cards.player.forEach((card, index) => {
            card.repositionTarget(this.pos_1);
            card.pos.y -= index / 32;
        });
        this.cards.AI.forEach((card, index) => {
            card.repositionTarget(this.pos_2);
            card.pos.y -= index / 32;
        });

        if (this.lastCollecting) {
            this.collectingLastCards();
        }
    }
    update() {
        this.initCardOrigins();
        this.repositionCards();
    }
}