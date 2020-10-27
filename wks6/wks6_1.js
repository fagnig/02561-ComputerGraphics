var gl
var program
    
var numPoints = [ 
                  vec3(-4.0, -1.0, -1.0 ), 
                  vec3( 4.0, -1.0, -1.0 ),
                  vec3( 4.0, -1.0, -21.0),

                  vec3(-4.0, -1.0, -1.0), 
                  vec3( 4.0, -1.0, -21.0),
                  vec3(-4.0, -1.0, -21.0),
                ]

var texCoords = [
                vec2(-1.5, 0.0 ), 
                vec2( 2.5, 0.0 ), 
                vec2( 2.5, 10.0),
                vec2(-1.5, 0.0 ),
                vec2( 2.5, 10.0),
                vec2(-1.5, 10.0),
]

var radius = 5;
var theta  = radians(0.0);
var phi    = radians(0.0);
var znear  = -8.0
var zfar   = 1.0
var fov    = 90.0

var at  = vec3(0.5, 0.5, 0.5);
var up  = vec3(0.0, 1.0, 0.0);

function getCheckerboard()
{
  var arr = new Uint8Array(4*64*64);

  for( var i = 0; i < 64; ++i)
  {
    for( var j = 0; j < 64; ++j)
    {
      var x = Math.floor(i/(64/8));
      var y = Math.floor(j/(64/8));
      var c = (x%2 !== y%2 ? 255 : 0)
      var idx = 4*(i*64 + j)
      arr[idx] = arr[idx+1] = arr[idx+2] = c;
      arr[idx+3] = 255;
    }
  }
  return arr;
}

window.onload = function()
{
  var canv = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canv);

  gl.viewport(0, 0, canv.width, canv.height);
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.BLEND);
  gl.blendEquation(gl.FUNC_ADD);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  program = initShaders(gl, "vertex-shader", "fragment-shader")
  gl.useProgram(program);

  var texbuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

  var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
  gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vTexCoord);

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(numPoints), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  var aratio = canv.width / canv.height;
  var projMat = perspective(fov, aratio, znear, zfar);
  
  var projloc = gl.getUniformLocation(program, "proj");
  gl.uniformMatrix4fv(projloc, false, flatten(projMat) );

  var uTex = gl.getUniformLocation(program, "texmap");
  gl.uniform1i(uTex, 0);

  var img = getCheckerboard();

  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 64, 64, 0, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

  render(buffer)
}

function render()
{
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, numPoints.length);

  requestAnimationFrame(render);
}