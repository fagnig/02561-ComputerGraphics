var gl
var program

var PointsPos = [];
var PointsCol = [];
var index = 0;

var clearcol = [0.3921, 0.5843, 0.9294, 1.0];
var pointcol = [0.0,    0.0,    0.0,    1.0];

var max_verts = 2048;

var numPoints = 0;

window.onload = function()
{
  var canv = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canv);

  gl.viewport(0, 0, canv.width, canv.height);
  gl.clearColor(clearcol[0],clearcol[1],clearcol[2],clearcol[3]);

  program = initShaders(gl, "vertex-shader", "fragment-shader")
  gl.useProgram(program);

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec2'], gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  var colbuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec3'], gl.STATIC_DRAW);

  var vColor = gl.getAttribLocation(program, "vColor");
  gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  canv.addEventListener("click", function() {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    var rc = event.target.getBoundingClientRect();
    
    correctedx = event.clientX - rc.left;
    correctedy = event.clientY - rc.top;

    var t = vec2(-1 + 2*correctedx/canv.width, -1 + 2*(canv.height-correctedy)/canv.height);
    gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(t));
      
    gl.bindBuffer(gl.ARRAY_BUFFER, colbuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec3'], flatten(pointcol));

    numPoints = Math.max(numPoints, ++index); 
    index %= max_verts;
  });

  document.getElementById("clear").addEventListener("click", onClickClear);
  
  document.getElementById("pointcol").addEventListener("change", onChangePointCol);

  render(buffer)
}

function render()
{
  gl.clear(gl.COLOR_BUFFER_BIT);
  if(numPoints > 0)
    gl.drawArrays(gl.POINTS, 0, numPoints);
  requestAnimationFrame(render);
}

function onClickClear() {
  var col = document.getElementById("clearcol").value;
  const r = parseInt(col.substr(1,2), 16);
  const g = parseInt(col.substr(3,2), 16);
  const b = parseInt(col.substr(5,2), 16);

  clearcol = [r/255, g/255, b/255, 1.0];
  gl.clearColor(clearcol[0],clearcol[1],clearcol[2],clearcol[3]);
  index = 0;
}

function onChangePointCol()
{
  var col = event.target.value;
  const r = parseInt(col.substr(1,2), 16);
  const g = parseInt(col.substr(3,2), 16);
  const b = parseInt(col.substr(5,2), 16);

  pointcol = [r/255, g/255, b/255, 1.0];
}