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

var radius = 5;
var theta  = radians(45.0);
var phi    = radians(45.0);
var znear  = -3.0
var zfar   = 1.0
var fov    = 45.0

var at  = vec3(0.5, 0.5, 0.5);
var up  = vec3(0.0, 1.0, 0.0);

var perspectivetype = 0;

function vec3_getEye(type) {
  if (type == 0) {
    return vec3(at[0], at[1], radius*Math.cos(theta))
  } else if (type == 1) {
    return vec3(radius*Math.cos(theta)*Math.cos(phi), at[1], radius*Math.cos(theta))
  } else if (type == 2) {
    return vec3(radius*Math.sin(theta)*Math.cos(phi), radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta))
  }
}

function mat4_getModelViewMatrix(eye) {
  return lookAt(eye, at, up);
}

window.onload = function()
{
  var canv = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canv);

  addEventListener( "keydown", doKeyDown);

  gl.viewport(0, 0, canv.width, canv.height);
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
  gl.enable(gl.DEPTH_TEST)

  program = initShaders(gl, "vertex-shader", "fragment-shader")
  gl.useProgram(program);

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(numPoints), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  var viewloc = gl.getUniformLocation(program, "view");
  gl.uniformMatrix4fv(viewloc, false, flatten(mat4_getModelViewMatrix(vec3_getEye(perspectivetype))) );

  var aratio = canv.width / canv.height;
  var projMat = perspective(fov, aratio, znear, zfar);

  var projloc = gl.getUniformLocation(program, "proj");
  gl.uniformMatrix4fv(projloc, false, flatten(projMat) );

  render(buffer)
}

function render()
{
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.LINES, 0, numPoints.length);

  requestAnimationFrame(render);
}

function doKeyDown(e)
{
  if(e.keyCode == 32)
    {
      perspectivetype = (++perspectivetype) % 3;
      document.getElementById("perspectiveinfo").innerHTML = "Current perspective: "+(perspectivetype+1)+"-point";

      var modelViewMatrix = flatten(mat4_getModelViewMatrix(vec3_getEye(perspectivetype)));
      var viewloc = gl.getUniformLocation(program, "view");
      gl.uniformMatrix4fv(viewloc, false, flatten(modelViewMatrix) );    
    }
}