var gl
var program

var numPoints = [ vec3(0.0, 0.0, 0.0), vec3(1.0, 0.0, 0.0),
                  vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0),
                  vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0),
                  vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 0.0),
                  vec3(1.0, 0.0, 0.0), vec3(1.0, 0.0, 1.0),
                  vec3(0.0, 1.0, 0.0), vec3(0.0, 1.0, 1.0),
                  vec3(0.0, 1.0, 0.0), vec3(1.0, 1.0, 0.0),
                  vec3(0.0, 0.0, 1.0), vec3(1.0, 0.0, 1.0),
                  vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 1.0),
                  vec3(0.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0),
                  vec3(1.0, 0.0, 1.0), vec3(1.0, 1.0, 1.0),
                  vec3(1.0, 1.0, 0.0), vec3(1.0, 1.0, 1.0),
                ]

var radius = 1.0/1.5;
var theta  = radians(45.0);
var phi    = radians(45.0);
var phideg = 45;

var eye = vec3(radius*Math.sin(phi), radius*Math.sin(theta), radius*Math.cos(phi));
var at  = vec3(0.0, 0.0, 0.0);
var up  = vec3(0.0, 1.0, 0.0);

var shouldspin = false;

window.onload = function()
{
  var canv = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canv);

  addEventListener( "keydown", doKeyDown);

  gl.viewport(0, 0, canv.width, canv.height);
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

  program = initShaders(gl, "vertex-shader", "fragment-shader")
  gl.useProgram(program);

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(numPoints), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  var modelViewMatrix = lookAt(eye, at, up);

  var viewloc = gl.getUniformLocation(program, "view");
  gl.uniformMatrix4fv(viewloc, false, flatten(modelViewMatrix) );

  render(buffer)
}

function render()
{
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.LINES, 0, numPoints.length);
  if(shouldspin)
  {
    phideg = (++phideg) % 360;
    phi = radians(phideg);
    eye = vec3(radius*Math.sin(phi), radius*Math.sin(theta), radius*Math.cos(phi));
    var modelViewMatrix = lookAt(eye, at, up);
    var viewloc = gl.getUniformLocation(program, "view");
    gl.uniformMatrix4fv(viewloc, false, flatten(modelViewMatrix) );  
  }
  requestAnimationFrame(render);
}

function doKeyDown(e)
{
  if(e.keyCode == 32)
    {
      shouldspin = !shouldspin;
    }
}