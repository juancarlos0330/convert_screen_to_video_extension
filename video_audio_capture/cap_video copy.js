var v_completeBlob = null;
var v_recorder = null;
var v_chunks = [];
var v_stream = null;

document
  .getElementById("video_startBtn")
  .addEventListener("click", () => startVideoRecord());
document
  .getElementById("video_stopBtn")
  .addEventListener("click", () => stopVideoScreen());

async function startVideoRecord() {
  try {
    v_stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        mediaSource: "screen",
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      },
    });
    document.getElementById("video_record_load").style.display = "block";
    v_recorder = new MediaRecorder(v_stream);
    v_recorder.ondataavailable = (e) => v_chunks.push(e.data);
    v_recorder.start();
    v_recorder.onstop = onvideostop;
    document.getElementById("video_startBtn").style.display = "none";
    document.getElementById("video_stopBtn").style.display = "unset";
  } catch (error) {
    window.alert(error);
  }
}

async function stopVideoScreen() {
  v_recorder.stop();
  document.getElementById("video_stopBtn").style.display = "none";
  document.getElementById("video_record_load").style.display = "none";
  v_stream.getTracks().forEach(function (track) {
    track.stop();
  });
}

function onvideostop() {
  alert("stop");
  v_completeBlob = new Blob(v_chunks, {
    type: v_chunks[0].type,
  });
  let downloadButton = document.getElementById("downloadbtn");
  let video = document.getElementById("videoResult");
  video.style.display = "block";
  video.src = URL.createObjectURL(v_completeBlob);
  downloadButton.style.display = "unset";
  downloadButton.href = URL.createObjectURL(v_completeBlob);
  downloadButton.download = Date.now() + ".mp4";
}
