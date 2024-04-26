function main() {
  const canvas = document.getElementById("gl_canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  /*========================= CAPTURE MOUSE EVENTS ========================= */
  let drag = false; // Is dragging the mouse ?
  const AMORTIZATION = 0.95;
  let x_prev, y_prev; // X & Y previous values
  let dX = 0, dY = 0;
  let THETA = 0, PHI = 0; // coef to rotation X & Y in radians
  

  const mouseDown = function(e) {
    drag = true;
    x_prev = e.pageX, y_prev = e.pageY;
    e.preventDefault();
    return false;
  };

  const mouseUp = function(e) {
    drag = false;
  };

  const mouseMove = function(e) {
    if(!drag) return false;
    dX = (e.pageX - x_prev) * 2 * Math.PI / canvas.width;
    dY = (e.pageY - y_prev) * 2 * Math.PI / canvas.height;
    THETA += dX ;
    PHI += dY ;
    x_prev = e.pageX, y_prev = e.pageY;
    e.preventDefault();
  };

  canvas.addEventListener("mousedown", mouseDown, false);
  canvas.addEventListener("mouseup", mouseUp, false);
  canvas.addEventListener("mouseout", mouseUp, false);
  canvas.addEventListener("mousemove", mouseMove, false);

  /*========================= GET WEBGL CONTEXT ========================= */
  let gl;
  try {
    gl = canvas.getContext("webgl", { antialias: true });
  } catch (e) {
    alert("WebGL context cannot be initialized");
    return false;
  }

  /*========================= SHADERS ========================= */
  /*jshint multistr: true */

  const shader_vertex_source ="\n\
  attribute vec3 position;\n\
  uniform mat4 Pmatrix, Vmatrix, Mmatrix;\n\
  attribute vec3 color; // the color of the point\n\
  varying vec3 vColor; // color which will be interpolated per pix\n\
  \n\
  void main(void) {\n\
  gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.);\n\
  vColor = color;\n\
  }";

  const shader_fragment_source ="\n\
  precision mediump float;\n\
  varying vec3 vColor;\n\
  \n\
  void main(void) {\n\
  gl_FragColor = vec4(vColor, 1.);\n\
  }";

  const compile_shader = function (source, type, typeString) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(
        "ERROR IN " + typeString + " SHADER: " + gl.getShaderInfoLog(shader)
      );
      return false;
    }
    return shader;
  };

  const shader_vertex = compile_shader(shader_vertex_source, gl.VERTEX_SHADER, "VERTEX");
  const shader_fragment = compile_shader(shader_fragment_source, gl.FRAGMENT_SHADER, "FRAGMENT");

  const SHADER_PROGRAM = gl.createProgram();
  gl.attachShader(SHADER_PROGRAM, shader_vertex);
  gl.attachShader(SHADER_PROGRAM, shader_fragment);

  gl.linkProgram(SHADER_PROGRAM);

  const _Pmatrix = gl.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
  const _Vmatrix = gl.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
  const _Mmatrix = gl.getUniformLocation(SHADER_PROGRAM, "Mmatrix");

  const _color = gl.getAttribLocation(SHADER_PROGRAM, "color");
  const _position = gl.getAttribLocation(SHADER_PROGRAM, "position");

  gl.enableVertexAttribArray(_color);
  gl.enableVertexAttribArray(_position);

  gl.useProgram(SHADER_PROGRAM);

  /*========================= THE CUBE ========================= */
  // POINTS:
  const cube_vertex = [
    -1, -1, -1,     1, 1, 0, // Back face with color : yellow
    1, -1, -1,      1, 1, 0,
    1, 1, -1,       1, 1, 0, 
    -1, 1, -1,      1, 1, 0, 

    -1, -1, 1,      0, 0, 1, //Front face with color : blue
    1, -1, 1,       0, 0, 1,
    1, 1, 1,        0, 0, 1,
    -1, 1, 1,       0, 0, 1,

    -1, -1, -1,     0, 1, 1, //Left face with color : cyan
    -1, 1, -1,      0, 1, 1,
    -1, 1, 1,       0, 1, 1,
    -1, -1, 1,      0, 1, 1,

    1, -1, -1,      1, 0, 0, //Right face with color : red
    1, 1, -1,       1, 0, 0,
    1, 1, 1,        1, 0, 0,
    1, -1, 1,       1, 0, 0,

    -1, -1, -1,     1, 0, 1, //Bottom face with color : purple
    -1, -1, 1,      1, 0, 1,
    1, -1, 1,       1, 0, 1,
    1, -1, -1,      1, 0, 1,

    -1, 1, -1,      0, 1, 0, //Top face with color : green
    -1, 1, 1,       0, 1, 0,
    1, 1, 1,        0, 1, 0,
    1, 1, -1,       0, 1, 0,
  ];

  const CUBE_VERTEX = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, CUBE_VERTEX);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube_vertex), gl.STATIC_DRAW);

  // FACES:
  const cube_faces = [
    0, 1, 2, // 2 triangles for back face
    0, 2, 3,

    4, 5, 6, // front face
    4, 6, 7, 

    8, 9, 10, // left face
    8, 10, 11,

    12, 13, 14, // right face
    12, 14, 15,

    16, 17, 18, // bottom face
    16, 18, 19, 

    20, 21, 22, // top face
    20, 22, 23
];
  const CUBE_FACES = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(cube_faces),
    gl.STATIC_DRAW
  );

  /*========================= MATRIX ========================= */

  const PROJMATRIX = LIBS.get_projection(40, canvas.width / canvas.height, 1, 100);
  const MOVEMATRIX = LIBS.get_I4();
  const VIEWMATRIX = LIBS.get_I4();

  LIBS.translateZ(VIEWMATRIX, -6);

  /*========================= DRAWING ========================= */
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clearDepth(1.0);

  let time_prev = 0;
  const animate = function (time) {
    let dt = time - time_prev;
    if(!drag) {
      dX *= AMORTIZATION, dY *= AMORTIZATION;
      THETA += dX, PHI += dY;
    }
    LIBS.set_I4(MOVEMATRIX);
    LIBS.rotateY(MOVEMATRIX, THETA);
    LIBS.rotateX(MOVEMATRIX, PHI);
    time_prev = time;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
    gl.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
    gl.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);
    gl.bindBuffer(gl.ARRAY_BUFFER, CUBE_VERTEX);
    gl.vertexAttribPointer(_position, 3, gl.FLOAT, false, 4 * (3 + 3), 0);
    gl.vertexAttribPointer(_color, 3, gl.FLOAT, false, 4 * (3 + 3), 3 * 4);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
    gl.drawElements(gl.TRIANGLES, 6*2*3, gl.UNSIGNED_SHORT, 0); // 6 faces * 2 triangles per face * 3 points per triangle

    gl.flush();

    window.requestAnimationFrame(animate);
  };
  animate(0);
}

window.addEventListener("load", main);
