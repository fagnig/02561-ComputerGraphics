var gl
var program

var numPoints = [
                  vec2(0.0,  0.5), 
                  vec2(-0.5,  0.0), 
                  vec2(0.5, 0.0),
                  vec2(0.0, -0.5)
                ]

var colors = [
              vec3(0.0, 0.0, 0.0),
              vec3(0.0, 1.0, 0.0),
              vec3(0.0, 0.0, 1.0),
              vec3(1.0, 1.0, 1.0)
              ]

var pElapsed

window.onload = function()
{
  var canv = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canv);

  gl.viewport(0, 0, canv.width, canv.height);
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

  program = initShaders(gl, "vertex-shader", "fragment-shader")
  gl.useProgram(program);

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(numPoints), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  var colbuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

  var vColor = gl.getAttribLocation(program, "vColor");
  gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  pElapsed = gl.getUniformLocation(program, "elapsed");

  render(buffer)
}

var elapsed = 0.0
function render()
{
  elapsed += 0.1;
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform1f(pElapsed, elapsed);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, numPoints.length);

  requestAnimationFrame(render);
}