var gl
var program

var numPoints = []
var numNormals = []

var vertbuffer

var radius = 3;
var znear  = 0.15
var zfar   = 15.0
var fov    = 45.0

var at  = vec3(0.0, 0.0, 0.0);
var up  = vec3(0.0, 1.0, 0.0);

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

var g_objDoc = null; // The information of OBJ file
var g_drawingInfo = null; // The information for drawing 3D model

window.onload = function()
{
  var canv = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canv);

  document.getElementById("normals").addEventListener("input", onChangeNormals);

  gl.viewport(0, 0, canv.width, canv.height);
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)

  program = initShaders(gl, "vertex-shader", "fragment-shader")
  gl.useProgram(program);
  gl.program = program;

  gl.program.a_Position = gl.getAttribLocation(program, 'vPosition');
  gl.program.a_Normal = gl.getAttribLocation(program, 'vNormal');
  gl.program.a_Color = gl.getAttribLocation(program, 'vColor');

  var model = initVertexBuffers(gl, program);
  // Start reading the OBJ file
  readOBJFile('./teapot.obj', gl, model, 0.3, true);

  var aratio = canv.width / canv.height;
  var projMat = perspective(fov, aratio, znear, zfar);
  var projloc = gl.getUniformLocation(program, "proj");
  gl.uniformMatrix4fv(projloc, false, flatten(projMat) );

  //render(vertbuffer)
}

function render()
{

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);

  var viewloc = gl.getUniformLocation(program, "view");
  gl.uniformMatrix4fv(viewloc, false, flatten(mat4_getModelViewMatrix(rotation)) );

  rotation += 0.05;

  requestAnimationFrame(render);
}

function initVertexBuffers(gl, program) {
  var o = new Object();
  o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT);
  o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
  o.colorBuffer = createEmptyArrayBuffer(gl, program.a_Color, 4, gl.FLOAT);
  o.indexBuffer = gl.createBuffer();
  
  return o;
}

function createEmptyArrayBuffer(gl, a_attribute, num, type) {
  var buffer = gl.createBuffer(); // Create a buffer object
  
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute); // Enable the assignment
  
  return buffer;
}

function readOBJFile(fileName, gl, model, scale, reverse) {
  var request = new XMLHttpRequest();
  
  request.onreadystatechange = function() {
    if (request.readyState === 4 && request.status !== 404) {
      onReadOBJFile(request.responseText, fileName, gl, model, scale, reverse);
    }
  }
  request.open('GET', fileName, true); // Create a request to get file
  request.send(); // Send the request
}

// OBJ file has been read
function onReadOBJFile(fileString, fileName, gl, o, scale, reverse) {
  var objDoc = new OBJDoc(fileName); // Create a OBJDoc object
  var result = objDoc.parse(fileString, scale, reverse);
  if (!result) {
    g_objDoc = null; g_drawingInfo = null;
    console.log("OBJ file parsing error.");
    return;
  }
  g_objDoc = objDoc;

  g_drawingInfo = onReadComplete(gl, o, g_objDoc);

  render();
} 

function onReadComplete(gl, model, objDoc) {
  // Acquire the vertex coordinates and colors from OBJ file
  var drawingInfo = objDoc.getDrawingInfo();

  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices,gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

  return drawingInfo;
} 

function onChangeNormals()
{
  var val = event.target.checked ? 1.0 : 0.0;
  
  var normalLoc = gl.getUniformLocation(program, "normals");
  gl.uniform1f(normalLoc, val);
}
