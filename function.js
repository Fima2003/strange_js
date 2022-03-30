const videoElement = document.getElementById('video');
var canvas = document.getElementById('canvas');
var canvasCtx = canvas.getContext('2d');
//var background = document.getElementById('container');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};

window.addEventListener('resize', resize, false);

document.addEventListener('onload', setBackground, false);
resize()

/*let xml = new XMLSerializer().serializeToString(document.getElementById('sling'));
let svg64 = btoa(xml);
let b64Start = 'data:image/svg+xml;base64,';
let image64 = b64Start + svg64;

document.getElementById('sling').src = image64;
document.getElementById('sling').onload = x=> {
  canvas.getContext('2d').drawImage(circImg, 0, 0);
}*/

const indices = {
  "WRIST": 0,
  "THUMB_CMC": 1,
  "THUMB_MCP": 2,
  "THUMB_IP": 3,
  "THUMB_TIP": 4,
  "INDEX_FINGER_MCP": 5,
  "INDEX_FINGER_PIP": 6,
  "INDEX_FINGER_DIP": 7,
  "INDEX_FINGER_TIP": 8,
  "MIDDLE_FINGER_MCP": 9,
  "MIDDLE_FINGER_PIP": 10,
  "MIDDLE_FINGER_DIP": 11,
  "MIDDLE_FINGER_TIP": 12,
  "RING_FINGER_MCP": 13,
  "RING_FINGER_PIP": 14,
  "RING_FINGER_DIP": 15,
  "RING_FINGER_TIP": 16,
  "PINKY_MCP": 17,
  "PINKY_PIP": 18,
  "PINKY_DIP": 19,
  "PINKY_TIP": 20
}

const SCORE_THRESHOLD=0.92;
var PATH = [];
const PATH_LIFETIME = 1000;

var over = false;
const RADIUS = (canvas.height < canvas.width) ? (canvas.height/2 - 20) : (canvas.width/2 - 20);
var score = NaN;
var correct = {};
var background = new Image();

function setBackground(){
  let number = Math.floor(Math.random()*20 + 1);
  let string = 'DB/' + number + '/' + number + '.jpg';
  console.log(string);
  background.src = string;
}

function drawImageScaled(img, ctx) {
  var canvas = ctx.canvas ;
  var hRatio = canvas.width  / img.width;
  var vRatio =  canvas.height / img.height;
  var ratio  = Math.min ( hRatio, vRatio);
  var centerShift_x = ( canvas.width - img.width*ratio ) / 2;
  var centerShift_y = ( canvas.height - img.height*ratio ) / 2;
  ctx.clearRect(0,0,canvas.width, canvas.height);
  ctx.drawImage(img, 0,0, img.width, img.height,
    centerShift_x,centerShift_y,img.width*ratio, img.height*ratio);
}

function getPolygonLength(){
  let length = 0;
  for (let i = 0; i < PATH.length; i++){
    let next = i+1;
    if (next === PATH.length){
      next = 0;
    }
    length+=distance({'x': PATH[i][0], 'y': PATH[i][1], 'z': 0}, {'x': PATH[next][0], 'y': PATH[next][1], 'z': 0});
  }
  return length;
}

function getPolygonArea(){
  let area = 0;
  for (let i = 0; i < PATH.length; i++){
    let next = i+1;
    if (next === PATH.length){
      next = 0;
    }
    area+=PATH[i][0]*PATH[next][1];
    area-=PATH[i][1]*PATH[next][0];
  }
  area = Math.abs(area)/2;
  return area;
}

function calculateRoundness(){
  const area = getPolygonArea();
  const length = getPolygonLength();
  const R = length/(2*Math.PI);
  const circle_area = Math.PI*R*R;
  return area / circle_area;
}

function keepRecentPartOfPath(){
  const now = new Date().getTime();
  while(PATH.length > 0 && now-PATH[0][2] > PATH_LIFETIME){
    PATH.shift();
  }
}

function dist(a, b){
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

function correctPosition(results) {
  let correct = {"Left": false, "Right": false};

  const handedness = results.multiHandedness;
  let mcp_check;
  let i = 0;
  let rightPoint;
  for (const [hand_index, hand_info] of handedness.entries()) {
    let hand_label = hand_info.label;
    let hand_landmarks = results.multiHandLandmarks[hand_index];
    let dtip = distance(hand_landmarks[indices.INDEX_FINGER_TIP],
      hand_landmarks[indices.MIDDLE_FINGER_TIP])
    let ddip = distance(hand_landmarks[indices.INDEX_FINGER_DIP],
      hand_landmarks[indices.MIDDLE_FINGER_DIP])
    let dpip = distance(hand_landmarks[indices.INDEX_FINGER_PIP],
      hand_landmarks[indices.MIDDLE_FINGER_PIP])

    let index_check = (hand_landmarks[indices.INDEX_FINGER_TIP].y < hand_landmarks[indices.INDEX_FINGER_DIP].y) &&
      (hand_landmarks[indices.INDEX_FINGER_DIP].y < hand_landmarks[indices.INDEX_FINGER_PIP].y) &&
      (hand_landmarks[indices.INDEX_FINGER_PIP].y < hand_landmarks[indices.INDEX_FINGER_MCP].y)

    let middle_check = (hand_landmarks[indices.MIDDLE_FINGER_TIP].y < hand_landmarks[indices.MIDDLE_FINGER_DIP].y) &&
      (hand_landmarks[indices.MIDDLE_FINGER_DIP].y < hand_landmarks[indices.MIDDLE_FINGER_PIP].y) &&
      (hand_landmarks[indices.MIDDLE_FINGER_PIP].y < hand_landmarks[indices.MIDDLE_FINGER_MCP].y)

    if (hand_label === "Left") {
      mcp_check = hand_landmarks[indices.INDEX_FINGER_MCP].x > hand_landmarks[indices.MIDDLE_FINGER_MCP].x;
      if (mcp_check && index_check && middle_check && Math.abs(dtip - ddip) < 0.01 && Math.abs(dtip - dpip) < 0.009 && Math.abs(dpip - ddip) < 0.009) {
        correct["Right"] = true;
        rightPoint = [Math.abs(hand_landmarks[indices.INDEX_FINGER_TIP].x*canvas.width), Math.abs(hand_landmarks[indices.INDEX_FINGER_TIP].y*canvas.height), new Date().getTime()];
      }
    }
    if (hand_label === "Right") {
      mcp_check = hand_landmarks[indices.INDEX_FINGER_MCP].x < hand_landmarks[indices.MIDDLE_FINGER_MCP].x;
      if (mcp_check && index_check && middle_check && Math.abs(dtip - ddip) < 0.03 && Math.abs(dtip - dpip) < 0.009 && Math.abs(dpip - ddip) < 0.009) {
        correct["Left"] = true;
      }
    }
    i+=1;
    if (i === 2 && correct["Right"] && correct["Left"]){
      if(PATH.length !== 0 && dist(PATH[PATH.length - 1], rightPoint) > 20) {
        PATH.push(rightPoint);
      }else if(PATH.length === 0){
        PATH.push(rightPoint);
      }
    }
  }

  return correct;
}

function distance(a, b){
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2))
}

function drawHandEffects(position, radius) {
  canvasCtx.beginPath();
  canvasCtx.arc(position[0], position[1], radius, 0, 2 * Math.PI);
  canvasCtx.strokeStyle = 'green';
  canvasCtx.stroke();
  canvasCtx.beginPath();
  if (PATH.length !== 0) {
    canvasCtx.beginPath();
    for (let i = 0; i < PATH.length; i++) {
      canvasCtx.lineTo(PATH[i][0], PATH[i][1]);
    }
    canvasCtx.closePath();
  }
  canvasCtx.stroke();
}

function drawCircle(){
  canvasCtx.beginPath();
  canvasCtx.fillStyle = 'red';
  canvasCtx.arc(canvas.width / 2, canvas.height / 2, RADIUS * score, 0, 2 * Math.PI);
  canvasCtx.fill();
}

function onResults(results) {
  if (!over) {
    if (!over) {
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      drawImageScaled(background, canvasCtx);
      // canvasCtx.drawImage(background, 0, 0, background.width, background.height);
      if (!isNaN(score)) {
        drawCircle();
        if (score > SCORE_THRESHOLD){
          over = true;
          console.log("Over:" + over);
        }
      }
      correct = {"Left": false, "Right": false};
      score = calculateRoundness();
    }
    if (results.multiHandLandmarks) {
      if(over){
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        canvasCtx.drawImage(background, 0, 0);
        drawCircle();
      }
      correct = correctPosition(results);
      keepRecentPartOfPath();
      for (const landmarks of results.multiHandLandmarks) {
        const real_values = [landmarks[indices.INDEX_FINGER_TIP].x * canvas.width, landmarks[indices.INDEX_FINGER_TIP].y * canvas.height];
        drawHandEffects(real_values, 50);
      }

    }
    score = calculateRoundness();
    if(score > SCORE_THRESHOLD){
      over = true;
      console.log(over);
    }
  }
}

const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 1280,
  height: 720
});

camera.start();
