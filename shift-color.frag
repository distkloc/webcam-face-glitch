#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vTexCoord;

// our texture coming from p5
uniform sampler2D uCamTex;

uniform vec2 uRandR;
uniform vec2 uRandG;
uniform vec2 uRandB;
uniform vec2 uTexelSize;


void main (){
  vec2 uv = vTexCoord;

  // the texture is loaded upside down and backwards by default so lets flip it
  uv.y = 1.0 - uv.y;
  
  vec4 texel = texture2D(uCamTex, uv);

  vec4 texelR = texture2D(uCamTex, mod(uv + (uRandR*uTexelSize), 1.0));
  vec4 texelG = texture2D(uCamTex, mod(uv + (uRandG*uTexelSize), 1.0));
  vec4 texelB = texture2D(uCamTex, mod(uv + (uRandB*uTexelSize), 1.0));

  // render the output
  gl_FragColor = vec4(texelR.r, texelG.g, texelB.b, 1.0);
}