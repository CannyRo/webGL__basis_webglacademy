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
  uniform float greyscality;\n\
  varying vec3 vColor;\n\
  void main(void) {\n\
  \n\
  \n\
  float greyscaleValue = (vColor.r + vColor.g + vColor.b) / 3.;\n\
  vec3 greyscaleColor = vec3(greyscaleValue, greyscaleValue, greyscaleValue);\n\
  \n\
  \n\
  vec3 color = mix(greyscaleColor, vColor, greyscality);\n\
  gl_FragColor = vec4(color, 1.);\n\
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
  const _greyscality = gl.getUniformLocation(SHADER_PROGRAM, "greyscality");

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

  /*========================= THE TETRAHEDRON ========================= */
  // POINTS:
  const tetrahedron_vertex = [
    // base face points, included in the plane y = -1
    -1, -1, -1,     1, 0, 0,
    1, -1, -1,     0, 1, 0,
    0, -1, 1,      0, 0, 1,

    // corner:, in white
    0, 1, 0,     1, 1, 1
  ];

  const TETRAHEDRON_VERTEX = gl.createBuffer ();
  gl.bindBuffer(gl.ARRAY_BUFFER, TETRAHEDRON_VERTEX);
  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(tetrahedron_vertex),
    gl.STATIC_DRAW);

  // TETRAHEDRON FACES:
  const tetrahedron_faces = [
    0, 1, 2, // base

    0, 1, 3, // side 0
    1, 2, 3, // side 1
    0, 2, 3  // side 2
  ];
  const TETRAHEDRON_FACES = gl.createBuffer ();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, TETRAHEDRON_FACES);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(tetrahedron_faces),
    gl.STATIC_DRAW);

  /*========================= MATRIX ========================= */

  const PROJMATRIX = LIBS.get_projection(40, canvas.width / canvas.height, 1, 100);
  const MOVEMATRIX = LIBS.get_I4();
  const MOVEMATRIX_2 = LIBS.get_I4();
  const MOVEMATRIX_TETRA = LIBS.get_I4();

  const MOVEMATRIX_3 = LIBS.get_I4();
  const MOVEMATRIX_4 = LIBS.get_I4();

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

    // LIBS.set_I4(MOVEMATRIX);
    // LIBS.translateX(MOVEMATRIX, -2);
    // LIBS.rotateY(MOVEMATRIX, THETA);
    // LIBS.rotateX(MOVEMATRIX, PHI);

    // LIBS.set_I4(MOVEMATRIX_2);
    // LIBS.translateX(MOVEMATRIX_2, 2);
    // LIBS.rotateY(MOVEMATRIX_2, -THETA);
    // LIBS.rotateX(MOVEMATRIX_2, -PHI);
    LIBS.rotateX(MOVEMATRIX_TETRA, dt * 0.0031);
    LIBS.rotateZ(MOVEMATRIX_TETRA, Math.cos(time) * dt * 0.0022);
    LIBS.rotateY(MOVEMATRIX_TETRA, dt * -0.0034);

    LIBS.set_I4(MOVEMATRIX);
    LIBS.set_I4(MOVEMATRIX_2);
    LIBS.set_I4(MOVEMATRIX_3);
    LIBS.set_I4(MOVEMATRIX_4);
    const radius = 2;// half distance between the cube centers
    let pos_x = radius * Math.cos(PHI) * Math.cos(THETA);
    let pos_y = -radius * Math.sin(PHI);
    let pos_z = -radius * Math.cos(PHI) * Math.sin(THETA);

    LIBS.set_position(MOVEMATRIX, pos_x, pos_y, pos_z);
    LIBS.set_position(MOVEMATRIX_2, -pos_x, -pos_y, -pos_z);

    let pos_x_bis = -radius * Math.sin(PHI);
    let pos_y_bis = radius * Math.cos(PHI) * Math.cos(THETA);
    let pos_z_bis = -radius * Math.cos(PHI) * Math.sin(THETA); 

    // LIBS.set_position(MOVEMATRIX_3, pos_x_bis, pos_y_bis, pos_z_bis);
    LIBS.set_position(MOVEMATRIX_3, pos_y, pos_x, pos_z);
    LIBS.set_position(MOVEMATRIX_4, -pos_y, -pos_x, -pos_z);
    // LIBS.set_position(MOVEMATRIX_4, -pos_x_bis, -pos_y_bis, -pos_z_bis);


    LIBS.rotateY(MOVEMATRIX, THETA);
    LIBS.rotateY(MOVEMATRIX_2, THETA);
    LIBS.rotateY(MOVEMATRIX_3, THETA);
    LIBS.rotateY(MOVEMATRIX_4, THETA);

    LIBS.rotateZ(MOVEMATRIX, -PHI);
    LIBS.rotateZ(MOVEMATRIX_2, -PHI);
    LIBS.rotateZ(MOVEMATRIX_3, -PHI);
    LIBS.rotateZ(MOVEMATRIX_4, -PHI);
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

    gl.uniform1f(_greyscality, 1);
    // gl.drawElements(gl.TRIANGLES, 6*2*3, gl.UNSIGNED_SHORT, 0); // 6 faces * 2 triangles per face * 3 points per triangle
    gl.drawElements(gl.TRIANGLES, 3*2*3, gl.UNSIGNED_SHORT, 0); // 6 faces * 2 triangles per face * 3 points per triangle

    gl.uniform1f(_greyscality, 0);
    gl.drawElements(gl.TRIANGLES, 3*2*3, gl.UNSIGNED_SHORT, 3*2*3); 

    gl.uniform1f(_greyscality, 0.6);
    gl.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX_2);
    gl.drawElements(gl.TRIANGLES, 6*2*3, gl.UNSIGNED_SHORT, 0);

    gl.uniform1f(_greyscality, 0.3);
    gl.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX_3);
    gl.drawElements(gl.TRIANGLES, 6*2*3, gl.UNSIGNED_SHORT, 0);

    gl.uniform1f(_greyscality, 0);
    gl.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX_4);
    gl.drawElements(gl.TRIANGLES, 6*2*3, gl.UNSIGNED_SHORT, 0);

    // gl.uniform1f(_greyscality, 1);
    gl.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX_TETRA);
    gl.bindBuffer(gl.ARRAY_BUFFER, TETRAHEDRON_VERTEX);
    gl.vertexAttribPointer(_position, 3, gl.FLOAT, false, 4*(3+3), 0);
    gl.vertexAttribPointer(_color, 3, gl.FLOAT, false, 4*(3+3), 3*4);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, TETRAHEDRON_FACES);

    gl.uniform1f(_greyscality, 1);
    gl.drawElements(gl.TRIANGLES, 3*2, gl.UNSIGNED_SHORT, 0); // 2 faces of 4 so 2 faces * 3 points = 6

    gl.uniform1f(_greyscality, 0);
    gl.drawElements(gl.TRIANGLES, 3*2, gl.UNSIGNED_SHORT, 6*2); // starting at offset 6 in the indice array * 2 bytes per indices

    gl.flush();

    window.requestAnimationFrame(animate);
  };
  animate(0);
}

window.addEventListener("load", main);
