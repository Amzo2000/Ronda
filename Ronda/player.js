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
        this.onScoring = false;
        this.bonusCollected = false;
        this.lastCardPlayed = null;
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
            this.ready = true;
            const card = this.getRandomCard();
            if (!card) return;
            if (card.blocked) return;
            if (card.switched) {
                card.onSwitched = true;
                new Audio('./songs/switch.ogg').play();
            }
            card.setToFirstPlace();
            this.cardToPlay = card;
            this.time = 0;
        }
        if (this.time >= 500 && this.cardToPlay) {
            this.sendCard(this.cardToPlay);
            this.cardToPlay = null;
            this.time = 0;
        }
    }
    sendCard(card) {
        this.lastCardPlayed = card;
        this.game.middleCards.collectCards(card, this);
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
    }
    collisionToMiddle(card) {
        if (!card.unleashed) return;
        const constrains = this.game.middleCards.constrains;
        if (card.unleashed.y >= constrains[0].y && card.unleashed.y <= constrains[1].y) {
            return true;
        }
        return;
    }
    sameCards(cards) {
        let _cards = [];
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            for (let j = i + 1; j < cards.length; j++) {
                const nextCard = cards[j];
                if (card.value === nextCard.value) {
                    if (_cards.indexOf(card) === -1) _cards.push(card);
                    if (_cards.indexOf(nextCard) === -1) _cards.push(nextCard);
                }
            }
        }
        return _cards;
    }
    sendCardDblClick(card) {
        this.sendCard(card);
    }
    repositionCards() {
        if (this.cards.length === 0 && this.game.cardsConfigured) {
            this.cardsIsEmpty = true;
            this.game.canPlay = false;
        }
        const isAI = this.game.players[0] !== this;
        if (this.cardsIsEmpty) {
            if (this.game.setupCardByStep(this, 3, !isAI)) {
                this.bonusCollected = false;
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
                    this.sendCard(card);
                } else {
                    card.repositionTarget(this.cardOrigins[i]);
                }
            }
        }

        if (this.game.players[0].cards.length === 3 && this.game.players[1].cards.length === 3) {
            if (this.game.players[0].onScoring || this.game.players[1].onScoring) return;
            if (this.game.players[0].bonusCollected || this.game.players[1].bonusCollected) return;
            const sameCards = this.sameCards(this.cards);

            if (sameCards.length > 1) this.onScoring = true;
            else return;
            const anotherPlayer = this.game.players[0] === this ? this.game.players[1] : this.game.players[0];
            const anotherSameCards = this.sameCards(anotherPlayer.cards);
            let score = 0;
            let winner = 0;
            // Ronda
            if (sameCards.length === 2) {
                if (anotherSameCards.length === 2) {
                    if (anotherSameCards[0].value > sameCards[0].value) {
                        score = 2;
                        winner = -1;
                    } else if (anotherSameCards[0].value === sameCards[0].value) {
                        score = 1;
                        winner = 0;
                    } else {
                        score = 2;
                        winner = 1;
                    }
                } else if (anotherSameCards.length === 3) {
                    score = 6;
                    winner = -1;
                } else {
                    score = 1;
                    winner = 1;
                }
            }
            // Tringa
            if (sameCards.length === 3) {
                if (anotherSameCards.length === 3) {
                    if (anotherSameCards[0].value > sameCards[0].value) {
                        score = 10;
                        winner = -1;
                    } else if (anotherSameCards[0].value === sameCards[0].value) {
                        score = 5;
                        winner = 0;
                    } else {
                        score = 10;
                        winner = 1;
                    }
                } else if (anotherSameCards.length === 2) {
                    score = 6;
                    winner = 1;
                } else {
                    score = 5;
                    winner = 1;
                }
            }
            const winnerPlayer = winner === -1 ? anotherPlayer : winner === 0 ? [this, anotherPlayer] : this;

            this.game.playersRondaBonus = {
                winnerPlayer,
                players: [this, anotherPlayer],
                playersBonus: [sameCards, anotherSameCards],
                score,
                animationCurrentTime: 0
            };

            const animation = new Animation2({ begin: 0, end: 1, time: 1000 });
            animation.onUpdate(value => {
                this.game.playersRondaBonus.animationCurrentTime = value;
                this.game.canPlay = false;
            });
            animation.onFinish(() => {
                if (winnerPlayer instanceof Player) {
                    winnerPlayer.score += score;
                } else {
                    for (let player of winnerPlayer) {
                        player.score += score;
                    }
                }
                this.onScoring = false;
                this.bonusCollected = true;
                this.game.canPlay = true;
                this.game.playersRondaBonus = null;
            });
            animation.start();
            new Audio('./songs/ronda.ogg').play();
        }
    }
    update() {
        this.repositionCards();
        if (this === this.game.players[1] && this.canPlay && this.game.canPlay) this.autoPlay();
    }
}