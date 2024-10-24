var last_mousex = (last_mousey = 0);
var mousex = (mousey = 0);
var mousedown = false;
var rect = {};
var cv1 = document.getElementById("cv1");
var ctx = cv1.getContext("2d");
let myInterval;
var cStream,
  recorder,
  chunks = [];

document
  .getElementById("video_startBtn")
  .addEventListener("click", () => startCapture());
document
  .getElementById("video_stopBtn")
  .addEventListener("click", () => stopVideoScreen());
// document
//   .getElementById("record_startBtn")
//   .addEventListener("click", () => recordVideo());

record_startBtn.onclick = recordVideo;

var videoonplay = document.getElementById("videoElement");
videoonplay.onplay = function (e) {
  resize_canvas(e.target);
};

cv1.addEventListener(
  "mouseup",
  function (e) {
    mousedown = false;
  },
  false
);

cv1.addEventListener(
  "mousedown",
  function (e) {
    last_mousex = parseInt(e.clientX - cv1.offsetLeft);
    last_mousey = parseInt(e.clientY - cv1.offsetTop);
    mousedown = true;
  },
  false
);

cv1.addEventListener(
  "mousemove",
  function (e) {
    mousex = parseInt(e.clientX - cv1.offsetLeft);
    mousey = parseInt(e.clientY - cv1.offsetTop);
    if (mousedown) {
      ctx.clearRect(0, 0, cv1.width, cv1.height); //clear canvas
      ctx.beginPath();
      var width = mousex - last_mousex;
      var height = mousey - last_mousey;
      ctx.rect(last_mousex, last_mousey, width, height);
      rect = { x: last_mousex, y: last_mousey, width, height };
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  },
  false
);
let cv2 = document.createElement("canvas");
async function VideoToCroppedImage({ width, height, x, y }) {
  const aspectRatioY = videoElement.videoHeight / cv1.height;
  const aspectRatioX = videoElement.videoWidth / cv1.width;
  // const cv2 = document.createElement("canvas");
  cv2.width = width * aspectRatioX;
  cv2.height = height * aspectRatioY;
  const ctx2 = cv2.getContext("2d");
  ctx2.drawImage(
    videoElement,
    x * aspectRatioX,
    y * aspectRatioY,
    width * aspectRatioX,
    height * aspectRatioY,
    0,
    0,
    cv2.width,
    cv2.height
  );

  const dataURI = cv2.toDataURL("image/jpeg", 1.0);
  croppedImg.src = dataURI;
}

async function saveRecordVideo({ width, height, x, y }) {
  const aspectRatioY = videoElement.videoHeight / cv1.height;
  const aspectRatioX = videoElement.videoWidth / cv1.width;
  // const cv2 = document.createElement("canvas");
  cv2.width = width * aspectRatioX;
  cv2.height = height * aspectRatioY;
  var ctx2 = cv2.getContext("2d");
  ctx2.drawImage(
    videoElement,
    x * aspectRatioX,
    y * aspectRatioY,
    width * aspectRatioX,
    height * aspectRatioY,
    0,
    0,
    cv2.width,
    cv2.height
  );

  var cStream = cv2.captureStream(60);

  var coptions = {
    audio: true,
    audioBitsPerSecond: 64000,
  };

  var audioContext = new (window.AudioContext || window.webkitAudioContext)();
  var oscillator = audioContext.createOscillator();
  // oscillator.type = "sine";
  oscillator.frequency.value = 0;
  var streamAudioDestination = audioContext.createMediaStreamDestination();
  oscillator.connect(streamAudioDestination);
  oscillator.start(0);
  var audioStream = streamAudioDestination.stream;
  var audioTracks = audioStream.getAudioTracks();
  var firstAudioTrack = audioTracks[0];
  // cStream.addTrack(firstAudioTrack);
  var newStream = new MediaStream([
    cStream.getVideoTracks()[0],
    firstAudioTrack,
  ]);
  recorder = new MediaRecorder(newStream);
  recorder.start();
  recorder.ondataavailable = saveChunks;
  recorder.onstop = exportStream;
}

async function saveChunks(e) {
  chunks.push(e.data);
}

async function stopRecording() {
  recorder.stop();
}

async function exportStream(e) {
  var ddate = new Date();
  var blob = new Blob(chunks);
  var vidURL = URL.createObjectURL(blob);
  var vid = document.createElement("video");
  var type = "video/mp4";
  var dom = await document.createElement("video");
  var link = await document.createElement("a");
  link.setAttribute("download", "a");
  var filename =
    ddate.getFullYear() +
    "-" +
    Number(ddate.getMonth() + 1) +
    "-" +
    ddate.getDate() +
    "_" +
    ddate.getHours() +
    "-" +
    ddate.getMinutes() +
    "-" +
    ddate.getSeconds();
  await setTimeout(() => {
    generatorBlobURL(vidURL, type, dom, link, filename);
  }, 0);
  vid.controls = true;
  vid.src = vidURL;
  vid.style.width = "500px";
  vid.onended = function () {
    URL.revokeObjectURL(vidURL);
  };
  var helloresult = document.getElementById("helloresult");
  helloresult.appendChild(vid);
}

function generatorBlobURL(url, type, dom, link, filename) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url);
  xhr.responseType = "arraybuffer";
  xhr.onload = function (res) {
    var blob = new Blob([xhr.response], { type: type });
    var urlBlob = URL.createObjectURL(blob);
    dom.src = urlBlob;
    link.href = urlBlob;
    link.innerText = urlBlob;
    link.download = filename;
    link.click();
  };
  xhr.send();
  // link.click();
}

function resize_canvas(element) {
  cv1.width = element.offsetWidth;
  cv1.height = element.offsetHeight;
  document.getElementById("result_div").style.paddingTop =
    Number(element.offsetHeight + 15) + "px";
}

async function recordVideo() {
  myInterval = setInterval(VideoToCroppedImage, 50, rect);
  saveRecordVideo(rect);
  document.getElementById("record_startBtn").style.display = await "none";
  document.getElementById("video_record_load").style.display = await "flex";
  document.getElementById("video_stopBtn").style.display = await "block";
}

async function stopVideoScreen() {
  await clearInterval(myInterval);
  document.getElementById("record_startBtn").style.display = await "block";
  document.getElementById("video_record_load").style.display = await "none";
  document.getElementById("video_stopBtn").style.display = await "none";
  stopRecording();
}

async function startCapture() {
  try {
    videoElement.srcObject = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: "always" },
      audio: true,
    });
    document.getElementById("video_startBtn").style.display = await "none";
    document.getElementById("record_startBtn").style.display = await "block";
  } catch (err) {
    console.error("Error" + err);
  }
}
