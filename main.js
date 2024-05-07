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
    var EXT = gl.getExtension("OES_element_index_uint");
  } catch (e) {
    alert("WebGL context cannot be initialized");
    return false;
  }

  /*========================= SHADERS ========================= */
  /*jshint multistr: true */

  const shader_vertex_source ="\n\
  attribute vec3 position;\n\
  uniform mat4 Pmatrix, Vmatrix, Mmatrix;\n\
  attribute vec2 uv;\n\
  varying vec2 vUv;\n\
  \n\
  void main(void) {\n\
  gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.);\n\
  vUv = uv;\n\
  }";

  const shader_fragment_source ="\n\
  precision mediump float;\n\
  uniform sampler2D sampler;\n\
  varying vec2 vUv;\n\
  \n\
  void main(void) {\n\
  gl_FragColor = texture2D(sampler, vUv);\n\
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
  const _sampler = gl.getUniformLocation(SHADER_PROGRAM, "sampler");

  const _uv = gl.getAttribLocation(SHADER_PROGRAM, "uv");
  const _position = gl.getAttribLocation(SHADER_PROGRAM, "position");

  gl.enableVertexAttribArray(_uv);
  gl.enableVertexAttribArray(_position);

  gl.useProgram(SHADER_PROGRAM);
  gl.uniform1i(_sampler, 0);

  /*========================= THE DRAGON ========================= */

  let CUBE_VERTEX=false, CUBE_FACES=false, CUBE_NPOINTS=0;

  LIBS.get_json("/dragon.json", function(dragon){
    // vertices:
    CUBE_VERTEX = gl.createBuffer ();
    gl.bindBuffer(gl.ARRAY_BUFFER, CUBE_VERTEX);
    gl.bufferData(gl.ARRAY_BUFFER,
                  new Float32Array(dragon.vertices),
      gl.STATIC_DRAW);

    // faces:
    CUBE_FACES = gl.createBuffer ();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                  new Uint32Array(dragon.indices),
      gl.STATIC_DRAW);

    CUBE_NPOINTS = dragon.indices.length;

    animate(0);

  });



  /*========================= MATRIX ========================= */

  const PROJMATRIX = LIBS.get_projection(40, canvas.width / canvas.height, 1, 100);
  const MOVEMATRIX = LIBS.get_I4();
  const VIEWMATRIX = LIBS.get_I4();

  LIBS.translateZ(VIEWMATRIX, -20);
  LIBS.translateY(VIEWMATRIX, -4);

   /*========================= TEXTURES ========================= */
  const load_texture = function(image_URL){

    const texture = gl.createTexture();

    let image = new Image();

    image.src = image_URL;
    image.onload = function(e) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D, null);
    };

    return texture;
  };

  // const cube_texture = load_texture("/texture.png");
  const cube_texture = load_texture("/dragon.png");

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
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cube_texture);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, CUBE_VERTEX);
    gl.vertexAttribPointer(_position, 3, gl.FLOAT, false, 4 * (3 + 3 + 2), 0);
    gl.vertexAttribPointer(_uv, 2, gl.FLOAT, false, 4 * (3 + 3 + 2), (3+3) * 4);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
    gl.drawElements(gl.TRIANGLES, CUBE_NPOINTS, gl.UNSIGNED_INT, 0); // 6 faces * 2 triangles per face * 3 points per triangle

    gl.flush();

    window.requestAnimationFrame(animate);
  };
  animate(0);
}

window.addEventListener("load", main);
