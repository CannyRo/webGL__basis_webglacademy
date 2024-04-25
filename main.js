function main() {
  const canvas = document.querySelector("#gl_canvas");
  // *=== GET WEBGL CONTEXT ===* //
  let gl;
  try {
    gl = canvas.getContext("webgl", { antialias: true });
  } catch (error) {
    alert("WebGL context cannot be initialized");
    return false;
  }
}
window.addEventListener("load", main);