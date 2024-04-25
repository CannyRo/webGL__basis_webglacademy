function main() {
  const canvas = document.querySelector("#gl_canvas");
  // or
  // const canvas = document.getElementById("#glCanvas");

  // define the canvas size : HERE we've did it in CSS stylesheet
  // canvas.width = window.innerWidth;
  // canvas.height = window.innerHeight;

  // *=== GET WEBGL CONTEXT ===* //
  let gl;
  try {
    gl = canvas.getContext("webgl", {antialias: true});
  } catch(error){
      alert("WebGL context cannot be initialized");
      return false;
  }
  // if (!gl) {
  //   alert("WebGL context cannot be initialized");
  //     return;
  // }

  // Set clear color to black, fully opaque
//   gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  // = redrawing the canvas with the background color
//   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Define shaders
  // Vertex shader
  const shader_vertex_source = `
    attribute vec2 position; // the position of the point
    attribute vec3 color;  // the color of the point

    varying vec3 vColor;
    void main(void) { // pre-built function
        gl_Position = vec4(position, 0., 1.); // 0. is the z, and 1 is w
        vColor = color;
  }`;
  // Fragment shader
  const shader_fragment_source = `
    precision mediump float;



    varying vec3 vColor;


    void main(void) {
        gl_FragColor = vec4(vColor, 1.); // black color
  }`;

  // Creates a shader of the given type, 
  // uploads the source and compiles it.
  let load_shader = function(source, type, typeString) {
    const shader = gl.createShader(type);
    // Send the source to the shader object
    gl.shaderSource(shader, source);
    // Compile the shader program
    gl.compileShader(shader);
    // See if it compiled successfully else it manages errors
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
        alert("ERROR IN " + typeString + " SHADER " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
  }

  // Run the create, load and compile shader for our 2 shaders (vertex, fragment)
  const shader_vertex = load_shader(shader_vertex_source, gl.VERTEX_SHADER, "VERTEX");
  const shader_fragment = load_shader(shader_fragment_source, gl.FRAGMENT_SHADER, "FRAGMENT");

  // Create shader program (a combination of a vertex and fragment shader to specify a material)
  const shader_program = gl.createProgram();
  gl.attachShader(shader_program, shader_vertex);
  gl.attachShader(shader_program, shader_fragment);
  // Links th shader program to the WebGL context in order to 
  // match the shader variables to js variables
  gl.linkProgram(shader_program);
  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shader_program, gl.LINK_STATUS)) {
    alert(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(shader_program,)}`,
    );
    return null;
  }
  // Look up which attribute our shader program is using
  // for "position" and "color" and look up uniform locations
  const _color = gl.getAttribLocation(shader_program, "color");
  const _position = gl.getAttribLocation(shader_program, "position");
  // Tell WebGL how to pull out the positions into the vertexPosition and color attribute.
  gl.enableVertexAttribArray(_color);
  gl.enableVertexAttribArray(_position);
  // Tell WebGL to use our program when drawing
  gl.useProgram(shader_program);

  // *====* // == THE TRIANGLE == // *====*//

  // ### POINTS ###

  // Declare the triangle vertex array and build the associated
  // Vertex Buffer Object (VBO) that's a typed array stored in the GPU memory

  const triangle_vertex = [ //= positions
    -1, -1, // first corner (ind 0) : -> bottom left of the viewport
    0, 0, 1, // first corner -> color: blue
    1, -1, // (ind 1) bottom right of the viewport
    1, 1, 0, // second corner -> color: yellow
    1, 1, // (ind 2) top right of the viewport
    1, 0, 0,  // third corner -> color: red
  ];

  // Create a buffer for the triangle positions.
  const triangle_vertex_buffer = gl.createBuffer();
  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, triangle_vertex_buffer);
  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangle_vertex), gl.STATIC_DRAW);

  // ### FACES ###

  const triangle_face = [0, 1, 2]; //= index
  // Create a buffer for the triangle index.
  const triangle_face_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangle_face_buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangle_face), gl.STATIC_DRAW);

  // *====* // == DRAWING == // *====*//
  gl.clearColor(0.0, 0.0, 0.0, 0.0);

  const animate = function(){
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // [ ... ]
    gl.bindBuffer(gl.ARRAY_BUFFER, triangle_vertex_buffer);

    //gl.vertexAttribPointer(variable, dimmension, type, normalize,
    // total vertex size in bytes, offset)
    gl.vertexAttribPointer(_position, 2, gl.FLOAT, false, 4*(2+3), 0);
    gl.vertexAttribPointer(_color, 3, gl.FLOAT, false, 4*(2+3), 2*4);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangle_face_buffer);

    gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);
    // [ ... ]


    gl.flush();
    window.requestAnimationFrame(animate);
  };
  animate();
}

window.addEventListener("load", main);
