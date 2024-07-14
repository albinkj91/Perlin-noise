const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

ctx.fillStyle = "#000000";
ctx.strokeStyle = "#0000ff";

const gridCell = 100;

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
        if(mag !== 0){
            this.x /= mag;
            this.y /= mag;
        }
    }
}

const grid = [];
for(let i = 0; i < 8; i++){
    grid[i] = new Array();
    for(let j = 0; j < 8; j++){
        grid[i][j] = new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1);
        grid[i][j].normalize();
    }
}

function smoothstep(x){
    return 3*x*x - 2*x*x*x;
}

function lerp(a, b, t){
    return a + t * (b - a);
}

function drawCell(ctx, imageData, offsetX, offsetY){
    for(let i = 0; i < imageData.data.length; i += 4){
        const pixelCount = Math.floor(i / 4);
        const x = pixelCount % gridCell;
        const y = Math.floor(pixelCount / gridCell);

        const relX = x / gridCell;
        const relY = y / gridCell;
        const vector1 = new Vector(relX, relY);
        const vector2 = new Vector(relX - 1, relY);
        const vector3 = new Vector(relX - 1, relY - 1);
        const vector4 = new Vector(relX, relY - 1);

        let gridY = Math.floor((offsetY - gridCell) / gridCell);
        let gridX = Math.floor((offsetX - gridCell) / gridCell);
        const dot1 = vector1.dot(grid[gridY][gridX]);
        const dot2 = vector2.dot(grid[gridY][gridX + 1]);
        const dot3 = vector3.dot(grid[gridY + 1][gridX + 1]);
        const dot4 = vector4.dot(grid[gridY + 1][gridX]);
        const ab = lerp(dot1, dot2, smoothstep(vector1.x));
        const cd = lerp(dot4, dot3, smoothstep(vector1.x));
        const result = lerp(ab, cd, smoothstep(vector1.y));

        if(result >= 0)
            imageData.data[i+1] = 255 * result;
        else{
            imageData.data[i] = -255 * result;
        }

        imageData.data[i+2] = 0;
        imageData.data[i+3] = 255;
    }
    ctx.putImageData(imageData, offsetX, offsetY);
}

let offsetY = gridCell;
for(let i = 0; i < grid.length - 1; i++){
    let offsetX = gridCell;
    for(let j = 0; j < grid.length - 1; j++){
        const imageData = ctx.createImageData(gridCell, gridCell);
        drawCell(ctx, imageData, offsetX, offsetY);
        offsetX += gridCell + 1;
    }
    offsetY += gridCell + 1;
}

let y = gridCell;
for(let i = 0; i < grid.length; i++){
    x = gridCell
    for(let j = 0; j < grid[i].length; j++){
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (grid[i][j].x * (gridCell/2)), y + (grid[i][j].y * (gridCell/2)));
        ctx.stroke();
        x += 101;
    }
    y += gridCell + 1;
}