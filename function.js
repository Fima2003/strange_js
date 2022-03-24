// import {drawConnectors, drawLandmarks} from "@mediapipe/drawing_utils";

const videoElement = document.getElementsByClassName('input_video')[0];
var mainCanvas = document.getElementsByClassName('main_canvas')[0];
var mainCanvasCtx = mainCanvas.getContext('2d');
const indices = {"WRIST": 0,
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

mainCanvas.width  = window.innerWidth;
mainCanvas.height = window.innerHeight;

function resize() {
    var width;
    var height;
        height = window.innerHeight;
        width = window.innerWidth;

    mainCanvas.width = width;
    mainCanvas.height = height;
};

window.addEventListener('resize', resize, false);

function correctPosition(results) {
    let correct = {"Left": false, "Right": false};

    const handedness = results.multiHandedness;
    let mcp_check;
    for (const [hand_index, hand_info] of handedness.entries()) {
        let hand_label = hand_info.label;
        let hand_landmarks = results.multiHandWorldLandmarks[hand_index];
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
    mainCanvasCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

    if (results.multiHandLandmarks) {
        let correct = correctPosition(results);
        console.log(correct);
        for (const landmarks of results.multiHandLandmarks) {
            const real_values = [landmarks[indices.INDEX_FINGER_TIP].x*mainCanvas.width, landmarks[indices.INDEX_FINGER_TIP].y*mainCanvas.height]
            console.log((1-landmarks[indices.INDEX_FINGER_TIP].x) * mainCanvas.width);
            mainCanvasCtx.beginPath();
            mainCanvasCtx.arc(real_values[0], real_values[1], 50, 0, 2 * Math.PI);
            mainCanvasCtx.strokeStyle = "#e3e3e3";
            mainCanvasCtx.stroke();
            // drawLandmarks(mainCanvasCtx, [landmarks[indices.INDEX_FINGER_DIP]], {color: '#FF0000', lineWidth: 2});
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
