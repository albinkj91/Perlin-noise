function main() {
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
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vertexPos;
    }
  `;

	const fragShader = `
    void main() {
      gl_FragColor = vec4(0.2, 0.4, 0.1, 1.0);
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
		},
		uniformLocations: {
			projectionMatrix: gl.getUniformLocation(shaderProgram, "projectionMatrix"),
			modelViewMatrix: gl.getUniformLocation(shaderProgram, "modelViewMatrix"),
		},
	};

	// Here's where we call the routine that builds all the
	// objects we'll be drawing.
	const buffers = initBuffers(gl);

	// Draw the scene
	drawScene(gl, programInfo, buffers);
}

function initShaderProgram(gl, vsSource, fsSource) {
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
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
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
}

function initBuffers(gl) {
	const positionBuffer = initPositionBuffer(gl);

	return {
		position: positionBuffer
	};
}

function initPositionBuffer(gl) {
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	return positionBuffer;
}

function drawScene(gl, programInfo, buffers) {
	gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
	gl.clearDepth(1.0); // Clear everything
	gl.enable(gl.DEPTH_TEST); // Enable depth testing
	gl.depthFunc(gl.LEQUAL); // Near things obscure far things

	// Clear the canvas before we start drawing on it.

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Create a perspective matrix, a special matrix that is
	// used to simulate the distortion of perspective in a camera.
	// Our field of view is 45 degrees, with a width/height
	// ratio that matches the display size of the canvas
	// and we only want to see objects between 0.1 units
	// and 100 units away from the camera.

	const fieldOfView = (45 * Math.PI) / 180; // in radians
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	const zNear = 0.1;
	const zFar = 100.0;
	const projectionMatrix = mat4.create();

	// note: glmatrix.js always has the first argument
	// as the destination to receive the result.
	mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

	// Set the drawing position to the "identity" point, which is
	// the center of the scene.
	const modelViewMatrix = mat4.create();

	// Now move the drawing position a bit to where we want to
	// start drawing the square.
	mat4.translate(
		modelViewMatrix, // destination matrix
		modelViewMatrix, // matrix to translate
		[-0.0, 0.0, -6.0] // amount to translate
	);

	// Tell WebGL how to pull out the positions from the position
	// buffer into the vertexPosition attribute.
	setPositionAttribute(gl, buffers, programInfo);

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

	{
		const offset = 0;
		const vertexCount = 4;
		gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
	}
}

// Tell WebGL how to pull out the positions from the position
// buffer into the vertexPosition attribute.
function setPositionAttribute(gl, buffers, programInfo) {
	const numComponents = 2; // pull out 2 values per iteration
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
}

main();
