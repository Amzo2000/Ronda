class Animation2 {
    static animations = [];
    constructor(options) {
        this.value = options.begin ? options.begin : 0;
        this.begin = options.begin ? options.begin : 0;
        this.end = options.end ? options.end : 0;
        this.time = options.time ? options.time : 0;
        this.currentTime = 0;
        this.onUpdateCallBack;
        this.onFinishCallBack;
        this.startAnimation = false;
        Animation2.animations.push(this);
    }
    onUpdate(callback) {
        this.onUpdateCallBack = callback;
    }
    onFinish(callback) {
        this.onFinishCallBack = callback;
    }
    start() {
        this.startAnimation = true;
    }
    restart() {
        this.currentTime = 0;
        this.value = this.begin;
    }
    stop() {
        this.startAnimation = false;
        if (this.onFinishCallBack) this.onFinishCallBack(this.value);
        const index = Animation2.animations.indexOf(this);
        Animation2.animations.splice(index, 1);
    }
    update() {
        if (this.startAnimation) {
            if (this.currentTime < this.time) {
                this.value = this.begin + (this.end - this.begin) * (this.currentTime / this.time);
                if (this.onUpdateCallBack) this.onUpdateCallBack(this.value);
                this.currentTime += 1000 / FPS;
            } else {
                this.value = this.end;
                if (this.onUpdateCallBack) this.onUpdateCallBack(this.value);
                this.stop();
            }
        }
    }
}