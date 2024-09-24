import { perlin } from "../perlin.js";

let vertexCount;

const main = () => {
	const canvas = document.querySelector("#canvas");
	const gl = canvas.getContext("webgl");

	if (gl === null) {
		alert(
			"Unable to initialize WebGL. Your browser or machine may not support it.",
		);
		return;
	}

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	const vertexShader = `
    attribute vec4 vertexPos;
	attribute vec3 vertexNormal;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat4 rotXMatrix;

	varying highp vec3 outNormal;
	varying highp vec4 outVertexPos;

    void main() {
		if(vertexPos.y < 75.0){
			outVertexPos = vec4(vertexPos.x, 75.0, vertexPos.z, vertexPos.w);
		}else{
			outVertexPos = vertexPos;
		}
		gl_Position = projectionMatrix * modelViewMatrix * rotXMatrix * outVertexPos;
		outNormal = vertexNormal;
    }
  `;

	const fragShader = `
	varying highp vec3 outNormal;
	varying highp vec4 outVertexPos;
    void main() {
		highp vec4 color =  vec4(0.0, 0.2, 0.4, 1.0);
		if(outVertexPos.y > 76.0 && outVertexPos.y < 120.0){
			color = vec4(0.2, 0.30, 0.1, 1.0);
		}else if(outVertexPos.y > 120.0){
			color = vec4(0.60, 0.60, 0.60, 1.0);
		}

		highp float light = dot(outNormal, vec3(0.5, 0.5, 0.5));
		gl_FragColor = 0.6 * light * color;
    }
  `;
	const shaderProgram = initShaderProgram(gl, vertexShader, fragShader);

	// Collect all the info needed to use the shader program.
	// Look up which attribute our shader program is using
	// for vertexPosition and look up uniform locations.
	const programInfo = {
		program: shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(shaderProgram, "vertexPos"),
			vertexNormal: gl.getAttribLocation(shaderProgram, "vertexNormal")
		},
		uniformLocations: {
			projectionMatrix: gl.getUniformLocation(shaderProgram, "projectionMatrix"),
			modelViewMatrix: gl.getUniformLocation(shaderProgram, "modelViewMatrix"),
			rotXMatrix: gl.getUniformLocation(shaderProgram, "rotXMatrix"),
		},
	};

	const perlinData = perlin();
	
	const terrain = generateTerrain(perlinData);

	// Here's where we call the routine that builds all the
	// objects we'll be drawing.
	const buffers = initBuffers(gl, terrain);

	// Draw the scene
	drawScene(gl, programInfo, buffers);
};

const initShaderProgram = (gl, vsSource, fsSource) => {
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
	const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

	const shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert(
			`Unable to initialize the shader program: ${gl.getProgramInfoLog(
				shaderProgram,
			)}`,
		);
		return null;
	}
	return shaderProgram;
};

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
const loadShader = (gl, type, source) => {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);

	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(
			`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
		);
		gl.deleteShader(shader);
		return null;
	}
	return shader;
};

const initBuffers = (gl, terrain) => {
	const positionBuffer = initPositionBuffer(gl, terrain.positions);
	const normalBuffer = initNormalBuffer(gl, terrain.normals);

	return {
		position: positionBuffer,
		normal: normalBuffer
	};
};

const generateTerrain = (perlinData) =>{
	const width = perlinData.length;
	const positions = [];
	const normals = [];
	let posIndex = 0;
	let normalIndex = 0;
	const factor = 180;

	for (let y = 0; y < width - 1; y++) {
		for (let x = 0; x < width - 1; x++) {
			const origX = x - (width / 2);
			positions[posIndex++] = origX;
			positions[posIndex++] = perlinData[y][x] * factor
			positions[posIndex++] = -y;

			const a1 = vec3.fromValues(origX, perlinData[y][x] * factor, -y);

			positions[posIndex++] = origX + 1;
			positions[posIndex++] = perlinData[y][x+1] * factor
			positions[posIndex++] = -y;

			const a2 = vec3.fromValues(origX + 1, perlinData[y][x+1] * factor, -y);

			positions[posIndex++] = origX + 1;
			positions[posIndex++] = perlinData[y+1][x+1] * factor;
			positions[posIndex++] = -y - 1;

			const b2 = vec3.fromValues(origX + 1, perlinData[y+1][x+1] * factor, -y - 1);

			positions[posIndex++] = origX;
			positions[posIndex++] = perlinData[y][x] * factor;
			positions[posIndex++] = -y;

			positions[posIndex++] = origX + 1;
			positions[posIndex++] = perlinData[y+1][x+1] * factor;
			positions[posIndex++] = -y - 1;

			positions[posIndex++] = origX;
			positions[posIndex++] = perlinData[y+1][x] * factor;
			positions[posIndex++] = -y - 1;

			const c2 = vec3.fromValues(origX, perlinData[y+1][x] * factor, -y - 1);
			c2.x = origX;
			c2.y = perlinData[y+1][x] * factor;
			c2.z = -y - 1;

			const a = vec3.create();
			vec3.sub(a, a1, a2);
			const b = vec3.create();
			vec3.sub(b, a1, b2);
			const c = vec3.create();
			vec3.sub(c, a1, c2);

			const n1 = vec3.create()
			vec3.cross(n1, a, b);

			const n2 = vec3.create()
			vec3.cross(n2, a, c);

			normals[normalIndex++] = n1[0];
			normals[normalIndex++] = n1[1];
			normals[normalIndex++] = n1[2];

			normals[normalIndex++] = n1[0];
			normals[normalIndex++] = n1[1];
			normals[normalIndex++] = n1[2];

			normals[normalIndex++] = n1[0];
			normals[normalIndex++] = n1[1];
			normals[normalIndex++] = n1[2];

			normals[normalIndex++] = n2[0];
			normals[normalIndex++] = n2[1];
			normals[normalIndex++] = n2[2];

			normals[normalIndex++] = n2[0];
			normals[normalIndex++] = n2[1];
			normals[normalIndex++] = n2[2];

			normals[normalIndex++] = n2[0];
			normals[normalIndex++] = n2[1];
			normals[normalIndex++] = n2[2];
		}
	}
	vertexCount = positions.length/3;
	return {positions, normals};
};

const initPositionBuffer = (gl, positions) => {
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	return positionBuffer;
};

const initNormalBuffer = (gl, normals) => {
	const normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	return normalBuffer;
};

const drawScene = (gl, programInfo, buffers) => {
	gl.clearColor(0.1, 0.3, 0.6, 1.0);
	gl.clearDepth(1.0); // Clear everything
	gl.enable(gl.DEPTH_TEST); // Enable depth testing
	gl.depthFunc(gl.LEQUAL); // Near things obscure far things

	// Clear the canvas before we start drawing on it.

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Create a perspective matrix with field of view as 45 degrees.

	const fieldOfView = (45 * Math.PI) / 180; // in radians
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	const zNear = 0.1;
	const zFar = 1000.0;
	const projectionMatrix = mat4.create();

	// note: glmatrix.js always has the first argument
	// as the destination to receive the result.
	mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

	// Set the drawing position to the "identity" point, which is
	// the center of the scene.
	const modelViewMatrix = mat4.create();
	const rotXMatrix = mat4.create();
	const xAxis = vec3.fromValues(1.0, 0.0, 0.0);

	mat4.fromRotation(rotXMatrix, Math.PI*0.2, xAxis);

	// Now move the drawing position a bit to where we want to
	// start drawing the square.
	mat4.translate(
		modelViewMatrix, // destination matrix
		modelViewMatrix, // matrix to translate
		[0.0, -160.0, -550.0] // amount to translate
	);

	// Tell WebGL how to pull out the positions from the position
	// buffer into the vertexPosition attribute.
	setPositionAttribute(gl, buffers, programInfo);
	setNormalAttribute(gl, buffers, programInfo);

	// Tell WebGL to use our program when drawing
	gl.useProgram(programInfo.program);

	// Set the shader uniforms
	gl.uniformMatrix4fv(
		programInfo.uniformLocations.projectionMatrix,
		false,
		projectionMatrix,
	);
	gl.uniformMatrix4fv(
		programInfo.uniformLocations.modelViewMatrix,
		false,
		modelViewMatrix,
	);
	gl.uniformMatrix4fv(
		programInfo.uniformLocations.rotXMatrix,
		false,
		rotXMatrix,
	);

	{
		const offset = 0;
		gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
	}
};

// Tell WebGL how to pull out the positions from the position
// buffer into the vertexPosition attribute.
const setPositionAttribute = (gl, buffers, programInfo) => {
	const numComponents = 3; // pull out 3 values per iteration
	const type = gl.FLOAT; // the data in the buffer is 32bit floats
	const normalize = false; // don't normalize
	const stride = 0; // how many bytes to get from one set of values to the next
	// 0 = use type and numComponents above
	const offset = 0; // how many bytes inside the buffer to start from
	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
	gl.vertexAttribPointer(
		programInfo.attribLocations.vertexPosition,
		numComponents,
		type,
		normalize,
		stride,
		offset,
	);
	gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
};

// Tell WebGL how to pull out the normals from the normal
// buffer into the vertexNormal attribute.
const setNormalAttribute = (gl, buffers, programInfo) => {
	const numComponents = 3; // pull out 3 values per iteration
	const type = gl.FLOAT; // the data in the buffer is 32bit floats
	const normalize = true; // normalize
	const stride = 0; // how many bytes to get from one set of values to the next
	// 0 = use type and numComponents above
	const offset = 0; // how many bytes inside the buffer to start from
	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
	gl.vertexAttribPointer(
		programInfo.attribLocations.vertexNormal,
		numComponents,
		type,
		normalize,
		stride,
		offset,
	);
	gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);
};

main();
