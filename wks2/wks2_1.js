var gl
var program

var numPoints = []
var index = 0;

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

  canv.addEventListener("click", function() {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    var rc = event.target.getBoundingClientRect();
    
    correctedx = event.clientX - rc.left;
    correctedy = event.clientY - rc.top;

    var t = vec2(-1 + 2*correctedx/canv.width, -1 + 2*(canv.height-correctedy)/canv.height);
    //var t = vec2(-1 + 2*event.clientX/canv.width, -1 + 2*(canv.height-event.clientY)/canv.height);
    numPoints.push(t);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(numPoints), gl.STATIC_DRAW);
    //gl.bufferSubData(gl.ARRAY_BUFFER, sizeof["vec2"]*index, flatten(t));
    index++;
  });

  render(buffer)
}

function render()
{
  gl.clear(gl.COLOR_BUFFER_BIT);
  if(index > 0)
    gl.drawArrays(gl.POINTS, 0, index);
  requestAnimationFrame(render);
}