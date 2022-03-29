const videoElement = document.getElementById('video');
var canvas = document.getElementById('canvas');
var canvasCtx = canvas.getContext('2d');
var background = document.getElementById('background');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  background.viewBox = `0 0 ${window.innerWidth} ${window.innerHeight}`;
};
window.addEventListener('resize', resize, false);
resize()

let xml = new XMLSerializer().serializeToString(document.getElementById('sling'));
let svg64 = btoa(xml);
let b64Start = 'data:image/svg+xml;base64,';
let image64 = b64Start + svg64;

document.getElementById('sling').src = image64;
document.getElementById('sling').onload = x=> {
  can.getContext('2d').drawImage(circImg, 0, 0); // draw
}

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


const SCORE_THRESHOLD=0.85;
var PATH = [];
const PATH_LIFETIME = 3000;
var over = false;


function getPolygonLength(){
  let length = 0;
  for (let i = 0; i < PATH.length; i++){
    let next = i+1;
    if (next === PATH.length){
      next = 0;
    }
    var o = {'x': PATH[i][0], 'y': PATH[i][1], 'z': 0};
    var n = {'x': PATH[next][0], 'y': PATH[next][1], 'z': 0};
    length+=distance(o, n);
  }
  return length;
}

function getPolygonArea(){
  console.log(PATH[0]);
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
  console.log("Area: " + area);
  const length = getPolygonLength();
  console.log("Length: " + length);
  const R = length/(2*Math.PI);
  console.log("Radius: " + R);
  const circle_area = Math.PI*R*R;
  console.log("Circle Area: " + circle_area);
  let score = area / circle_area;
  console.log("Score: "+ score);
  return score;
}

function keepRecentPartOfPath(){
  const now = new Date().getTime();
  while(PATH.length > 0 && now-PATH[0][2] > PATH_LIFETIME){
    PATH.shift();
  }
}

function correctPosition(results) {
  let correct = {"Left": false, "Right": false};

  const handedness = results.multiHandedness;
  let mcp_check;
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
    console.log(hand_landmarks);

    if (hand_label === "Left") {
      mcp_check = hand_landmarks[indices.INDEX_FINGER_MCP].x > hand_landmarks[indices.MIDDLE_FINGER_MCP].x;
      if (mcp_check && index_check && middle_check && Math.abs(dtip - ddip) < 0.01 && Math.abs(dtip - dpip) < 0.009 && Math.abs(dpip - ddip) < 0.009) {
        correct["Right"] = true;

        PATH.push([Math.abs(hand_landmarks[indices.INDEX_FINGER_TIP].x*canvas.width), Math.abs(hand_landmarks[indices.INDEX_FINGER_TIP].y*canvas.height), new Date().getTime()]);
      }
    }
    if (hand_label === "Right") {
      mcp_check = hand_landmarks[indices.INDEX_FINGER_MCP].x < hand_landmarks[indices.MIDDLE_FINGER_MCP].x;
      if (mcp_check && index_check && middle_check && Math.abs(dtip - ddip) < 0.03 && Math.abs(dtip - dpip) < 0.009 && Math.abs(dpip - ddip) < 0.009) {
        correct["Left"] = true;
      }
    }
  }

  return correct;
}

function distance(a, b){
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2))
}

function onResults(results) {
  if (!over) {
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks) {
      let correct = correctPosition(results);
      keepRecentPartOfPath();

      for (const landmarks of results.multiHandLandmarks) {
        var canvasRatio = canvas.height / canvas.width;
        var windowRatio = video.height / video.width;
        var width;
        var height;

        if (canvasRatio < canvasRatio) {
          height = canvas.height;
          width = height / canvasRatio;
        } else {
          width = canvas.width;
          height = width * canvasRatio;
        }

        canvasCtx.beginPath();
        const real_values = [landmarks[indices.INDEX_FINGER_TIP].x * width, landmarks[indices.INDEX_FINGER_TIP].y * height];
        canvasCtx.arc(real_values[0], real_values[1], 50, 0, 2 * Math.PI);
        canvasCtx.strokeStyle = "#e3e3e3";
        canvasCtx.stroke();
        canvasCtx.beginPath();
        if (PATH.length !== 0) {
          canvasCtx.fillStyle = '#f00';
          canvasCtx.beginPath();
          console.log(PATH[0][0], PATH[0][1]);
          canvasCtx.moveTo(PATH[0][0], PATH[0][1]);
          // canvasCtx.lineTo(10, 100);
          // canvasCtx.lineTo(102, 650);
          // canvasCtx.lineTo(10, 300);
          for (let i = 0; i < PATH.length; i++) {
            canvasCtx.lineTo(PATH[i][0], PATH[i][1]);
          }
          canvasCtx.closePath();
          canvasCtx.fill();
        }
        canvasCtx.strokeStyle = "#e3e3e3";
        canvasCtx.stroke();
      }
      let score = calculateRoundness();
      if(score > SCORE_THRESHOLD){
        over = true;
        console.log(over);
      }
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

