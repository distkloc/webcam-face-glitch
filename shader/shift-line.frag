#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vTexCoord;

// our texture coming from p5
uniform sampler2D uCamTex;

uniform vec2 uTexelSize;

struct ShiftLineParams {
  float rangeMin;
  float rangeMax;
  float offsetX;
};

uniform int uTriggerCount;
const int ShiftLineParamsArrayLength = 6;
uniform ShiftLineParams uShiftLineParamsArray[ShiftLineParamsArrayLength];

void main (){
  vec2 uv = vTexCoord;

  // the texture is loaded upside down and backwards by default so lets flip it
  uv.y = 1.0 - uv.y;

  float shiftLineX = uv.x;

  for(int i = 0; i < ShiftLineParamsArrayLength; i++){
    if(i > uTriggerCount){
      break;
    }

    ShiftLineParams params = uShiftLineParamsArray[i];
    float shiftYCondition = step(params.rangeMin * uTexelSize.y, uv.y)
      * step(uv.y, params.rangeMax * uTexelSize.y);
    shiftLineX = mix(shiftLineX, uv.x + params.offsetX * uTexelSize.x, shiftYCondition);
  }
  
  vec4 texel = texture2D(uCamTex, vec2(shiftLineX, uv.y));
  
  // render the output
  gl_FragColor = vec4(texel.rgb, 1.0);
}