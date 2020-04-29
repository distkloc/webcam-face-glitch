let faceApi;
let video;
let flowLineShader;
let flowLine;
let shiftLineShader;
let shiftLine;
let shiftColorShader;
let shiftColor;
let scatImageShader;
let scatImage;
let screen;
let canProcess = true;

const detectionOptions = {
  withLandmarks: true,
  withDescriptors: false,
};

function preload() {
  flowLineShader = loadShader("webcam.vert", "flow-line.frag");
  shiftLineShader = loadShader("webcam.vert", "shift-line.frag");
  shiftColorShader = loadShader("webcam.vert", "shift-color.frag");
  scatImageShader = loadShader("webcam.vert", "scat-image.frag");
}

// https://github.com/aferriss/p5jsShaderExamples/blob/gh-pages/4_image-effects/4-10_two-pass-blur/sketch.js

function setup() {
  createCanvas(windowWidth, (windowWidth * 720) / 1280.0);
  noStroke();
  pixelDensity(1);

  video = createCapture(VIDEO);
  faceApi = ml5.faceApi(video, detectionOptions, modelReady);

  video.size(width, height);
  video.hide();

  flowLine = new FlowLine(flowLineShader);
  shiftLine = new ShiftLine(shiftLineShader);
  shiftColor = new ShiftColor(shiftColorShader);
  scatImage = new ScatImage(scatImageShader);

  screen = createGraphics(width, height);
  screen.noStroke();
}

function modelReady() {
  faceApi.detect(gotResults);
}

function gotResults(err, result) {
  if (err) {
    console.log(err);
    return;
  }

  // sometimes pass without effect processing
  let n = floor(random(100));
  if (n > 75 && canProcess) {
    canProcess = false;
    setTimeout(() => {
      canProcess = true;
    }, floor(random(40, 400)));
  }

  if (!canProcess) {
    image(video, 0, 0, width, height);
    faceApi.detect(gotResults);
    return;
  }

  const detections = result;

  if (detections && detections.length > 0) {
    const box = detections[0].alignedRect._box;
    const capture = video.get(box._x, box._y, box._width, box._height);

    const resultPass = [flowLine, shiftLine, shiftColor].reduce(
      (pass, effect) => effect.draw(pass),
      capture
    );

    screen.image(video, 0, 0, width, height);
    screen.image(resultPass, box._x, box._y, box._width, box._height);

    const scatScreen = scatImage.draw(
      screen,
      box._x,
      box._y,
      box._width,
      box._height
    );
    image(scatScreen, 0, 0, width, height);
  }

  faceApi.detect(gotResults);
}

class FlowLine {
  constructor(shader) {
    this.shader = shader;
    this.pass = createGraphics(width, height, WEBGL);
    this.pass.noStroke();

    this.y = floor(random(0, 1000));
    this.speed = floor(random(24, 100));
    this.colorRand = floor(random(24, 80));
  }

  draw(capture) {
    this.pass.shader(this.shader);

    this.shader.setUniform(
      "uCamTex",
      capture
      // video
    );
    this.shader.setUniform("uTexelSize", [
      1.0 / capture.width,
      1.0 / capture.height,
    ]);

    this.y %= capture.height;
    this.y += this.speed;

    this.shader.setUniform("uY", this.y);
    this.shader.setUniform("uColorRand", this.colorRand);

    this.pass.rect(0, 0, capture.width, capture.height);

    return this.pass;
  }
}

class ShiftLine {
  constructor(shader) {
    this.shader = shader;
    this.pass = createGraphics(width, height, WEBGL);
    this.pass.noStroke();
    this.paramsCache = new Array(6);
  }

  draw(prePass) {
    this.pass.shader(this.shader);

    let triggerIndex = 0;
    for (let i = 0; i < 6; i++) {
      if (floor(random(100)) > 50) {
        const rangeMin = floor(random(0, prePass.height));
        const params = {
          rangeMin: rangeMin,
          rangeMax: rangeMin + floor(random(1, prePass.height - rangeMin)),
          offsetX: floor(random(-80, 80)),
        };
        this.paramsCache[i] = params;
        this.setParamsUniform(params, triggerIndex);
        triggerIndex++;
      } else {
        if (this.paramsCache[i]) {
          this.setParamsUniform(this.paramsCache[i], triggerIndex);
          triggerIndex++;
        }
      }
    }

    this.shader.setUniform("uTriggerCount", triggerIndex);

    this.shader.setUniform("uCamTex", prePass);

    this.shader.setUniform("uTexelSize", [
      1.0 / prePass.width,
      1.0 / prePass.height,
    ]);

    this.pass.rect(0, 0, prePass.width, prePass.height);
    return this.pass;
  }

  setParamsUniform(params, i) {
    this.shader.setUniform(
      `uShiftLineParamsArray[${i}].rangeMin`,
      params.rangeMin
    );
    this.shader.setUniform(
      `uShiftLineParamsArray[${i}].rangeMax`,
      params.rangeMax
    );
    this.shader.setUniform(
      `uShiftLineParamsArray[${i}].offsetX`,
      params.offsetX
    );
  }
}

class ShiftColor {
  constructor(shader) {
    this.shader = shader;
    this.pass = createGraphics(width, height, WEBGL);
    this.pass.noStroke();
    this.range = 16;
  }

  draw(prePass) {
    this.pass.shader(this.shader);

    this.shader.setUniform("uCamTex", prePass);

    this.shader.setUniform("uTexelSize", [
      1.0 / prePass.width,
      1.0 / prePass.height,
    ]);

    let randR;
    let randG;
    let randB;

    if (floor(random(100)) > 65) {
      randR = [
        floor(random(-this.range, this.range)),
        floor(random(-this.range, this.range)),
      ];

      randG = [
        floor(random(-this.range, this.range)),
        floor(random(-this.range, this.range)),
      ];

      randB = [
        floor(random(-this.range, this.range)),
        floor(random(-this.range, this.range)),
      ];
    } else {
      randR = [0, 0];
      randG = [0, 0];
      randB = [0, 0];
    }

    this.shader.setUniform("uRandR", randR);
    this.shader.setUniform("uRandG", randG);
    this.shader.setUniform("uRandB", randB);

    this.pass.rect(0, 0, prePass.width, prePass.height);
    return this.pass;
  }
}

class ScatImage {
  constructor(shader) {
    this.shader = shader;
    this.pass = createGraphics(width, height, WEBGL);
    this.pass.noStroke();
    this.paramsCache = new Array(3);
  }

  draw(prePass, faceX, faceY, faceWidth, faceHeight) {
    this.pass.shader(this.shader);

    this.shader.setUniform("uCamTex", prePass);

    this.shader.setUniform("uTexelSize", [
      1.0 / prePass.width,
      1.0 / prePass.height,
    ]);

    let triggerIndex = 0;
    for (let i = 0; i < 3; i++) {
      if (floor(random(100)) > 80) {
        const params = {};
        params.pos = [
          faceX + floor(random(-faceWidth * 0.3, faceWidth * 0.7)),
          faceY + floor(random(-faceHeight * 0.1, faceHeight)),
        ];

        const relativeStartX = floor(random(0, faceWidth - 30));

        params.start = [
          faceX + relativeStartX,
          faceY + floor(random(0, faceHeight - 50)),
        ];
        params.rectWidth = floor(random(60, faceWidth - relativeStartX));
        params.rectHeight = floor(random(1, 50));

        this.paramsCache[i] = params;
      }

      if (this.paramsCache[i]) {
        this.setParamsUniform(this.paramsCache[i], triggerIndex);
        triggerIndex++;
      }
    }

    this.shader.setUniform("uTriggerIndex", triggerIndex);

    this.pass.rect(0, 0, prePass.width, prePass.height);
    return this.pass;
  }

  setParamsUniform(params, i) {
    this.shader.setUniform(`uScatImageParamsArray[${i}].pos`, params.pos);

    this.shader.setUniform(`uScatImageParamsArray[${i}].start`, params.start);

    this.shader.setUniform(
      `uScatImageParamsArray[${i}].rectWidth`,
      params.rectWidth
    );
    this.shader.setUniform(
      `uScatImageParamsArray[${i}].rectHeight`,
      params.rectHeight
    );
  }
}
