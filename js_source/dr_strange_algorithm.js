const videoElement = document.getElementsByClassName("input_video")[0];

const canvasElement = document.getElementsByClassName("output_canvas")[0];
const canvasCtx = canvasElement.getContext("2d");

const secondaryCanvas = document.getElementsByClassName("secondary_canvas")[0];
const secondaryCanvasCtx = secondaryCanvas.getContext("2d");

const mainCanvas = document.getElementsByClassName("main_canvas")[0];
const mainCanvasCtx = mainCanvas.getContext("2d");

const scoreElement = document.getElementById("score");
const locationElement = document.getElementById("location");
const data = {
  1: "Kharkiv",
  2: "The Petro Sahaidachny Monument in Kyiv",
  3: "Kharkiv",
  4: "Kyiv",
  5: "Kharkiv",
  6: "Lviv",
  7: "Kharkiv",
  8: "Bakhmut",
  9: "Mariupol"
};
let data_point;
const indices = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_FINGER_MCP: 5,
  INDEX_FINGER_PIP: 6,
  INDEX_FINGER_DIP: 7,
  INDEX_FINGER_TIP: 8,
  MIDDLE_FINGER_MCP: 9,
  MIDDLE_FINGER_PIP: 10,
  MIDDLE_FINGER_DIP: 11,
  MIDDLE_FINGER_TIP: 12,
  RING_FINGER_MCP: 13,
  RING_FINGER_PIP: 14,
  RING_FINGER_DIP: 15,
  RING_FINGER_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
};

let window_height = window.innerHeight;
let window_width = window.innerWidth;

mainCanvas.width = window_width;
mainCanvas.height = window_height;

secondaryCanvas.width = window_width;
secondaryCanvas.height = window_height;

const SCORE_THRESHOLD = 0.92;
let PATH = [];
const PATH_LIFETIME = 1000;
let over = false;
const RADIUS =
  window_height < window_width ? window_height / 2 - 20 : window_width / 2 - 20;
var score = NaN;
var correct = {};
var background = new Image();
var secondaryBackground = new Image();

function setBackground() {
  let number = Math.floor(Math.random() * 9 + 1);
  data_point = number;
  let string = "/DB/" + number + "/before.jpg";
  let secondaryString = "/DB/" + number + "/after.jpg";
  background.src = string;
  secondaryBackground.src = secondaryString;
  locationElement.innerHTML = `This <span class='was'>was</span> ${data[number]}`;
}

function drawImageScaled(img, ctx) {
  var canvas = ctx.canvas;
  var hRatio = canvas.width / img.width;
  var vRatio = canvas.height / img.height;
  var ratio = Math.min(hRatio, vRatio);
  var centerShift_x = (canvas.width - img.width * ratio) / 2;
  var centerShift_y = (canvas.height - img.height * ratio) / 2;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    img,
    0,
    0,
    img.width,
    img.height,
    centerShift_x,
    centerShift_y,
    img.width * ratio,
    img.height * ratio
  );
}

function getPolygonLength() {
  let length = 0;
  for (let i = 0; i < PATH.length; i++) {
    let next = i + 1;
    if (next === PATH.length) {
      next = 0;
    }
    length += dist(PATH[i], PATH[next]);
  }
  return length;
}

function getPolygonArea() {
  let area = 0;
  for (let i = 0; i < PATH.length; i++) {
    let next = i + 1;
    if (next === PATH.length) {
      next = 0;
    }
    area += PATH[i][0] * PATH[next][1];
    area -= PATH[i][1] * PATH[next][0];
  }
  area = Math.abs(area) / 2;
  return area;
}

function calculateRoundness() {
  const area = getPolygonArea();
  const length = getPolygonLength();
  const R = length / (2 * Math.PI);
  const circle_area = Math.PI * R * R;
  return area / circle_area;
}

function keepRecentPartOfPath() {
  const now = new Date().getTime();
  while (PATH.length > 0 && now - PATH[0][2] > PATH_LIFETIME) {
    PATH.shift();
  }
}

function dist(a, b) {
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

function correctPosition(results) {
  let correct = { Left: false, Right: false };

  const handedness = results.multiHandedness;
  let mcp_check;
  let i = 0;
  let rightPoint;
  for (const [hand_index, hand_info] of handedness.entries()) {
    let hand_label = hand_info.label;
    let hand_landmarks = results.multiHandLandmarks[hand_index];
    let dtip = distance_3d(
      hand_landmarks[indices.INDEX_FINGER_TIP],
      hand_landmarks[indices.MIDDLE_FINGER_TIP]
    );
    let ddip = distance_3d(
      hand_landmarks[indices.INDEX_FINGER_DIP],
      hand_landmarks[indices.MIDDLE_FINGER_DIP]
    );
    let dpip = distance_3d(
      hand_landmarks[indices.INDEX_FINGER_PIP],
      hand_landmarks[indices.MIDDLE_FINGER_PIP]
    );

    let index_check =
      hand_landmarks[indices.INDEX_FINGER_TIP].y <
        hand_landmarks[indices.INDEX_FINGER_DIP].y &&
      hand_landmarks[indices.INDEX_FINGER_DIP].y <
        hand_landmarks[indices.INDEX_FINGER_PIP].y &&
      hand_landmarks[indices.INDEX_FINGER_PIP].y <
        hand_landmarks[indices.INDEX_FINGER_MCP].y;

    let middle_check =
      hand_landmarks[indices.MIDDLE_FINGER_TIP].y <
        hand_landmarks[indices.MIDDLE_FINGER_DIP].y &&
      hand_landmarks[indices.MIDDLE_FINGER_DIP].y <
        hand_landmarks[indices.MIDDLE_FINGER_PIP].y &&
      hand_landmarks[indices.MIDDLE_FINGER_PIP].y <
        hand_landmarks[indices.MIDDLE_FINGER_MCP].y;

    if (hand_label === "Left") {
      mcp_check =
        hand_landmarks[indices.INDEX_FINGER_MCP].x >
        hand_landmarks[indices.MIDDLE_FINGER_MCP].x;
      if (
        mcp_check &&
        index_check &&
        middle_check &&
        Math.abs(dtip - ddip) < 0.01 &&
        Math.abs(dtip - dpip) < 0.009 &&
        Math.abs(dpip - ddip) < 0.009
      ) {
        correct["Right"] = true;
        rightPoint = [
          Math.abs(hand_landmarks[indices.INDEX_FINGER_TIP].x * window_width),
          Math.abs(hand_landmarks[indices.INDEX_FINGER_TIP].y * window_height),
          new Date().getTime(),
        ];
      }
    }
    if (hand_label === "Right") {
      mcp_check =
        hand_landmarks[indices.INDEX_FINGER_MCP].x <
        hand_landmarks[indices.MIDDLE_FINGER_MCP].x;
      if (
        mcp_check &&
        index_check &&
        middle_check &&
        Math.abs(dtip - ddip) < 0.03 &&
        Math.abs(dtip - dpip) < 0.009 &&
        Math.abs(dpip - ddip) < 0.009
      ) {
        correct["Left"] = true;
      }
    }
    i += 1;
    if (i === 2 && correct["Right"] && correct["Left"]) {
      if (PATH.length !== 0 && dist(PATH[PATH.length - 1], rightPoint) > 20) {
        PATH.push(rightPoint);
      } else if (PATH.length === 0) {
        PATH.push(rightPoint);
      }
    }
  }

  return correct;
}

function distance_3d(a, b) {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2)
  );
}

function drawHandEffects(position, radius) {
  mainCanvasCtx.beginPath();
  mainCanvasCtx.arc(position[0], position[1], radius, 0, 2 * Math.PI);
  mainCanvasCtx.lineWidth = 3;
  mainCanvasCtx.strokeStyle = "#3D348B";
  mainCanvasCtx.fillStyle = "#3D348B";
  mainCanvasCtx.fill();
  mainCanvasCtx.stroke();
  mainCanvasCtx.beginPath();
  if (PATH.length !== 0) {
    mainCanvasCtx.beginPath();
    for (let i = 0; i < PATH.length; i++) {
      mainCanvasCtx.lineTo(PATH[i][0], PATH[i][1]);
    }
    mainCanvasCtx.lineWidth = 2;
    mainCanvasCtx.strokeStyle = "yellow";
    mainCanvasCtx.closePath();
  }
  mainCanvasCtx.stroke();
}

function drawCircle(extraRadius = 0) {
  const outerRadius = RADIUS * score + extraRadius;
  // Make a hole inside
  mainCanvasCtx.globalCompositeOperation = "destination-out";
  mainCanvasCtx.beginPath();
  mainCanvasCtx.arc(
    window_width / 2,
    window_height / 2,
    outerRadius,
    0,
    2 * Math.PI
  );
  mainCanvasCtx.fill();
  mainCanvasCtx.globalCompositeOperation = "source-over";
  // Add gradient so it looks more like a portal
  innerRadius = 0;
  if (RADIUS * score + extraRadius > 30) {
    innerRadius = RADIUS * score + extraRadius - 30;
  }
  const gradient = mainCanvasCtx.createRadialGradient(window_width/2, window_height/2, innerRadius, window_width/2, window_height/2, outerRadius);
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.5)"); // Black with opacity 0.5 at the outer radius
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  mainCanvasCtx.fillStyle = gradient;
  mainCanvasCtx.beginPath();
  mainCanvasCtx.arc(window_width/2, window_height/2, outerRadius, 0, Math.PI * 2);
  mainCanvasCtx.fill();
}

function expandCircle() {
  const animationDuration = 1000; // 3 seconds
  const fps = 60; // Frames per second
  const totalFrames = (animationDuration / 1000) * fps;
  const radiusIncrement = (RADIUS*2) / totalFrames;

  let currentFrame = 0;
  let radius = 0;

  function drawFrame() {
    if (currentFrame < totalFrames) {
      // mainCanvasCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
      // drawImageScaled(background, mainCanvasCtx);
      // Draw the erasing circle
      drawCircle(radius);

      // Increase the radius for the next frame
      radius += radiusIncrement;
      currentFrame++;

      // Request the next frame
      requestAnimationFrame(drawFrame);
    } else {
      // Animation complete, hide the main canvas and show the secondary canvas
      mainCanvas.style.display = "none";
      secondaryCanvas.style.display = "block";
    }
  }

  requestAnimationFrame(drawFrame);
}

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );
  let string;
  if (isNaN(score)) {
    string = "0";
  } else if (over) {
    string = "100";
  } else {
    string = Math.floor(score * 100);
  }
  scoreElement.innerText = `${string}% of the portal`;

  if (!over) {
    mainCanvasCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    drawImageScaled(background, mainCanvasCtx);
    drawImageScaled(secondaryBackground, secondaryCanvasCtx);
    if (!isNaN(score)) {
      drawCircle();
      if (score > SCORE_THRESHOLD) {
        over = true;
      }
    }
    correct = { Left: false, Right: false };
    score = calculateRoundness();
  }
  if (results.multiHandLandmarks) {
    if (over) {
      camera.stop();
      canvasElement.style.opacity = "0";
      locationElement.innerHTML = `This <span class='is'>is</span> ${data[data_point]}`;
      document.getElementsByClassName('tooltip')[0].style.display = 'none';
      expandCircle();
    }
    correct = correctPosition(results);
    keepRecentPartOfPath();
    for (const landmarks of results.multiHandLandmarks) {
      const real_values = [
        landmarks[indices.INDEX_FINGER_TIP].x * window_width,
        landmarks[indices.INDEX_FINGER_TIP].y * window_height,
      ];
      drawHandEffects(real_values, 20);
    }
  }

  canvasCtx.restore();
}

const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  },
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: window_width,
  height: window_height,
});

background.onload = () => {
  document.getElementsByClassName('loader')[0].style.display = 'none';
  camera.start();
};
