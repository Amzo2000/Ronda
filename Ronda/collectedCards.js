class ScoreAnimation {
    constructor(pos, score, array) {
        this.pos = pos.copy();
        this.origin = pos;
        this.score = score;
        this.array = array;
        this.color = 'rgba(255, 255, 255, 0)';
        this.size = 0;
        this.array.push(this);
        this.start();
    }
    start() {
        const animation = new Animation2({ begin: 0, end: 1, time: 1500 });
        animation.onUpdate(value => {
            this.size = 16 * (value) ** (1 / (20 * value));
            this.color = `rgba(255, 255, 255, ${1 - value})`;
            this.pos = this.origin.add(new Vector2(0, -50).mul(value));
        });
        animation.onFinish(() => {
            const index = this.array.indexOf(this);
            this.array.splice(index, 1);
        });
        animation.start();
    }
    update() {
        drawText(this.pos, '+' + this.score, this.color, this.size, 'center');
    }
}

class CountAnimation {
    constructor(pos) {
        this.pos = pos.copy();
        this.songStart = false;
    }
    update(value) {
        const x = value % 1;
        if (x <= 0.1 && !this.songStart && value < 3) {
            new Audio('./songs/tictoc.ogg').play();
            this.songStart = true;
        }
        if (x > 0.1) this.songStart = false;

        const f = (a) => 4 * a ** 2;
        const g = (a) => 1 - f(a - 0.5);
        const h = (a) => f(a - 1);

        //const scale = (Math.sin(Math.PI * (2 * x - .5)) + 1) / 2;
        const scale = x <= 0.5 ? g(x) : h(x);
        drawText(this.pos.add(new Vector2(0, 13.5 * scale)), 3 - Math.round(value - 0.4), '#fff', 42 * scale, 'center', '600');
    }
}

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
        this.isMissa = false;
        this.onGettingDerba = false;
        this.derbaCount = 0;
        this.isDerba = false;
        this.derbaPlayer = null;
        this.derbaCard = null;
        this.scoreAnimations = new Array();
        this.game = game;
    }
    initCardOrigins() {
        this.cardOrigins = [];
        for (let i = 0; i < 1; i++) {
            this.cardOrigins.push(this.pos_1, this.pos_2);
        }
    }
    startCollecting(card, player) {
        this.setToThisClass(card);
        this.onCollecting = true;
        this.player = player;
        this.cardOnCollecting.push(card);
    }
    startCollectingDerba(card, targetCard, player) {
        card.allowShadow = false;
        this.derbaCount += 1;
        this.isDerba = true;
        this.derbaCard = card;

        switch (this.derbaCount) {
            case 1:
                new ScoreAnimation(targetCard.pos, 1, this.scoreAnimations);
                break;
            case 2:
                new ScoreAnimation(targetCard.pos, 5, this.scoreAnimations);
                break;
            case 3:
                new ScoreAnimation(targetCard.pos, 10, this.scoreAnimations);
                break;
        }

        this.derbaPlayer = player;
        if (this.onGettingDerba) return;
        this.derbaCollected = [];
        this.onGettingDerba = true;

        const countAnimation = new CountAnimation(targetCard.pos);
        const animation = new Animation2({ being: 0, end: 3, time: 3000 });
        animation.onUpdate(time => {
            if (this.isDerba) { animation.restart(); this.isDerba = false; }
            countAnimation.update(time);

            if (this.derbaCollected.indexOf(this.derbaCard) === -1) this.derbaCollected.push(this.derbaCard);
            this.derbaCard.repositionTarget(targetCard.pos);

            if (this.derbaCount === 3) animation.stop();
        });
        animation.onFinish(() => {

            this.derbaCollected.reverse();
            this.derbaCollected.splice(0, 1);

            const anim = new Animation2({ time: 1000 });
            anim.onFinish(() => {
                for (let i = 0; i < this.derbaCollected.length; i++) {
                    const _card = this.derbaCollected[i];
                    _card.setToFirstPlace();
                    this.setToThisClass(_card);
                    _card.onSwitched = true;

                    if (this.game.players[0] === this.derbaPlayer) {
                        this.derbaPlayer.score += 1;
                        this.cards.player.push(_card);
                    }
                    if (this.game.players[1] === this.derbaPlayer) {
                        this.derbaPlayer.score += 1;
                        this.cards.AI.push(_card);
                    }
                }
                this.derbaPlayer = null;
            });
            anim.start();
            this.startCollecting(this.derbaCard, this.derbaPlayer);

            switch (this.derbaCount) {
                case 1:
                    this.derbaPlayer.score += 1;
                    break;
                case 2:
                    this.derbaPlayer.score += 5;
                    break;
                case 3:
                    this.derbaPlayer.score += 10;
                    break;
            }
            new Audio('./songs/switch.ogg').play();

            this.isDerba = false;
            this.derbaCard = null;
            this.derbaCount = 0;
            this.onGettingDerba = false;
            this.game.middleCards.lastCard = null;
            this.onNextCards = false;
            this.game.canPlay = false;
        });
        animation.start();

    }
    setToThisClass(card) {
        card.allowShadow = false;
        card.player = this;
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
                this.lastPlayer.score += 1;
                //if (card.value >= 8) this.lastPlayer.score += 10;
                if (this.game.players[0] === this.lastPlayer) this.cards.player.push(card);
                if (this.game.players[1] === this.lastPlayer) this.cards.AI.push(card);
                this.game.middleCards.removeCard(card);
            }
            this.time = 0;
        }
    }
    beginCollectingLastCards(player) {
        this.lastPlayer = player;
        const animToBegin = new Animation2({time: 1000});
        animToBegin.onFinish(() => {
           this.lastCollecting = true; 
        });
        animToBegin.start();
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
                            card.collectedAnimation();
                            this.getted = true;
                        }
                        cardMatch = this.matchOneInTheMiddle(card);
                        if (card !== this.lastCardCollected) {
                            new ScoreAnimation(cardMatch.pos.copy(), 2, this.scoreAnimations);
                            this.player.score += 2;
                            //if (card.value >= 8) this.player.score += 20;
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
                                new ScoreAnimation(sequentialCard.pos.copy(), 1, this.scoreAnimations);
                                this.player.score += 1;
                                //if (sequentialCard.value >= 8) this.player.score += 10;
                                this.lastCardCollected = sequentialCard;
                            }
                            this.lastCard = sequentialCard;
                            if (this.time >= 200) {
                                sequentialCard.collectedAnimation();
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
                                //this.player = null;
                                this.time = 0;
                                this.onCollecting = false;
                                if (this.game.middleCards.cards.length === 0) {
                                    this.isMissa = true;
                                }
                                for (let player of this.game.players) {
                                    for (let _cardBlocked of player.cards) {
                                        _cardBlocked.blocked = false;
                                    }
                                }
                            }
                        }
                    }
                    if (this.lastCard) {
                        card.repositionTarget(this.lastCard.pos);
                    }
                }
            }
        }
        if (this.isMissa) {
            new Audio('./songs/ronda.ogg').play();
            this.game.canPlay = false;
            const missaAnimation = new Animation2({ time: 1000 });
            bonusBoard.classList.add('active');
            missaAnimation.onFinish(() => {
                bonusBoard.classList.remove('active');
                this.game.canPlay = true;
                // Ajouter 1 point pour le joueur qui a eu Missa.
                this.player.score += 1;
                this.player = null;
            });
            missaAnimation.start();
            this.isMissa = false;
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