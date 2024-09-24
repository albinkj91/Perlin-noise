const width = 500;
const gridSize = 20;
const cellWidth = Math.floor(width / gridSize);
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

const randomizeGradientVectors = (grid, size) => {
	for (let i = 0; i <= size; i++) {
		grid[i] = new Array();
		for (let j = 0; j <= size; j++) {
			grid[i][j] = new Vector(1, 1);
			grid[i][j].rotate(Math.random() * 2 * Math.PI);
			grid[i][j].normalize();
		}
	}
};

const smoothstep = (x) => {
	return 3 * x * x - 2 * x * x * x;
};

const lerp = (a, b, t) => {
	return a + t * (b - a);
};

const calcCell = (offsetX, offsetY) => {
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

		cellData[i] = result;
	}
	return cellData;
};

export const perlin = () => {
	randomizeGradientVectors(grid, gridSize);
	let imageData = [];
	let offsetY = 0;
	for (let i = 0; i < gridSize; i++) {
		let offsetX = 0;
		imageData[i] = new Array();
		for (let j = 0; j < gridSize; j++) {
			imageData[i][j] = calcCell(offsetX, offsetY);
			offsetX += cellWidth;
		}
		offsetY += cellWidth;
	}
	return as2D(imageData);
};

const rotateGradientVectors = (phi) => {
	grid.forEach(row =>
		row.forEach(element =>
			element.rotate(element.angle() + phi)));
};


const as2D = (imageData) => {
	let perlinData = []

	for(let gridY = 0; gridY < imageData.length; gridY++){
		for(let cellY = 0; cellY < cellWidth; cellY++){
			perlinData[cellY + gridY * cellWidth] = new Array();
			for(let gridX = 0; gridX < imageData[gridY].length; gridX++){
				for(let cellX = 0; cellX < cellWidth; cellX++){
					const brightness = (imageData[gridY][gridX][cellY * cellWidth + cellX] + 1) / 2.0;
					perlinData[cellY + gridY * cellWidth][gridX * cellWidth + cellX] = brightness;
				}
			}
		}
	}
	return perlinData;
};