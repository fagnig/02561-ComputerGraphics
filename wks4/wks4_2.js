var gl
var program

var numPoints = []

function triangle(a, b, c){
  numPoints.push(a);
  numPoints.push(b);
  numPoints.push(c);
}

function divideTriangle(a, b, c, count)
{
  if (count > 0) {
    var ab = normalize(mix(a, b, 0.5), true);
    var ac = normalize(mix(a, c, 0.5), true);
    var bc = normalize(mix(b, c, 0.5), true);

    divideTriangle(a, ab, ac, count - 1);
    divideTriangle(ab, b, bc, count - 1);
    divideTriangle(bc, c, ac, count - 1);
    divideTriangle(ab, bc, ac, count - 1);
  }
  else {
    triangle(a, b, c);
  }
}

function tetrahedron(a, b, c, d, n)
{
  numPoints.length = 0;
  divideTriangle(a, b, c, n);
  divideTriangle(d, c, b, n);
  divideTriangle(a, d, b, n);
  divideTriangle(a, c, d, n);
}

function go()
{
  var va = vec4(0.0, 0.0, -1.0, 1)
  var vb = vec4(0.0, 0.942809, 0.333333, 1)
  var vc = vec4(-0.816497, -0.471405, 0.333333, 1)
  var vd = vec4(0.816497, -0.471405, 0.333333, 1)

  tetrahedron(va,vb,vc,vd,timestosubdivide)
}

var vertbuffer

var radius = 5;
var theta  = radians(45.0);
var phi    = radians(45.0);
var znear  = -3.0
var zfar   = 1.0
var fov    = 45.0

var at  = vec3(0.5, 0.5, 0.5);
var up  = vec3(0.0, 1.0, 0.0);

var timestosubdivide = 3;

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
  gl.enable(gl.CULL_FACE)

  program = initShaders(gl, "vertex-shader", "fragment-shader")
  gl.useProgram(program);

  vertbuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, numPoints.length, gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  var viewloc = gl.getUniformLocation(program, "view");
  gl.uniformMatrix4fv(viewloc, false, flatten(mat4_getModelViewMatrix(vec3_getEye(0))) );

  var aratio = canv.width / canv.height;
  var projMat = perspective(fov, aratio, znear, zfar);

  var projloc = gl.getUniformLocation(program, "proj");
  gl.uniformMatrix4fv(projloc, false, flatten(projMat) );

  render(vertbuffer)
}

function render()
{
  go(timestosubdivide)
  gl.bindBuffer(gl.ARRAY_BUFFER, vertbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(numPoints), gl.STATIC_DRAW);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, numPoints.length);

  requestAnimationFrame(render);
}

function doKeyDown(e)
{
  //up 38
  //down 40
  if(e.keyCode == 38)
    timestosubdivide++;
  if(e.keyCode == 40)
    timestosubdivide--;

  document.getElementById("perspectiveinfo").innerHTML = "Current subdivision: "+(timestosubdivide);
}