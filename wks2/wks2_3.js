var Vector = {
  add: function(a, b) {
    return a.map(function(val, i) { return val + b[i] });
  },
  subtract: function(a, b) {
    return a.map(function(val, i) { return val - b[i] });
  },
  length: function(a) {
    return Math.sqrt(a.reduce(function(sum, val) { return sum + Math.pow(val, 2) }, 0));
  }
}

var gl
var program

var helperpoints = 4;
var n_helperpoints = 0;

var clearcol = [0.3921, 0.5843, 0.9294, 1.0];
var pointcol = [0.0,    0.0,    0.0];

var max_points  = 2048;
var max_tris    = 2048;
var max_circles = 2048;

var n_points    = 0;
var n_tris      = 0;
var n_circles   = 0;

var verts_per_circle = 64;

var max_objs = max_points + max_circles + max_tris;
var z_lerp = -1.0 / max_objs;
var curz = 0;

var point_start = 0;
var circle_start = point_start + max_points;
var triangle_start = circle_start + verts_per_circle*max_circles;
var max_verts = (triangle_start + max_tris * 3) + helperpoints;

var tempshapepoints = [];

window.onload = function()
{
  var canv = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canv);

  gl.enable(gl.DEPTH_TEST);
  gl.viewport(0, 0, canv.width, canv.height);
  gl.clearColor(clearcol[0],clearcol[1],clearcol[2],clearcol[3]);

  program = initShaders(gl, "vertex-shader", "fragment-shader")
  gl.useProgram(program);

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec3'], gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  var colbuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec3'], gl.STATIC_DRAW);

  var vColor = gl.getAttribLocation(program, "vColor");
  gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  function add_helper(pos, col) {
    var index = max_verts - helperpoints + n_helperpoints;
    var helperpos = vec3(pos[0], pos[1], 0.0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec3'], flatten(helperpos));

    gl.bindBuffer(gl.ARRAY_BUFFER, colbuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec3'], flatten(col));
  
    n_helperpoints = (n_helperpoints + 1) % helperpoints;
  }

  function add_point(position) {
    var index = point_start + n_points;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec3'], flatten(position));

    gl.bindBuffer(gl.ARRAY_BUFFER, colbuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec3'], flatten(pointcol));
  
    n_points = (n_points + 1) % max_points;
    curz += z_lerp;
  }

  function add_circle(c, p)
  {
    var radius = Vector.length(Vector.subtract(p.pos, c.pos));
    var index = circle_start + verts_per_circle * n_circles;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec3'], flatten(c.pos));
    gl.bindBuffer(gl.ARRAY_BUFFER, colbuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec3'], flatten(c.col));

    index++;

    for (var i = 0; i < verts_per_circle - 1; i++) {
      var pos = [
        c.pos[0] + radius * Math.cos((2 * Math.PI * i) / (verts_per_circle - 2)),
        c.pos[1] + radius * Math.sin((2 * Math.PI * i) / (verts_per_circle - 2)),
        curz
      ];
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, (index+i)*sizeof['vec3'], flatten(pos));
      gl.bindBuffer(gl.ARRAY_BUFFER, colbuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, (index+i)*sizeof['vec3'], flatten(p.col));
    }

    n_circles = (n_circles + 1) % max_circles;
    curz += z_lerp;
  }

  function add_tri(inparam)
  {
    var index = triangle_start + (n_tris*3)
    var verts = [inparam[0].pos,inparam[1].pos,inparam[2].pos];
    var cols  = [inparam[0].col,inparam[1].col,inparam[2].col];

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec3'], flatten(verts));
    gl.bindBuffer(gl.ARRAY_BUFFER, colbuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec3'], flatten(cols));

    n_tris = (n_tris + 1) % max_tris;
    curz += z_lerp;
  }

  canv.addEventListener("click", function() {
    
    var rc = event.target.getBoundingClientRect();
    
    correctedx = event.clientX - rc.left;
    correctedy = event.clientY - rc.top;
    
    var t = vec3(-1 + 2*correctedx/canv.width, -1 + 2*(canv.height-correctedy)/canv.height, curz);
    
    var drawmode = document.getElementById("drawmode").value;
    if(drawmode == "Point")
    {
      add_point(t);
    }
    if(drawmode == "Circle")
    {
      tempshapepoints.push({pos: t, col: pointcol});
      add_helper(t, pointcol);
      if(tempshapepoints.length == 2)
      {
        add_circle(tempshapepoints[0],tempshapepoints[1]);
        tempshapepoints = [];
        n_helperpoints = 0;
      }
    }
    if(drawmode == "Triangle")
    {
      tempshapepoints.push({pos: t, col: pointcol});
      add_helper(t, pointcol);
      if(tempshapepoints.length == 3)
      {
        add_tri(tempshapepoints);
        tempshapepoints = [];
        n_helperpoints = 0;
      }
    }

  });

  document.getElementById("clear").addEventListener("click", onClickClear);
  
  document.getElementById("pointcol").addEventListener("change", onChangePointCol);

  render(buffer)
}

function render()
{
  gl.clear(gl.COLOR_BUFFER_BIT);
  if(n_points > 0)
    gl.drawArrays(gl.POINTS, point_start, n_points);
  if(n_tris > 0)
    gl.drawArrays(gl.TRIANGLES, triangle_start, n_tris*3);

  if(n_circles > 0){
    for (var i = 0; i < n_circles; i++) {
      gl.drawArrays(gl.TRIANGLE_FAN, circle_start + verts_per_circle*i, verts_per_circle);
    }
  }

  if(n_helperpoints > 0)
    gl.drawArrays(gl.POINTS, max_verts-helperpoints, n_helperpoints);

  requestAnimFrame(render);
}

function onClickClear() {
  var col = document.getElementById("clearcol").value;
  const r = parseInt(col.substr(1,2), 16);
  const g = parseInt(col.substr(3,2), 16);
  const b = parseInt(col.substr(5,2), 16);

  clearcol = [r/255, g/255, b/255, 1.0];
  gl.clearColor(clearcol[0],clearcol[1],clearcol[2],clearcol[3]);
  n_points = 0;
  n_tris = 0;
  n_circles = 0;
}

function onChangePointCol()
{
  var col = event.target.value;
  const r = parseInt(col.substr(1,2), 16);
  const g = parseInt(col.substr(3,2), 16);
  const b = parseInt(col.substr(5,2), 16);

  pointcol = [r/255, g/255, b/255];
}