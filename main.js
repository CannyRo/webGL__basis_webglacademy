function main() {
  const canvas = document.getElementById("gl_canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // *=== GET WEBGL CONTEXT ===* //
  let gl;
  try {
    gl = canvas.getContext("webgl", { antialias: true });
  } catch (error) {
    alert("WebGL context cannot be initialized");
    return false;
  }
  /*========================= SHADERS ========================= */
  /*jshint multistr: true */
  const shader_vertex_source = "\n\
    attribute vec3 position; // the position of the point\n\
    uniform mat4 Pmatrix; // camera's projection matrix\n\
    uniform mat4 Vmatrix; // movement matrix from Object ref to View ref\n\
    uniform mat4 Mmatrix; // camera's movement matrix\n\
    attribute vec3 color; // the color of the point\n\
    varying vec3 vColor;\n\
    void main(void) { // pre-built function\n\
    gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.); // 0. is the z, and 1 is w\n\
    vColor = color;\n\
  }";

  const shader_fragment_source = "\n\
    precision mediump float;\n\
    varying vec3 vColor;\n\
    void main(void) {\n\
    gl_FragColor = vec4(vColor, 1.);\n\
  }";

  var load_shader = function(source, type, typeString) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert("ERROR IN " + typeString + " SHADER: " + gl.getShaderInfoLog(shader));
      return false;
    }
    return shader;
  };

  const shader_vertex = load_shader(shader_vertex_source, gl.VERTEX_SHADER, "VERTEX");
  const shader_fragment = load_shader(shader_fragment_source, gl.FRAGMENT_SHADER, "FRAGMENT");

  const shader_program=gl.createProgram();
  gl.attachShader(shader_program, shader_vertex);
  gl.attachShader(shader_program, shader_fragment);

  gl.linkProgram(shader_program);

  const _Pmatrix = gl.getUniformLocation(shader_program, "Pmatrix");
  const _Vmatrix = gl.getUniformLocation(shader_program, "Vmatrix");
  const _Mmatrix = gl.getUniformLocation(shader_program, "Mmatrix");

  const _color = gl.getAttribLocation(shader_program, "color");
  const _position = gl.getAttribLocation(shader_program, "position");

  gl.enableVertexAttribArray(_color);
  gl.enableVertexAttribArray(_position);

  gl.useProgram(shader_program);

  /*========================= THE TRIANGLE ========================= */
  // POINTS:
  const triangle_vertex = [
    -1, -1, 0, // first corner: -> bottom left of the viewport
    0, 0, 1,
    1, -1, 0, // bottom right of the viewport
    1, 1, 0,
    1, 1, 0, // top right of the viewport
    1, 0, 0
  ];

  const triangle_vertex_buffer = gl.createBuffer ();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangle_vertex_buffer);
  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(triangle_vertex),
    gl.STATIC_DRAW);

  // FACES:
  const triangle_faces = [0, 1, 2];
  const triangle_faces_buffer = gl.createBuffer ();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangle_faces_buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(triangle_faces),
    gl.STATIC_DRAW);

  /*========================= MATRIX ========================= */

  const PROJMATRIX = LIBS.get_projection(40, canvas.width/canvas.height, 1, 100);
  const MOVEMATRIX = LIBS.get_I4();
  const VIEWMATRIX = LIBS.get_I4();

  LIBS.translateZ(VIEWMATRIX, -5);

  /*========================= DRAWING ========================= */
  gl.clearColor(0.0, 0.0, 0.0, 0.0);

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearDepth(1.0);

  let time_prev = 0;
  const animate = function(time) {
    // let dAngle = 0.005*(time-time_prev);
    let dt=time-time_prev;
    LIBS.rotateY(MOVEMATRIX, dt*0.005);
    LIBS.rotateX(MOVEMATRIX, dt*0.004);
    LIBS.rotateZ(MOVEMATRIX, dt*0.003);
    time_prev = time;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
    gl.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
    gl.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);
    gl.bindBuffer(gl.ARRAY_BUFFER, triangle_vertex_buffer);
    gl.vertexAttribPointer(_position, 3, gl.FLOAT, false, 4*(3+3), 0);
    gl.vertexAttribPointer(_color, 3, gl.FLOAT, false, 4*(3+3), 3*4);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangle_faces_buffer);
    gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);

    gl.flush();

    window.requestAnimationFrame(animate);
  };
animate(0);

}
window.addEventListener("load", main);