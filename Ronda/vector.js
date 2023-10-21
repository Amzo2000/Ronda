class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(vector) {
        return new Vector2(this.x + vector.x, this.y + vector.y);
    }
    sub(vector) {
        return new Vector2(this.x - vector.x, this.y - vector.y);
    }
    mul(n) {
        if (n instanceof Vector2) return new Vector2(this.x * n.x, this.y * n.y);
        return new Vector2(this.x * n, this.y * n);
    }
    div(n) {
        if (n instanceof Vector2) return new Vector2(this.x / n.x, this.y / n.y);
        return new Vector2(this.x / n, this.y / n);
    }
    mag() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }
    normalize() {
        return this.mag() === 0 ? new Vector2(0, 0) : this.div(this.mag());
    }
    normal() {
        return new Vector2(-this.y, this.x);
    }
    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }
    cross(vector) {
        return this.x * vector.y - this.y * vector.x;
    }
    rotate(angle) {
        return new Vector2(
            this.x * Math.cos(angle) - this.y * Math.sin(angle),
            this.x * Math.sin(angle) + this.y * Math.cos(angle)
        );
    }
    render(context, color, radius = 3) {
        context.beginPath();
        context.fillStyle = color;
        context.arc(this.x, this.y, radius, 0, Math.PI * 2);
        context.fill();
        context.closePath();
    }
    copy() {
        return new Vector2(this.x, this.y);
    }
}