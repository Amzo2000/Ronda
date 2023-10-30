const FPS = 120;

class Animation2 {
    constructor(begin, end, time) {
        this.begin = begin;
        this.end = end;
        this.time = time;
        this.currentTime = 0;
        this.isStart = false;
        this.callback;
    }
    start(callback) {
        this.isStart = true;
        this.callback = callback;
    }
    stop() {
        this.isStart = false;
    }
    update() {
        if (this.isStart) {
            if (this.currentTime <= this.time) {
                const value = this.begin + (this.end - this.begin) * (this.currentTime / this.time);
                this.callback(value);
            } else {
                this.stop();
            }
            this.currentTime += 1000 / FPS;
        }
    }
}


const animation = new Animation2(0, 10, 1000);
animation.start(value => {
    console.log(value);
});

setInterval(() => {
    animation.update();

}, 1000 / FPS);
