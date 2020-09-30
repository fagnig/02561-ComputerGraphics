var gl
var program

var numPoints = []
var numNormals = []

function triangle(a, b, c){
  numNormals.push(vec3(a[0], a[1], a[2]));
  numNormals.push(vec3(b[0], b[1], b[2]));
  numNormals.push(vec3(c[0], c[1], c[2]));

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
  numNormals.length = 0;
  divideTriangle(a, b, c, n);
  divideTriangle(d, c, b, n);
  divideTriangle(a, d, b, n);
  divideTriangle(a, c, d, n);
}

function go()
{
  var va = vec4(0.0, 0.0, 1.0, 1)
  var vb = vec4(0.0, 0.942809, -0.333333, 1)
  var vc = vec4(-0.816497, -0.471405, -0.333333, 1)
  var vd = vec4(0.816497, -0.471405, -0.333333, 1)

  tetrahedron(va,vb,vc,vd,timestosubdivide)
}

var vertbuffer

var radius = 3;
var znear  = 0.15
var zfar   = 15.0
var fov    = 45.0

var at  = vec3(0.0, 0.0, 0.0);
var up  = vec3(0.0, 1.0, 0.0);

var rotation = 0;
var timestosubdivide = 3;

var lightEm = vec3(0.5,0.5,0.5)

function vec3_getEye(rotation) {
  var tmpeye = vec3(
    radius * Math.sin(rotation),
    radius-2,
    radius * Math.cos(rotation)
  )
  return add(at, tmpeye)
}

function mat4_getModelViewMatrix(rotation) {
  return lookAt(vec3_getEye(rotation), at, up);
}
function loadListeners()
{
  addEventListener( "keydown", doKeyDown);

  document.getElementById("matShiny").addEventListener("input", onChangeShiny);
  document.getElementById("lightHeight").addEventListener("input", onChangeLightHeight);
  document.getElementById("lightem").addEventListener("input", onChangeLightEm);
  document.getElementById("matAmbi").addEventListener("input", onChangeMatAmbi);
  document.getElementById("matDiff").addEventListener("input", onChangeMatDiff);
  document.getElementById("matSpec").addEventListener("input", onChangeMatSpec);
}

window.onload = function()
{

  var canv = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canv);

  loadListeners();

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

  var vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, numPoints.length);
  gl.enableVertexAttribArray(vNormal);

  var aratio = canv.width / canv.height;
  var projMat = perspective(fov, aratio, znear, zfar);

  var projloc = gl.getUniformLocation(program, "proj");
  gl.uniformMatrix4fv(projloc, false, flatten(projMat) );

  var lightDirloc = gl.getUniformLocation(program, "lightDir");
  gl.uniform3fv(lightDirloc, flatten(vec3(0.0,0.0,-1.0)) );
  var lightEmloc = gl.getUniformLocation(program, "lightEm");
  gl.uniform3fv(lightEmloc, flatten(vec3(0.5,0.5,0.5)) );
  var shininessloc = gl.getUniformLocation(program, "shininess");
  gl.uniform1f(shininessloc, 50.0 );
  var ambiProduct = gl.getUniformLocation(program, "ambiProduct");
  gl.uniform3fv(ambiProduct, [0.2, 0.2, 0.2] );
  var diffProduct = gl.getUniformLocation(program, "diffProduct");
  gl.uniform3fv(diffProduct, [0.4, 0.4, 0.4] );
  var specProduct = gl.getUniformLocation(program, "specProduct");
  gl.uniform3fv(specProduct, [0.8, 0.8, 0.8] );

  onChangeSubdivision();

  render(vertbuffer)
}

function onChangeSubdivision()
{
  go(timestosubdivide)
  gl.bindBuffer(gl.ARRAY_BUFFER, vertbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(numPoints.concat(numNormals)), gl.STATIC_DRAW);

  var vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, numPoints.length);
  gl.enableVertexAttribArray(vNormal);
}

function render()
{
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, numPoints.length);

  var viewloc = gl.getUniformLocation(program, "view");
  gl.uniformMatrix4fv(viewloc, false, flatten(mat4_getModelViewMatrix(rotation)) );

  rotation += 0.02;

  requestAnimationFrame(render);
}

function doKeyDown(e)
{
  var changed = false;
  //up 38
  //down 40
  if(e.keyCode == 38)
  {
    timestosubdivide++;
    changed = true;
  }
  if(e.keyCode == 40)
  {
    timestosubdivide--;
    changed = true;
  }

  if(changed)
    onChangeSubdivision();

  document.getElementById("perspectiveinfo").innerHTML = "Current subdivision: "+(timestosubdivide);
}

function onChangeShiny()
{
  var val = event.target.value;

  var shininessloc = gl.getUniformLocation(program, "shininess");
  gl.uniform1f(shininessloc, val );
}

function onChangeLightHeight()
{
  var val = event.target.value;

  var lightDirloc = gl.getUniformLocation(program, "lightDir");
  gl.uniform3fv(lightDirloc, flatten(vec3(0.0,val,-1.0)) );
}

function onChangeLightEm()
{
  var col = event.target.value;
  var r = parseInt(col.substr(1,2), 16);
  var g = parseInt(col.substr(3,2), 16);
  var b = parseInt(col.substr(5,2), 16);

  lightEm = vec3(r/255, g/255, b/255);

  var lightEmloc = gl.getUniformLocation(program, "lightEm");
  gl.uniform3fv(lightEmloc, [r/255, g/255, b/255] );

  var col = document.getElementById("matAmbi").value
  r = parseInt(col.substr(1,2), 16);
  g = parseInt(col.substr(3,2), 16);
  b = parseInt(col.substr(5,2), 16);

  var matambi = vec3(r/255, g/255, b/255);
  var product = mult(lightEm, matambi);

  var ambiProdLoc = gl.getUniformLocation(program, "ambiProduct");
  gl.uniform3fv(ambiProdLoc, flatten(product) );

  var col = document.getElementById("matDiff").value
  r = parseInt(col.substr(1,2), 16);
  g = parseInt(col.substr(3,2), 16);
  b = parseInt(col.substr(5,2), 16);

  var matdiff = vec3(r/255, g/255, b/255);
  var product = mult(lightEm, matdiff);

  var diffProdLoc = gl.getUniformLocation(program, "diffProduct");
  gl.uniform3fv(diffProdLoc, flatten(product) );

  var col = document.getElementById("matSpec").value
  r = parseInt(col.substr(1,2), 16);
  g = parseInt(col.substr(3,2), 16);
  b = parseInt(col.substr(5,2), 16);

  var matspec = vec3(r/255, g/255, b/255);
  var product = mult(lightEm, matspec);

  var specProdLoc = gl.getUniformLocation(program, "specProduct");
  gl.uniform3fv(specProdLoc, flatten(product) );

}
function onChangeMatAmbi()
{
  var col = event.target.value;
  const r = parseInt(col.substr(1,2), 16);
  const g = parseInt(col.substr(3,2), 16);
  const b = parseInt(col.substr(5,2), 16);

  var matambi = vec3(r/255, g/255, b/255);
  var product = mult(lightEm, matambi);

  var ambiProdLoc = gl.getUniformLocation(program, "ambiProduct");
  gl.uniform3fv(ambiProdLoc, flatten(product) );
}
function onChangeMatDiff()
{
  var col = event.target.value;
  const r = parseInt(col.substr(1,2), 16);
  const g = parseInt(col.substr(3,2), 16);
  const b = parseInt(col.substr(5,2), 16);

  var matdiff = vec3(r/255, g/255, b/255);
  var product = mult(lightEm, matdiff);

  var diffProdLoc = gl.getUniformLocation(program, "diffProduct");
  gl.uniform3fv(diffProdLoc, flatten(product) );
}
function onChangeMatSpec()
{
  var col = event.target.value;
  const r = parseInt(col.substr(1,2), 16);
  const g = parseInt(col.substr(3,2), 16);
  const b = parseInt(col.substr(5,2), 16);

  var matspec = vec3(r/255, g/255, b/255);
  var product = mult(lightEm, matspec);

  var specProdLoc = gl.getUniformLocation(program, "specProduct");
  gl.uniform3fv(specProdLoc, flatten(product) );
}