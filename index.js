const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

const width = 100;
const gridSize = 10;
const cellWidth = Math.floor(width / gridSize);
const grid = [];

canvas.width = cellWidth * (gridSize-1);
canvas.height = cellWidth * (gridSize-1);

class Vector {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	dot(vector) {
		return this.x * vector.x + this.y * vector.y;
	}

	mag() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	normalize() {
		const mag = this.mag();
		if (mag !== 0) {
			this.x /= mag;
			this.y /= mag;
		}
	}

	rotate(phi) {
		this.x = Math.cos(phi);
		this.y = Math.sin(phi);
	}

	angle() {
		return Math.atan2(this.y, this.x);
	}
}

function randomizeGradientVectors(grid, size) {
	for (let i = 0; i < size; i++) {
		grid[i] = new Array();
		for (let j = 0; j < size; j++) {
			grid[i][j] = new Vector(1, 1);
			grid[i][j].rotate(Math.random() * 2 * Math.PI);
			grid[i][j].normalize();
		}
	}
}

function smoothstep(x) {
	return 3 * x * x - 2 * x * x * x;
}

function lerp(a, b, t) {
	return a + t * (b - a);
}

function calcCell(offsetX, offsetY) {
	let cellData = new Float32Array(cellWidth*cellWidth);
	for (let i = 0; i < cellWidth*cellWidth; i++) {
		const x = i % cellWidth;
		const y = Math.floor(i / cellWidth);

		const relX = x / cellWidth;
		const relY = y / cellWidth;

		const vector1 = new Vector(relX, relY);
		const vector2 = new Vector(relX - 1, relY);
		const vector3 = new Vector(relX - 1, relY - 1);
		const vector4 = new Vector(relX, relY - 1);

		const gridY = Math.floor(offsetY / cellWidth);
		const gridX = Math.floor(offsetX / cellWidth);

		const dot1 = vector1.dot(grid[gridY][gridX]);
		const dot2 = vector2.dot(grid[gridY][gridX + 1]);
		const dot3 = vector3.dot(grid[gridY + 1][gridX + 1]);
		const dot4 = vector4.dot(grid[gridY + 1][gridX]);

		const ab = lerp(dot1, dot2, smoothstep(vector1.x));
		const cd = lerp(dot4, dot3, smoothstep(vector1.x));
		const result = lerp(ab, cd, smoothstep(vector1.y));

		//const brightness = result * 255;
		//ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
		//ctx.fillRect(offsetX + x, offsetY + y, 1, 1)
		cellData[i] = result;
	}
	return cellData;
}

function perlin() {
	let imageData = [];
	let offsetY = 0;
	for (let i = 0; i < gridSize - 1; i++) {
		let offsetX = 0;
		imageData[i] = new Array();
		for (let j = 0; j < gridSize - 1; j++) {
			imageData[i][j] = calcCell(offsetX, offsetY);
			offsetX += cellWidth;
		}
		offsetY += cellWidth;
	}
	return imageData;
}

function rotateGradientVectors(phi) {
	grid.forEach(row =>
		row.forEach(element =>
			element.rotate(element.angle() + phi)));
}

randomizeGradientVectors(grid, gridSize);
const imageData = perlin();

let y = 0;
let xOffset = 0;
for(let i = 0; i < imageData.length; i++){
	const offsetY = cellWidth*i;
	for(let j = 0; j < imageData[i].length; j++){
		let y = offsetY;
		const xOffset = cellWidth*j;
		for(let k = 0; k < cellWidth; k++){
			let x = xOffset;
			for(let l = 0; l < cellWidth; l++){
				const brightness = 255 * ((imageData[i][j][k * cellWidth + l] + 1) / 2);
				ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
				ctx.fillRect(x, y, 1, 1);
				x++;
			}
			y++;
		}
	}
}