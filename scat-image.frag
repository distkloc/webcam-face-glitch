#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vTexCoord;

// our texture coming from p5
uniform sampler2D uCamTex;

uniform vec2 uTexelSize;

struct ScatImageParams {
  vec2 pos;
  vec2 start;
  float rectWidth;
  float rectHeight;
};

uniform int uTriggerIndex;
const int ScatImageParamsArrayLength = 3;
uniform ScatImageParams uScatImageParamsArray[ScatImageParamsArrayLength];

void main (){
  vec2 uv = vTexCoord;
  // the texture is loaded upside down and backwards by default so lets flip it
  uv.y = 1.0 - uv.y;

  vec2 scatCoord = uv;

  for(int i = 0; i < ScatImageParamsArrayLength; i++){
    if(i > uTriggerIndex){
      break;
    }

    ScatImageParams params = uScatImageParamsArray[i];
    
    float scatXCondition = step(params.pos.x * uTexelSize.x, uv.x) 
      * step(uv.x, (params.pos.x + params.rectWidth) * uTexelSize.x);

    float scatYCondition = step(params.pos.y * uTexelSize.y, uv.y) 
      * step(uv.y, (params.pos.y + params.rectHeight) * uTexelSize.y);

    scatCoord = mix(scatCoord, uv + ((params.start - params.pos) * uTexelSize), scatXCondition * scatYCondition);
  }
  
  vec4 texel = texture2D(uCamTex, scatCoord);
  
  // render the output
  gl_FragColor = vec4(texel.rgb, 1.0);
}