const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

ctx.fillStyle = "#000000";
ctx.strokeStyle = "#0000ff";

const gridBlock = 100;

class Vector{
    constructor(x, y){
        this.x = x;
        this.y = y;
    }

    dot(vector){
        return this.x * vector.x + this.y * vector.y;
    }

    mag(){
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize(){
        let mag = this.mag();
        this.x /= mag;
        this.y /= mag;
    }
}

const grid = [];
for(let i = 0; i < 8; i++){
    grid[i] = new Array();
    for(let j = 0; j < 8; j++){
        grid[i][j] = new Vector(Math.random() * 20 - 10, Math.random() * 20 - 10);
        grid[i][j].normalize();
    }
}

function drawBlock(ctx, imageData, offsetX, offsetY){
    for(let i = 0; i < imageData.data.length; i+=4){
        const pixelCount = Math.floor(i / 4);
        const x = Math.floor(pixelCount % 100.0);
        const y = Math.floor(pixelCount / 100.0);
        const vector = new Vector(x, y);

        let gridX = 1, gridY = 1;
        if(x < 50)
            gridX = 0;
        else
            vector.x = -(100 - vector.x);
        if(y < 50)
            gridY = 0;
        else{
            vector.y = -(100 - vector.y);
        }
        vector.normalize();

        gridY += Math.floor((offsetY - 100) / 100);
        gridX += Math.floor((offsetX - 100) / 100);

        const scalar = vector.dot(grid[gridY][gridX]);
        if(scalar >= 0)
            imageData.data[i+1] = 255 * scalar;
        else{
            imageData.data[i] = -255 * scalar;
        }

        imageData.data[i+2] = 0;
        imageData.data[i+3] = 255;
    }
    ctx.putImageData(imageData, offsetX, offsetY);
}


let offsetY = 100;
for(let i = 0; i < grid.length - 1; i++){
    let offsetX = 100;
    for(let j = 0; j < grid.length - 1; j++){
        const imageData = ctx.createImageData(100, 100);
        drawBlock(ctx, imageData, offsetX, offsetY);
        offsetX += 101;
    }
    offsetY += 101;
}

let y = 100;
for(let i = 0; i < grid.length; i++){
    x = 100
    for(let j = 0; j < grid[i].length; j++){
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (grid[i][j].x * (gridBlock/2)), y + (grid[i][j].y * (gridBlock/2)));
        ctx.stroke();
        x += 101;
    }
    y += 101;
}