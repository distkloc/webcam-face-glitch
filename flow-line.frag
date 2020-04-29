#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vTexCoord;

// our texture coming from p5
uniform sampler2D uCamTex;

uniform float uY;
uniform float uColorRand;
uniform vec2 uTexelSize;

void main (){
  vec2 uv = vTexCoord;

  // the texture is loaded upside down and backwards by default so lets flip it
  uv.y = 1.0 - uv.y;
  
  vec4 texel = texture2D(uCamTex, uv);
  
  vec3 flowTexel = texel.rgb + vec3(uColorRand/255.0);

  vec3 color = abs(uv.y - (uY*uTexelSize.y)) <= uTexelSize.y * 0.8 ? flowTexel : texel.rgb;

  // render the output
  gl_FragColor = vec4(color, 1.0);
}