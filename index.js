const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

ctx.strokeStyle = "#0000ff";

const gridSize = 8;
const cellWidth = Math.floor(canvas.width / gridSize);
const grid = [];

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

function drawCell(ctx, imageData, offsetX, offsetY) {
	for (let i = 0; i < imageData.data.length; i += 4) {
		const pixelCount = Math.floor(i / 4);
		const x = pixelCount % cellWidth;
		const y = Math.floor(pixelCount / cellWidth);

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

		if (result >= 0)
			imageData.data[i] = 255 * result;
		else {
			imageData.data[i + 1] = -255 * result;
		}

		imageData.data[i + 2] = 20;
		imageData.data[i + 3] = 255;
	}
	ctx.putImageData(imageData, offsetX, offsetY);
}

function drawGradientVectors() {
	let y = 0;
	for (let i = 0; i < grid.length; i++) {
		let x = 0
		for (let j = 0; j < grid[i].length; j++) {
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(x + (grid[i][j].x * (cellWidth / 2)), y + (grid[i][j].y * (cellWidth / 2)));
			ctx.stroke();
			x += cellWidth;
		}
		y += cellWidth;
	}
}

function render() {
	let offsetY = 0;
	for (let i = 0; i < grid.length - 1; i++) {
		let offsetX = 0;
		for (let j = 0; j < grid.length - 1; j++) {
			const imageData = ctx.createImageData(cellWidth, cellWidth);
			drawCell(ctx, imageData, offsetX, offsetY);
			offsetX += cellWidth;
		}
		offsetY += cellWidth;
	}
}

function rotateGradientVectors(phi) {
	grid.forEach(row => row.forEach(element => element.rotate(element.angle() + phi)));
}

//const angle = 0.05;
//function step() {
//	rotateGradientVectors(angle);
//	ctx.clearRect(0, 0, 900, 900);
//	render();
//	window.requestAnimationFrame(step);
//}

randomizeGradientVectors(grid, gridSize);
render();
//requestAnimationFrame(step);