const canvas = document.createElement('canvas'), context = canvas.getContext('2d');
document.body.append(canvas);

let width = canvas.width = innerWidth;
let height = canvas.height = innerHeight;

const FPS = 120;

const background = (color) => {
    context.fillStyle = color;
    context.fillRect(0, 0, width, height);
};

const stats = document.querySelector('.stats');
const message = document.querySelector('.message');
const buttonRestart = document.querySelector('.restart');

const loader = document.querySelector('.loading');
const bar = document.querySelector('.bar');

const bonusBoard = document.querySelector('.bonus');

const muteButton = document.querySelector('.muteButton');

function drawText(pos, text, color, fontSize, align = 'start', fontWeight = 'normal', strokeStyle = '#00000000') {
    context.fillStyle = color;
    context.strokeStyle = strokeStyle;
    context.lineWidth = 1;
    context.textAlign = align;
    context.font = fontWeight + ' ' + fontSize + 'px Arial';
    context.fillText(text, pos.x, pos.y);
    context.strokeText(text, pos.x, pos.y);
}

class Game {
    constructor() {
        this.muted = false;
        this.cards = [];
        this.players = [];
        this.listener();
        this.mouse = new Vector2(0, 0);
        this.onSelected = false;
        this.initCards();
        this.level = 'Facile';
        this.time = 0;
        this.canPlay = false;
        this.cardsConfigured = false;
        this.gameFinished = false;
        this.playFirst = false;
        this.start = false;
        this.totalFile = 40;
        this.fileLoadedCount = 0;
        this.fileLoaded = false;
        this.playersRondaBonus = null;
        this.songsBackground = [];
        this.initSongs();
        this.currentSongIndex = 0;
        //this.initPlayers();
        this.initGame();
    }
    initGame() {
        message.innerHTML = 'Appuyez sur la button < Jouer >';
        buttonRestart.innerHTML = 'Jouer';
    }
    initSongs() {
        this.songsBackground = [
            new Audio('./songs/bgs1.ogg'),
            new Audio('./songs/bgs2.ogg')
        ];
        for (let song of this.songsBackground) {
            song.volume = 0.25;
        }
        this.songsBackground.sort(() => Math.random() * 2 - 1);
    }
    playSong() {
        this.songsBackground[this.currentSongIndex].play();
        this.songsBackground[this.currentSongIndex].onended = () => {
            this.currentSongIndex += 1;
            this.currentSongIndex %= this.songsBackground.length;
            this.playSong();
        }
    }
    muteSong() {
        this.muted = !this.muted;
        for (let song of this.songsBackground) {
            song.volume = this.muted ? 0 : .25;
        }
        const img = this.muted ? './assets/icons/volume-mute-line.svg' : './assets/icons/volume-up-line.svg';
        muteButton.querySelector('img').setAttribute('src', img);
    }
    stopSong() {
        if (this.songsBackground[this.currentSongIndex].paused) return;
        this.songsBackground[this.currentSongIndex].pause();
        this.songsBackground[this.currentSongIndex].currentTime = 0;
        this.currentSongIndex += 1;
        this.currentSongIndex %= this.songsBackground.length;
    }
    restart() {
        this.playSong();
        stats.style.width = '0%';
        this.start = true;
        this.players = [];
        this.middleCards = new MiddleCards(new Vector2(width * .5, height * .5), this);
        this.collectedCards = new CollectedCards(
            new Vector2(width - 60, height - 80),
            new Vector2(60, 80),
            this
        );
        this.initCards();
        this.time = 0;
        this.canPlay = false;
        this.cardsConfigured = false;
        this.playSongFinish = false;
        this.gameFinished = false;
        this.playFirst = !this.playFirst;
        this.playSongFinish = false;
        this.initPlayers();
    }
    showStats() {
        this.stopSong();
        if (buttonRestart.attributes.getNamedItem('disabled'))
            buttonRestart.attributes.removeNamedItem('disabled');
        const score = this.players[0].score - this.players[1].score;
        if (score < 0) {
            if (!this.playSongFinish) new Audio('./songs/loss.ogg').play();
            message.innerHTML = 'Vous avez perdu(e).';
        } else if (score === 0) {
            if (!this.playSongFinish) new Audio('./songs/tie.ogg').play();
            message.innerHTML = 'Équivalent.';
        } else {
            if (!this.playSongFinish) new Audio('./songs/win.ogg').play();
            message.innerHTML = 'Bravo, vous avez gagné(e).';
        }
        this.playSongFinish = true;
        buttonRestart.innerHTML = 'Rejouer';
        stats.style.width = '100%';
    }
    showConfigBoard(pos) {
        const playerCards = this.collectedCards.cards.player.length;
        const AICards = this.collectedCards.cards.AI.length;

        drawText(pos, 'Niveau: ' + this.level, '#000', 18);
        drawText(pos.add(new Vector2(0, 25)), 'Score: ', '#000', 18);
        drawText(pos.add(new Vector2(0, 50)), '- Joueur : ' + this.players[0].score + ' pts', '#fff', 18);
        drawText(pos.add(new Vector2(0, 75)), '- AI : ' + this.players[1].score + ' pts', '#fff', 18);
        drawText(pos.add(new Vector2(0, 100)), `Cartes : Joueur - ${playerCards}, AI - ${AICards}`, '#000', 12);
    }
    initPlayers() {
        this.players.push(
            new Player(new Vector2(width * .5, height - 70), this.playFirst, this),
            new Player(new Vector2(width * .5, 70), !this.playFirst, this)
        );
    }
    setupCardByStep(parent, cardLength, show = true) {
        if (cardLength === parent.cards.length) return true;
        this.time += 1000 / FPS;
        if (parent.cards.length < cardLength && this.time >= 50) {
            let card = null;
            for (let i = this.cards.length - 1; i >= 0; i--) {
                if (this.cards[i].player === null) {
                    let jump = false;
                    card = this.cards[i];
                    if (parent instanceof MiddleCards) {
                        parent.cards.forEach(c => {
                            // Card values cannot match.
                            if (card.value === c.value) jump = true;
                            // Sequences aren't allowed.
                            if (card.value === c.value - 1 || card.value === c.value + 1) jump = true;
                        });
                    }
                    if (jump) {
                        card = null;
                        continue;
                    }
                    if (!(parent instanceof MiddleCards)) card.allowShadow = true;
                    break;
                }
            }
            if (card !== null) {
                card.setToFirstPlace();
                parent.addCard(card);
                new Audio("./songs/distribution.ogg").play();
            }
            const playerCardsLength = parent.cards.length;
            if (playerCardsLength) {

                if (show) parent.cards[playerCardsLength - 1].onSwitched = true;
            }
            this.time = 0;
            return cardLength === parent.cards.length;
        }
    }
    setupCards() {
        if (this.setupCardByStep(this.middleCards, 4)) {
            if (this.setupCardByStep(this.players[0], 3)) {
                if (this.setupCardByStep(this.players[1], 3, false)) {
                    this.canPlay = true;
                    this.cardsConfigured = true;
                }
            }
        }
    }
    initCards() {
        if (this.cards.length === 0) {
            loader.style.display = 'flex';
            const cardLevel = ['A', 'B', 'C', 'D'];
            const cardsLength = 10;
            for (let level of cardLevel) {
                for (let j = 0; j < cardsLength; j++) {
                    this.cards.push(new Card(width - 60, 80, level, j + 1, null, this));
                }
            }
        } else {
            for (let i = this.cards.length - 1; i >= 0; i--) {
                this.cards[i].restart(width - 60, 80);
            }
        }
        this.cards.sort(() => {
            return Math.random() * 2 - 1;
        });
        this.cards.forEach((card, index) => {
            card.pos.y -= index / 4;
        });
    }
    update() {
        if (this.start) {
            this.showConfigBoard(new Vector2(20, height - 110));
            for (let player of this.players) {
                player.update();
            }
            this.middleCards.update();
            this.collectedCards.update();



            if (this.collectedCards.onCollecting) {
                this.canPlay = false;
            }
            let remainCards = 0;
            for (let card of this.cards) {
                if (card.player === null) {
                    remainCards++;
                }
            }
            if (remainCards === 0) {
                this.cardsConfigured = false;
            }
            if (this.gameFinished) {
                this.time += 1000 / FPS;
                if (this.time >= 500) {
                    this.showStats();
                }
            }

            if (!this.cardsConfigured && remainCards > 0) this.setupCards();
        }
        for (let card of this.cards) {
            card.update();
        }

        if (this.collectedCards) {
            const scoreAnimations = this.collectedCards.scoreAnimations;
            if (scoreAnimations.length) {
                for (let animation of scoreAnimations) {
                    animation.update();
                }
            }
        }

        if (this.playersRondaBonus) {
            let value = this.playersRondaBonus.animationCurrentTime;
            value = 1 - (value) ** (1 / (0.5 * value))
            for (let i = 0; i < this.playersRondaBonus.players.length; i++) {
                const player = this.playersRondaBonus.players[i];
                const sameCards = this.playersRondaBonus.playersBonus[i];
                let bonusName = '';
                let score = 0;
                if (this.playersRondaBonus.winnerPlayer instanceof Player) {
                    if (this.playersRondaBonus.winnerPlayer === player)
                        score = this.playersRondaBonus.score;
                } else {
                    score = this.playersRondaBonus.score;
                }
                if (sameCards.length < 2) continue;
                if (sameCards.length === 2) {
                    bonusName = 'RONDA +' + score;
                }
                if (sameCards.length === 3) {
                    bonusName = 'TRINGA +' + score;
                }
                drawText(player.pos, bonusName, `rgba(255, 255, 255, ${value})`, 32, 'center', 'bold', `rgba(0, 0, 0, ${value})`);
            }
        }

        // Verification si le jeu est terminé.
        let remainCards = 0;
        for (let card of this.cards) {
            if (card.player === null) {
                remainCards++;
            }
        }
        if (remainCards === 0) {
            let isPlayersCardsFinished = -1;
            for (let player of this.players) {
                if (player.cards.length === 0) isPlayersCardsFinished += 1;
            }
            if (isPlayersCardsFinished > 0) {
                if (!this.collectedCards.onCollecting && !this.collectedCards.onGettingDerba) {
                    if (!this.collectedCards.lastCollecting)
                        this.collectedCards.beginCollectingLastCards(this.middleCards.lastGetter);
                }
            }
        };
    }
    mouseCollision(card) {
        if (this.mouse.x >= card.pos.x - card.size.x * .5 && this.mouse.x <= card.pos.x + card.size.x * .5) {
            if (this.mouse.y >= card.pos.y - card.size.y * .5 && this.mouse.y <= card.pos.y + card.size.y * .5) {
                return true;
            }
        }
        return false;
    }
    listener() {
        addEventListener('mousedown', e => {
            this.mouse = new Vector2(e.pageX, e.pageY);
            for (let i = this.cards.length - 1; i >= 0; i--) {
                const card = this.cards[i];
                if (card.blocked) continue;
                if (card.player !== this.players[0] || !this.canPlay) continue;
                if (!this.players[0].canPlay) continue;
                if (this.mouseCollision(card) && !this.onSelected) {
                    new Audio('./songs/dragged.ogg').play();
                    card.setToFirstPlace();
                    card.ondrag = true;
                    this.onSelected = true;
                }
            }
        });
        addEventListener('mouseup', e => {
            for (let card of this.cards) {
                if (card.ondrag) card.unleashed = new Vector2(e.pageX, e.pageY);
                card.ondrag = false;
                this.onSelected = false;
            }

        });
        addEventListener('mousemove', e => {
            this.mouse = new Vector2(e.pageX, e.pageY);
            for (let card of this.cards) {
                if (card.ondrag) {
                    card.pos = card.pos.add(new Vector2(e.movementX, e.movementY));
                }
            }
        });
        addEventListener('dblclick', () => {
            for (let i = this.cards.length - 1; i >= 0; i--) {
                const card = this.cards[i];
                if (card.blocked) continue;
                if (card.player !== this.players[0] || !this.canPlay) continue;
                if (!this.players[0].canPlay) continue;
                if (this.mouseCollision(card) && !this.onSelected) {
                    this.players[0].sendCardDblClick(card);
                    //new Audio('./songs/dragged.ogg').play();
                    card.setToFirstPlace();
                    this.onSelected = true;
                }
            }
        });
    }
}

const game = new Game();

buttonRestart.addEventListener('click', () => {
    new Audio('./songs/select.ogg').play();
    game.restart();
    buttonRestart.setAttribute('disabled', '');
});

muteButton.addEventListener('click', () => {
    game.muteSong();
});

setInterval(() => {
    background('#e29c26');

    if (game.fileLoadedCount === game.totalFile) {
        loader.style.display = 'none';
        if (!game.fileLoaded) {
            stats.style.width = '100%';
            game.fileLoaded = true;
        }
        game.update();
    } else {
        bar.style.width = `${Math.round(game.fileLoadedCount / game.totalFile * 100)}%`;
    }

    for (let animation of Animation2.animations) animation.update();

}, 1000 / FPS);