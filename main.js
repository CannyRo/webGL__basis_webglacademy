function main() {
  const canvas = document.querySelector("#gl_canvas");
  // or
  // const canvas = document.getElementById("#glCanvas");

  // define the canvas size : HERE we've did it in CSS stylesheet
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  /*========================= Mouse position ========================= */
  let mouse_position = [0, 0];
  document.addEventListener("mousemove", function(e){
    mouse_position[0] = e.clientX,
    mouse_position[1] = e.clientY;
  }, false);

/*========================= GET WEBGL CONTEXT ========================= */
  let gl;
  try {
    gl = canvas.getContext("webgl", {antialias: false});
  } catch(error){
      alert("WebGL context cannot be initialized");
      return false;
  }

  // Set clear color to black, fully opaque
  // gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  // = redrawing the canvas with the background color
  // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

/*========================= SHADERS ========================= */
/*jshint multistr: true */

  // Vertex shader
//   const shader_vertex_source = `
//     attribute vec2 position; // the position of the point
//     attribute vec3 color;  // the color of the point

//     varying vec3 vColor;
//     void main(void) { // pre-built function
//         gl_Position = vec4(position, 0., 1.); // 0. is the z, and 1 is w
//         vColor = color;
//   }`;
  const shader_vertex_source = `
    attribute vec2 position; // the position of the point
    varying vec2 surfacePosition;
    void main(void) { // pre-built function
        gl_Position = vec4(position, 0., 1.); // 0. is the z, and 1 is w
        surfacePosition = position;
  }`;
  // Fragment shader
//   const shader_fragment_source = `
//     precision mediump float;



//     varying vec3 vColor;


//     void main(void) {
//         gl_FragColor = vec4(vColor, 1.); // black color
//   }`;

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
        return false;
    }
    return shader;
  }

  // Run the create, load and compile shader for our 2 shaders (vertex, fragment)
  const shader_vertex = load_shader(shader_vertex_source, gl.VERTEX_SHADER, "VERTEX");
//   const shader_fragment = load_shader(shader_fragment_source, gl.FRAGMENT_SHADER, "FRAGMENT");

  let shader_fragment_textarea = document.querySelector("#fragment_course_textarea");

  let _position, shader_program;

//   let _color;
  let _resolution;
  let _time;
  let _mouse;

  const refresh_fragment_shader = function(){
    const shader_fragment = gl.createShader(gl.FRAGMENT_SHADER);
    // gl.shaderSource(shader_fragment, shader_fragment_textarea.value);
    gl.shaderSource(shader_fragment, code_view?code_view.getValue():shader_fragment_textarea.value);
    // let foo; //= code_view?code_view.getValue():shader_fragment_textarea.value;
    // if(code_view){
    //   foo = code_view.getValue();
    // } else { 
    //     foo = shader_fragment_textarea.value;
    // }
    // gl.shaderSource(shader_fragment, foo);
    gl.compileShader(shader_fragment);
    if(gl.getShaderParameter(shader_fragment, gl.COMPILE_STATUS)){
        shader_program = gl.createProgram();

        gl.attachShader(shader_program, shader_vertex);
        gl.attachShader(shader_program, shader_fragment);

        gl.linkProgram(shader_program);

        _mouse = gl.getUniformLocation(shader_program, "mouse"); // we link the GLSL fragment shader 'mouse' variable with js '_mouse' variable
        _time = gl.getUniformLocation(shader_program, "time"); //we link the GLSL fragment shader 'time' variable with js '_time' variable
        _resolution = gl.getUniformLocation(shader_program, "resolution");//we link the GLSL fragment shader 'resolution' variable with js '_resolution' variable
        // _color = gl.getAttribLocation(shader_program, "color"); //we link the GLSL fragment shader 'color' variable with js '_color' variable
        _position = gl.getAttribLocation(shader_program, "position"); //we link the GLSL fragment shader 'position' variable with js '_position' variable

        // gl.enableVertexAttribArray(_color);
        gl.enableVertexAttribArray(_position);

        gl.useProgram(shader_program);
    }
  };
  refresh_fragment_shader();

  var code_view = CodeMirror.fromTextArea(shader_fragment_textarea, {
    lineNumbers: true,
    matchBrackets: true,
    indentWithTabs: true,
    tabSize: 8,
    indentUnit:8,
    mode: "text/x-glsl",
    onChange: refresh_fragment_shader
  });
  for (let i=0; i<code_view.lineCount(); i++) {
    code_view.indentLine(i);
  };
//   shader_fragment_textarea.onkeyup=refresh_fragment_shader;

  // Create shader program (a combination of a vertex and fragment shader to specify a material)
//   const shader_program = gl.createProgram();
//   gl.attachShader(shader_program, shader_vertex);
//   gl.attachShader(shader_program, shader_fragment);
//   // Links th shader program to the WebGL context in order to 
//   // match the shader variables to js variables
//   gl.linkProgram(shader_program);
//   // If creating the shader program failed, alert
//   if (!gl.getProgramParameter(shader_program, gl.LINK_STATUS)) {
//     alert(
//       `Unable to initialize the shader program: ${gl.getProgramInfoLog(shader_program,)}`,
//     );
//     return null;
//   }
//   // Look up which attribute our shader program is using
//   // for "position" and "color" and look up uniform locations
//   const _color = gl.getAttribLocation(shader_program, "color");
//   const _position = gl.getAttribLocation(shader_program, "position");
//   // Tell WebGL how to pull out the positions into the vertexPosition and color attribute.
//   gl.enableVertexAttribArray(_color);
//   gl.enableVertexAttribArray(_position);
//   // Tell WebGL to use our program when drawing
//   gl.useProgram(shader_program);

/*========================= THE TRIANGLE ========================= */
// ### POINTS ###

  // Declare the triangle vertex array and build the associated
  // Vertex Buffer Object (VBO) that's a typed array stored in the GPU memory

  const triangle_vertex = [ //= positions
    -1, -1, // first corner (ind 0) : -> bottom left of the viewport
    // 0, 0, 1, // first corner -> color: blue
    1, -1, // (ind 1) bottom right of the viewport
    // 1, 1, 0, // second corner -> color: yellow
    1, 1, // (ind 2) top right of the viewport
    // 1, 0, 0,  // third corner -> color: red
    -1,1, // we add the top left corner to the vertices
    // 1, 1, 1,
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

  const triangle_face = [0, 1, 2, 0, 2, 3]; //= index
  // Create a buffer for the triangle index.
  const triangle_face_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangle_face_buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangle_face), gl.STATIC_DRAW);

/*========================= DRAWING ========================= */
  gl.clearColor(0.0, 0.0, 0.0, 0.0);

  const animate = function(timestamp){
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // [ ... ]
    gl.uniform2fv(_mouse, mouse_position); // give the mouse position to the shader program
    gl.uniform1f(_time, timestamp * 0.001); // give the time to the shader program
    gl.uniform2f(_resolution, canvas.width, canvas.height); // give the canvas size to the shader program
    gl.bindBuffer(gl.ARRAY_BUFFER, triangle_vertex_buffer);

    //gl.vertexAttribPointer(variable, dimmension, type, normalize,
    // total vertex size in bytes, offset)
    // gl.vertexAttribPointer(_position, 2, gl.FLOAT, false, 4*(2+3), 0);
    gl.vertexAttribPointer(_position, 2, gl.FLOAT, false, 4*2, 0);
    // gl.vertexAttribPointer(_color, 3, gl.FLOAT, false, 4*(2+3), 2*4);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangle_face_buffer);

    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0); // we draw 2 triangles ie 2*3=6 points
    // [ ... ]


    gl.flush();
    window.requestAnimationFrame(animate);
  };
  animate(0);
}

window.addEventListener("load", main);
