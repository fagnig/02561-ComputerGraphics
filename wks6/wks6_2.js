var gl
var program

var numPoints = []
var numNormals = []

function triangle(a, b, c){
  numNormals.push(a);
  numNormals.push(b);
  numNormals.push(c);

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

function create2DTexture(gl, image) {
  var ext = gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic");
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  // gl.generateMipmap(gl.TEXTURE_2D);
  var max_anisotropy = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
  gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, max_anisotropy);
  return texture;
}

var vertbuffer

var radius = 3;
var znear  = 0.15
var zfar   = 15.0
var fov    = 45.0

var at  = vec3(0.0, 0.0, 0.0);
var up  = vec3(0.0, 1.0, 0.0);
var light = vec3(0, 2, 2);
var eye = vec3(0, 1, 2);

var rotation = 0;
var timestosubdivide = 3;

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
var runonce = false;
var image = document.createElement('img');
image.crossorigin = 'anonymous';
image.onload = function ()
{
  run();
}
image.src = 'earth_resized.jpg';

function run()
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

  var aratio = canv.width / canv.height;
  var projMat = perspective(fov, aratio, znear, zfar);

  var projloc = gl.getUniformLocation(program, "proj");
  gl.uniformMatrix4fv(projloc, false, flatten(projMat) );

  var tex = create2DTexture(gl, image);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

  var lightloc = gl.getUniformLocation(program, "light");
  gl.uniform3fv(lightloc, flatten(normalize(projMat * light)));

  onChangeSubdivision();

  render(vertbuffer)
}

function onChangeSubdivision()
{
  go(timestosubdivide)
  gl.bindBuffer(gl.ARRAY_BUFFER, vertbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(numPoints), gl.STATIC_DRAW);

}

function render()
{
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, numPoints.length);

  var viewloc = gl.getUniformLocation(program, "view");
  gl.uniformMatrix4fv(viewloc, false, flatten(mat4_getModelViewMatrix(rotation)) );

  rotation += 0.05;

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