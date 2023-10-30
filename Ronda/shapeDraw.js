function circle(pos, radius, color) {
    context.shadowColor = '#00000000';
    context.beginPath();
    context.fillStyle = color;
    context.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    context.fill();
    context.closePath();
}

function strokeRect(pos, width, height, color, lineWidth) {

    context.shadowColor = color;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 5;

    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.translate(pos.x, pos.y);
    context.strokeRect(width * -.5, height * -.5, width, height);
    context.stroke();
    context.closePath();
    context.resetTransform();

    context.shadowColor = '#00000000';
}

function line(a, b, color, lineWidth, offset) {
    //context.lineDashOffset = 4;
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.moveTo(a.x, a.y);
    context.lineTo(b.x, b.y);
    context.setLineDash([10, 5]);
    context.lineDashOffset = offset;
    context.stroke();
    context.closePath();

    context.setLineDash([]);
}