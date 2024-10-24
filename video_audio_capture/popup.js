var username = null;
var password = null;

var colorChosen = false;
var currentSelection = "";
const rgb2hex = (rgb) =>
  `#${rgb
    .match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
    .slice(1)
    .map((n) => parseInt(n, 10).toString(16).padStart(2, "0"))
    .join("")}`;
var quality = 90;
var selections;
const API_URL = "http://92.240.237.148/api";
var finalScreenshot = null;

// record
var recorder;
var saveRecording = false;
var audioData = [];
var duration = 0;
var recordings = [];
var durations = [];
// https://www.ta3.com/clanok/241096/potrebujeme-posilnit-timy-na-chirurgii-a-traumatologii-hovori-sefka-spisskonovoveskej-nemocnice
// document.getElementById("changeColor").onclick = Foo;
document
  .getElementById("btnAdd")
  .addEventListener("click", () => AddSelection(null, null, null, null));
document.getElementById("btnCapture").addEventListener("click", Capture);
document.getElementById("btnConnect").addEventListener("click", Connect);
document.getElementById("btnLogin").addEventListener("click", Login);
document.getElementById("btnLogout").addEventListener("click", Logout);
document
  .getElementById("btnConnections")
  .addEventListener("click", SeeSelections);
document.getElementById("btnBack").addEventListener("click", Back);
document
  .getElementById("btnHomepage")
  .addEventListener("click", () => Website());
document
  .getElementById("btnSaveArticle")
  .addEventListener("click", SaveArticle);
document.getElementById("btnCancel").addEventListener("click", Cancel);
document.getElementById("title").addEventListener("input", UpdateTitle);
document
  .getElementById("description")
  .addEventListener("input", UpdateDescription);
document.getElementById("date").addEventListener("change", UpdateDate);
document.getElementById("color").addEventListener("change", SaveColor);
document.getElementById("btnRecord").addEventListener("click", Record);
document.getElementById("btnPause").addEventListener("click", Pause);
document.getElementById("btnStop").addEventListener("click", Stop);
document
  .getElementById("slcRecordings")
  .addEventListener("change", SelectAudio);
document
  .getElementById("txtAudioDescription")
  .addEventListener("input", AudioDescription);
// document.getElementById("btnMark").addEventListener("click", Mark);
document
  .getElementById("btnUploadAudio")
  .addEventListener("click", UploadAudio);
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(OnLoad, 0);
});
document
  .getElementById("tabVideo")
  .addEventListener("click", () => SelectTab("video"));
document
  .getElementById("tabAudio")
  .addEventListener("click", () => SelectTab("audio"));
document
  .getElementById("tabText")
  .addEventListener("click", () => SelectTab("text"));

async function OnLoad() {
  $("#login").hide();
  // tabs
  var selectedTab = await SessionData.get("tab");
  if (selectedTab && selectedTab === "text") SelectTab("text");
  else if (selectedTab && selectedTab === "audio") SelectTab("audio");
  else SelectTab("video");

  // recordings
  var savedRecordings = await SessionData.get("recordings");
  if (savedRecordings && savedRecordings.length > 0) {
    var description = await SessionData.get("recordingDescription");
    durations = await SessionData.get("durations");

    if (description) $("#txtAudioDescription").val(description);
    for (var [index, recording] of savedRecordings.entries()) {
      // var blob = await (await fetch(recording)).blob();
      recordings.push(recording);
      var audio = $(
        `<option>Audio ${index + 1}&nbsp;&nbsp;(${
          durations[index]
        } seconds)</option>`
      );
      $("#slcRecordings").append(audio);
      $("#btnUploadAudio").removeClass("disabled");
    }
  }

  var unsavedRecording = await SessionData.get("recording");
  if (unsavedRecording) {
    console.log("unsavedRecording");
    var index = recordings.length + 1;
    var audio = $(
      `<option>Audio ${index}&nbsp;&nbsp;(${
        durations[index - 1]
      } seconds)</option>`
    );
    $("#slcRecordings").append(audio);
    $("#btnUploadAudio").removeClass("disabled");
    recordings.push(unsavedRecording);
    await SessionData.set("recordings", recordings);
  }
  await SessionData.set("recording", false);

  var credentials = await GetStorage("credentials");
  if (credentials) {
    username = credentials.username;
    password = credentials.password;
    Login();
  } else {
    await SessionData.clear();
  }

  var meta = await GetMeta();

  $("#title").val(meta.title);
  var date = await SessionData.get("date");
  var title = await SessionData.get("title");
  var description = await SessionData.get("description");
  var color = await SessionData.get("color");
  var saved = await SessionData.get("saved");
  var dateTimeNow = new Date().toISOString().slice(0, 16);

  if (date) $("#date").val(date);
  else $("#date").val(dateTimeNow);
  if (title) $("#title").val(title);
  if (description) $("#description").val(description);
  if (color) $("#color").val(color);
  if (saved) {
    $("#btnSaveArticle").text("✔️ Saved");
    $("#btnSaveArticle").addClass("disabled");
  }

  $(".color")
    .unbind()
    .click(function () {
      SelectColor(this);
    });
  $("#percent").on("mousedown", function (e) {
    e = e || window.event;
    e.preventDefault();
    $("#percent").select();
  });
  $("#percent").on("input", CheckSelectionActive);

  if (await HasActiveSelection()) {
    $(".color").removeClass("disabled");
    $("#percent").prop("disabled", false);
  }

  var selections = await SessionData.get("selections");

  if (selections)
    for (var selection of selections)
      AddSelection(
        selection.text,
        selection.color,
        selection.percentage,
        selection.id
      );

  var id = await SessionData.get("id");
  if (!id) await SessionData.set("id", 0);

  // var loggedIn = await SessionData.get("loggedIn");
  // if (loggedIn)
  // 	$("#login").hide();

  var [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const { hostname } = new URL(tab.url);
  UrlSettings.initialize();
  if (UrlSettings.exists(hostname)) {
    // $("#static-capture").prop('checked', true);
  }
}

async function Login() {
  if (!username || !password) {
    username = $("#txtUser").val();
    password = $("#txtPassword").val();
  }

  await SessionData.set("username", username);
  await SessionData.set("password", password);
  var credentials = {};
  credentials.username = username;
  credentials.password = password;
  await SetStorage("credentials", credentials);

  $("#lbl-username").text(`👤 ${username}`);
  $("#login").hide();
  //   $.ajax({
  //     url: `${API_URL}/extension-login`,
  //     type: "GET",
  //     dataType: "json",
  //     beforeSend: function (xhr) {
  //       xhr.setRequestHeader(
  //         "Authorization",
  //         "Basic " + btoa(username + ":" + password)
  //       );
  //     },
  //     success: async function (data) {
  //       if (data === true) {
  //         //clear first
  //         //await ClearStorage("credentials");
  //         //await SessionData.clear();

  //         await SessionData.set("username", username);
  //         await SessionData.set("password", password);
  //         var credentials = {};
  //         credentials.username = username;
  //         credentials.password = password;
  //         await SetStorage("credentials", credentials);

  //         $("#lbl-username").text(`👤 ${username}`);
  //         $("#login").hide();
  //       }
  //     },
  //     error: async function (data) {
  //       alert("Wrong user and/or password");
  //     },
  //   });
}
async function Logout() {
  await ClearStorage("credentials");
  await SessionData.clear();
  $("#login").show();
}

// main panels
function ArticlePanel() {
  $("#articlePanel").show();
  $("#home").hide();
}

function AudioPanel() {
  $("#audioPanel").show();
  $("#home").hide();
}

// tabs
async function SelectTab(tab) {
  if (tab === "audio") {
    $("#tabVideoSel").css("background-color", "#333");
    $("#tabAudioSel").css("background-color", "#ffc90e");
    $("#tabTextSel").css("background-color", "#333");
    $("#tabAudio").css("color", "black");
    $("#tabText").css("color", "white");
    $("#tabVideo").css("color", "white");
    $("#audioPanel").show();
    $("#articlePanel").hide();
    $("#videoPanel").hide();
    $("#videoPanel").css("width", "230px");
    $("#body").css("width", "228px");
  } else if (tab === "text") {
    $("#tabVideoSel").css("background-color", "#333");
    $("#tabAudioSel").css("background-color", "#333");
    $("#tabTextSel").css("background-color", "#ffc90e");
    $("#tabText").css("color", "black");
    $("#tabAudio").css("color", "white");
    $("#tabVideo").css("color", "white");
    $("#articlePanel").show();
    $("#audioPanel").hide();
    $("#videoPanel").hide();
    $("#videoPanel").css("width", "230px");
    $("#body").css("width", "228px");
  } else if (tab === "video") {
    $("#tabVideoSel").css("background-color", "#ffc90e");
    $("#tabAudioSel").css("background-color", "#333");
    $("#tabTextSel").css("background-color", "#333");
    $("#tabText").css("color", "white");
    $("#tabVideo").css("color", "black");
    $("#tabAudio").css("color", "white");
    $("#articlePanel").hide();
    $("#audioPanel").hide();
    $("#videoPanel").show();
    $("#videoPanel").css("width", "100%");
    $("#body").css("width", "650px");
  }
  await SessionData.set("tab", tab);
  $("#bgPanel").hide();
}

// record
var recordTimer;
var recordTime = 0;
const MIN_BLOB_SIZE = 5000000;
var partSize = 0;
var parts = [];
async function Record() {
  $("#btnRecordCancel").show();
  $("#btnRecord").addClass("disabled");
  $("#btnStop, #btnPause, #btnMark").removeClass("disabled");
  $("#record-animation2").addClass("play");
  await SessionData.set("recording", []);

  if (recorder && recorder.state === "paused") {
    recorder.resume();
    recordTimer = setInterval(function () {
      $("#lblRecordTime").text(Hhmmss(recordTime++));
    }, 1000);
    return;
  }

  durations.push(0);
  await SessionData.set("durations", durations);
  chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
    context = new AudioContext();
    var newStream = context.createMediaStreamSource(stream);
    newStream.connect(context.destination);
    recorder = new MediaRecorder(stream);

    recorder.ondataavailable = async (e) => {
      audioData.push(e.data);
      durations[durations.length - 1] = duration;
      var base64 = await blobToBase64(new Blob(audioData));
      base64 = base64.replace(
        "data:application/octet-stream;",
        "data:audio/wav;"
      );
      await SessionData.set("recording", base64);
      await SessionData.set("durations", durations);
      if (recorder.state === "inactive")
        await SessionData.set("recording", false);
    };
    recorder.onstop = async (e) => {
      // saveToFile(new Blob(audioData), "recording.wav");
      // save recording to recordings list
      var base64 = await blobToBase64(new Blob(audioData));
      base64 = base64.replace(
        "data:application/octet-stream;",
        "data:audio/wav;"
      );
      recordings.push(base64);
      await SessionData.set("recordings", recordings);
      await SessionData.set("durations", durations);
      var audio = $(
        `<option>Audio ${
          $("#slcRecordings option").length + 1
        }&nbsp;&nbsp;(${duration} seconds)</option>`
      );
      $("#slcRecordings").append(audio);
      stream.getAudioTracks()[0].stop();
      $("#btnUploadAudio").removeClass("disabled");
      audioData = [];
      duration = 0;
    };

    recorder.start();
    // $("#lblRecordTime").text(Hhmmss(duration++));
    recordTimer = setInterval(async function () {
      duration += 1;
      $("#lblRecordTime").text(Hhmmss(duration));
      recorder.requestData();
    }, 1000);
  });
}

function Pause() {
  $("#btnPause").addClass("disabled");
  $("#btnRecord").removeClass("disabled");
  $("#record-animation2").removeClass("play");
  if (recordTime) clearInterval(recordTimer);
  if (recorder) recorder.pause();
}
async function Stop() {
  $("#btnPause, #btnStop, #btnMark").addClass("disabled");
  $("#slcMarks").html("");
  $("#btnRecord").removeClass("disabled");
  $("#lblRecordTime").text("00:00:00");
  $("#record-animation2").removeClass("play");
  recording = false;
  recordTime = 0;

  clearInterval(recordTimer);
  recorder.stop();
}

function blobToBase64(blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

async function saveToFile(blob, name) {
  const url = window.URL.createObjectURL(blob);
  audioData = [];
  await SessionData.set("recording", audioData);
  duration = 0;
  const a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}

function RecordCancel() {
  recorder.stop();
}

function Hhmmss(seconds) {
  return new Date(seconds * 1000).toISOString().substr(11, 8);
}

function SelectAudio() {
  var i = $("#slcRecordings")[0].selectedIndex;
  $("audio").attr("src", recordings[i]);
  console.log(recordings[i]);
}
async function AudioDescription() {
  await SessionData.set(
    "recordingDescription",
    $("#txtAudioDescription").val()
  );
}

async function UploadAudio() {
  var meta = await GetMeta();
  var [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  var url = new URL(tab.url).toString();
  if (url.includes("?")) url = url.substring(0, url.indexOf("?"));
  if (url.endsWith("/")) url = url.substring(0, url.length - 1);
  var title = meta.title || "";
  var description = $("#txtAudioDescription").val();
  var date = new Date().toISOString().slice(0, 16);

  $.ajax({
    type: "POST",
    url: "http://92.240.237.148/api/upload-audio",
    dataType: "json",
    async: false,
    contentType: "application/json",
    data: JSON.stringify({ title, description, date, url, recordings }),
    beforeSend: function (xhr) {
      xhr.setRequestHeader(
        "Authorization",
        "Basic " + btoa(username + ":" + password)
      );
    },
    success: async function (x) {
      $("#txtAudioDescription").val("");
      $("#btnUploadAudio").addClass("disabled");
      recordings = [];
      $("#btnUploadAudio").text("Audio saved");
      $("#slcRecordings").html("");
      await SessionData.set("recordingDescription", "");
      await SessionData.set("recordings", []);
      setTimeout((x) => $("#btnUploadAudio").text("Save"), 3000);
    },
    error: function (error) {},
  });
}

async function SaveArticle() {
  $("#btnSaveArticle").text("Saving...");
  $("#btnSaveArticle").addClass("disabled");

  var data = new FormData();
  var username = await SessionData.get("username");
  var password = await SessionData.get("password");
  var title = $("#title").val();
  var description = $("#description").val();
  var date = new Date($("#date").val())
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  var [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  var url = new URL(tab.url).toString();
  if (url.includes("?")) url = url.substring(0, url.indexOf("?"));
  if (url.endsWith("/")) url = url.substring(0, url.length - 1);

  data.append("user", username);
  data.append("title", title);
  data.append("description", description);
  data.append("url", url);
  data.append("date", date);
  $("#lblCapturing").text("Uploading...");
  $.ajax({
    url: "http://92.240.237.148/api/save-article",
    type: "POST",
    data: data,
    contentType: false,
    processData: false,
    beforeSend: function (xhr) {
      xhr.setRequestHeader(
        "Authorization",
        "Basic " + btoa(username + ":" + password)
      );
    },
    success: async function (data) {
      await SessionData.set("saved", true);
      $("#btnSaveArticle").text("✔️ Saved");
    },
    error: async function (data) {
      $("#btnSaveArticle").text("Check Article Later");
      $("#btnSaveArticle").removeClass("disabled");
      alert("Could not save the article at this time, try again later.");
    },
  });
}

async function GetMeta() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  var p = new Promise(function (resolve, reject) {
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        function: function () {
          var metas = document.getElementsByTagName("meta");
          var title, date;
          for (var x of metas)
            if (x.getAttribute("property")) {
              if (x.getAttribute("property").includes("title"))
                title = x.getAttribute("content");
              else if (x.getAttribute("property").includes("date"))
                date = x.getAttribute("content");
            }

          return { title, date };
        },
      },
      function (response) {
        resolve(response[0].result);
      }
    );
  });
  var meta = await p;
  return meta;
}

async function GetStorage(key) {
  var p = new Promise(function (resolve, reject) {
    chrome.storage.local.get(key, function (x) {
      resolve(x[key]);
    });
  });
  return p;
}
async function SetStorage(key, value) {
  var data = {};
  data[key] = value;
  await chrome.storage.local.set(data, function () {});
}
async function ClearStorage(key) {
  var data = {};
  data[key] = null;
  await chrome.storage.local.set(data, function () {});
}

var SessionData = (function () {
  async function get(key) {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    var p = new Promise(function (resolve, reject) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          args: [key],
          function: function (key) {
            window.sessionData = window.sessionData || {};
            return window.sessionData[key];
          },
        },
        function (response) {
          resolve(response[0].result);
        }
      );
    });
    var data = await p;
    return data;
  }
  async function set(key, value) {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    var p = new Promise(function (resolve, reject) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          args: [key, value],
          function: function (key, value) {
            window.sessionData = window.sessionData || {};
            window.sessionData[key] = value;
          },
        },
        function (response) {
          resolve(response[0].result);
        }
      );
    });
  }
  async function clear() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    var p = new Promise(function (resolve, reject) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          function: function () {
            window.sessionData = {};
          },
        },
        function (response) {
          resolve(response[0].result);
        }
      );
    });
  }
  return { get, set, clear };
})();

async function UpdateTitle() {
  await SessionData.set("title", $("#title").val());
}
async function UpdateDescription() {
  await SessionData.set("description", $("#description").val());
}
async function UpdateDate() {
  await SessionData.set("date", $("#date").val());
}

async function CheckSelectionActive() {
  if (parseInt($("#percent").val()) > 0 && (await HasActiveSelection())) {
    $("#btnAdd").removeClass("disabled");
  } else {
    $("#btnAdd").addClass("disabled");
  }

  if (
    $("#selections li.selected").length === 2 &&
    parseInt($("#percent").val()) > 0
  )
    $("#btnConnect").removeClass("disabled");
  else $("#btnConnect").addClass("disabled");
}

async function SetStaticCapture() {
  var [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const { hostname } = new URL(tab.url);
  if ($("#static-capture").prop("checked")) UrlSettings.add(hostname);
  else UrlSettings.remove(hostname);
}

async function SaveColor() {
  await SessionData.set("color", $("#color").val());
}

var UrlSettings = (function () {
  var key = "urlSettings";
  var add = function (url) {
    var data = JSON.parse(localStorage.getItem(key));
    if (data.indexOf(url) === -1) data.push(url);

    localStorage.setItem(key, JSON.stringify(data));
  };

  var remove = function (url) {
    var data = JSON.parse(localStorage.getItem(key));
    const index = data.indexOf(url);
    if (index > -1) {
      data.splice(index, 1);
      localStorage.setItem(key, JSON.stringify(data));
    }
  };

  var exists = function (url) {
    if (localStorage.getItem(key) === null) return false;

    var data = JSON.parse(localStorage.getItem(key));
    if (data.indexOf(url) === -1) return false;
    else return true;
  };

  var initialize = function (url) {
    if (localStorage.getItem(key) === null)
      localStorage.setItem(key, JSON.stringify(["twitter.com"]));
  };

  return { add: add, exists: exists, remove: remove, initialize: initialize };
})();

function Back() {
  $("#connectionsPanel").hide();
}

async function SeeSelections() {
  var html = "";
  var connections = await SessionData.get("connections");
  if (!connections) connections = [];
  var index = 1;
  for (var connection of connections) {
    html += `\n
			<li data-id="${connection.id}">
				<div class="connectionPanel">
					<span class="removeSelection">X</span>
					<p class="title">Connection ${index++}</p>
					<p>${connection.text1}</p>
					<p>${connection.text2}</p>
				</div>
			</li>
		`;
  }
  $("#connections").html(html);
  $(".removeSelection")
    .unbind()
    .click(async function () {
      var connections = await SessionData.get("connections");
      var id = $(this).closest("li").data("id");
      connections = connections.filter(function (obj) {
        return obj.id !== id;
      });
      SessionData.set("connections", connections);
      $(this).closest("li").remove();
    });
  $("#connectionsPanel").show();
}

async function Capture() {
  try {
    var q = $("#quality").val();
    quality = parseInt(q);
    var [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
    var filename = getFilename(tab.url);
    CaptureAPI.captureToFiles(
      tab,
      filename,
      displayCaptures,
      errorHandler,
      progress,
      splitnotifier
    );
    $("#capturing").show();
    $("#lblCapturing").text("Capturing...");
    $("#record-animation1").addClass("play");
    // $("#btnCapture").addClass('disabled');
    // await chrome.scripting.executeScript({target: {tabId: tab.id}, function: function(){document.getSelection().removeAllRanges();}});
    //  await chrome.tabs.captureVisibleTab(tab.windowId, {"format": "png"}, function(img) {
    //  	var a = document.createElement("a");
    //  a.href = img;
    //  a.download = "Image.png";
    //  a.click();
    // });
  } catch (e) {
    alert(e);
    return null;
  }
  // return JSON.stringify(res);
}

async function Cancel() {
  window.close();
}

async function SelectColor(e) {
  colorChosen = true;
  //CheckSelectionActive();
}
async function SetColor(color, id) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  var p = new Promise(function (resolve, reject) {
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        args: [color, id],
        function: function (color, id) {
          var text = window.getSelection().toString();
          const selectedRange = window.getSelection().getRangeAt(0);
          const span = document.createElement("span");
          span.style.backgroundColor = color;
          span.setAttribute("id", `selection-${id}`);
          selectedRange.surroundContents(span);
          document.getSelection().removeAllRanges();
        },
      },
      function (response) {
        resolve(response[0].result);
      }
    );
  });
  await p;
}

function Website() {
  var data = btoa(JSON.stringify({ username, password }));
  window.open(`http://beta.saveyournews.com?access=${data}`);
}

async function Connect() {
  var items = [];
  var id = Math.random().toString(36).substr(2, 5);
  var ids = [];
  var percent = $("#percent").val();
  $("li.selected").each(function () {
    items.push($(this).find(".selection-text").text().trim());
    ids.push($(this).data("id"));
  });
  $("li").removeClass("selected");
  $("#btnConnect").addClass("disabled");
  // for (var item of items) alert(item);
  var connections = await SessionData.get("connections");
  if (!connections) connections = [];

  connections.push({
    id: id,
    text1: items[0],
    text2: items[1],
    ids: ids,
    percentage: percent,
  });
  SessionData.set("connections", connections);
  $("#percent").val(0);
}

async function GetSelectedText() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  var p = new Promise(function (resolve, reject) {
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        function: function () {
          if (!window.selections) window.selections = [];
          var text = window.getSelection().toString();
          if (text) window.selections.push(text);
          return text;
        },
      },
      function (response) {
        resolve(response[0].result);
      }
    );
  });
  var text = await p;
  return text;
}

async function AddSelection(text, color, percentage, id) {
  var newSelection = text ? false : true;
  if (!id) {
    id = await SessionData.get("id");
    id++;
    console.log(id);
    await SessionData.set("id", id);
  }

  text = text || (await GetSelectedText());
  color = $("#color").val();
  percentage = percentage || parseInt($("#percent").val());
  //if (!color){ alert("Select a color first"); return;}

  if (text) {
    $("#lblSelectionsNone").remove();
    var selection =
      $(`<li data-id="${id}"><label class="color-icon" style="background-color: ${color};">&nbsp;&nbsp;</label>
			<label class="selection-text">&nbsp;${id}.&nbsp; ${text}</label></li>`);
    var removeSelection = $(`<span>x</span>`);
    removeSelection
      .appendTo(selection)
      .click(() => RemoveSelection(selection, id));
    selection.appendTo("#selections").click(() => Selection_OnClick(selection));
    if (newSelection) {
      $("#btnAdd").addClass("disabled");
      SetColor(color, id);
      var selections = await SessionData.get("selections");
      if (!selections) selections = [];
      selections.push({
        id: id,
        text: text,
        color: color,
        percentage: percentage,
      });
      await SessionData.set("selections", selections);
    }
  }
  $("#percent").val(0);
}

function Selection_OnClick(selection) {
  if ($(selection).hasClass("selected")) {
    $(selection).removeClass("selected");
  } else {
    if ($("#selections li.selected").length < 2)
      $(selection).addClass("selected");
  }

  if (
    $("#selections li.selected").length === 2 &&
    parseInt($("#percent").val()) > 0
  ) {
    $("#btnConnect").removeClass("disabled");
  } else $("#btnConnect").addClass("disabled");
}

async function RemoveSelection(selection, id) {
  $(selection).remove();
  if (!$("#selections li").length) {
    $(`<lbl id="lblSelectionsNone">No selections added yet</lbl>`).insertAfter(
      "#lblSelections"
    );
    $("#btnConnect").addClass("disabled");
  }
  var selections = await SessionData.get("selections");
  if (!selections) selections = [];
  selections = selections.filter(function (selection) {
    return selection.id !== id;
  });
  await SessionData.set("selections", selections);

  var connections = await SessionData.get("connections");
  if (connections) {
    connections = connections.filter(function (connection) {
      return !connection.ids.includes(id);
    });
    await SessionData.set("connections", connections);
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  var p = new Promise(function (resolve, reject) {
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        args: [id],
        function: function (id) {
          var selection = document.querySelector(`#selection-${id}`);
          if (!selection) return;
          selection.outerHTML = selection.innerHTML;
        },
      },
      function (response) {
        resolve(response[0].result);
      }
    );
  });
  await p;
}

async function HasActiveSelection() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  var p = new Promise(function (resolve, reject) {
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        function: function () {
          var hasSelection = false;
          var text = window.getSelection().toString();
          if (text) hasSelection = true;
          return hasSelection;
        },
      },
      function (response) {
        resolve(response[0].result);
      }
    );
  });
  var hasSelection = await p;
  return hasSelection;
}

function SelectItem(e) {
  $(e).toggleClass("selected");
  if ($(".selected").length > 1) $("#btnConnect").prop("disabled", false);
  else $("#btnConnect").prop("disabled", true);
}

//////////////////////////////////
//////// CAPTURE API //////////
//////////////////////////////////

var currentTab, resultWindowId;

//
// Utility methods
//

// function Element(id) { return document.getElementById(id); }
function show(id) {
  document.getElementById(id).style.display = "block";
}

function hide(id) {
  document.getElementById(id).style.display = "none";
}

function getFilename(contentURL) {
  var name = contentURL.split("?")[0].split("#")[0];
  if (name) {
    name = name
      .replace(/^https?:\/\//, "")
      .replace(/[^A-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[_\-]+/, "")
      .replace(/[_\-]+$/, "");
    name = "-" + name;
  } else {
    name = "";
  }
  return "screencapture" + name + "-" + Date.now() + ".jpeg";
}

//
// Capture Handlers
//

async function displayCaptures(filenames) {
  if (!filenames || !filenames.length) return;
  // send screenshot
  var selections = await SessionData.get("selections");
  var connections = await SessionData.get("connections");
  if (connections) {
    for (var c of connections) {
      c.text1 = c.text1.substring(c.text1.indexOf(" ") + 1);
      c.text2 = c.text2.substring(c.text2.indexOf(" ") + 1);
    }
  } else connections = [];

  var data = new FormData();
  var username = await SessionData.get("username");
  var password = await SessionData.get("password");
  var title = $("#title").val();
  var description = $("#description").val();
  var date = new Date($("#date").val())
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  var [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  var url = new URL(tab.url).toString();
  if (url.includes("?")) url = url.substring(0, url.indexOf("?"));
  if (url.endsWith("/")) url = url.substring(0, url.length - 1);

  data.append("selections", JSON.stringify(selections));
  data.append("connections", JSON.stringify(connections));
  data.append("capture", finalScreenshot);
  data.append("metadata", JSON.stringify({ title, description, date, url }));
  $("#lblCapturing").text("Uploading...");
  $.ajax({
    url: "http://92.240.237.148/api/upload",
    type: "POST",
    data: data,
    contentType: false,
    processData: false,
    beforeSend: function (xhr) {
      xhr.setRequestHeader(
        "Authorization",
        "Basic " + btoa(username + ":" + password)
      );
    },
    success: async function (data) {
      $("#capturing").hide();
      $("#lblCapturing").text("Capturing...");
      $("#record-animation1").removeClass("play");
      // $("#btnCapture").removeClass('disabled');
      _displayCapture(filenames);
    },
    error: async function (data) {
      $("#capturing").hide();
      $("#lblCapturing").text("Capturing...");
      $("#record-animation1").removeClass("play");
      // $("#btnCapture").removeClass('disabled');
      alert("Something went wrong.");
      console.log("error uploading:");
      console.log(data);
    },
  });
}

function _displayCapture(filenames, index) {
  index = index || 0;
  var filename = filenames[index];
  var last = index === filenames.length - 1;

  if (currentTab.incognito && index === 0) {
    // cannot access file system in incognito, so open in non-incognito
    // window and add any additional tabs to that window.
    //
    // we have to be careful with focused too, because that will close
    // the popup.
    chrome.windows.create(
      {
        url: filename,
        incognito: false,
        focused: last,
      },
      function (win) {
        resultWindowId = win.id;
      }
    );
  } else {
    chrome.tabs.create({
      url: filename,
      active: last,
      windowId: resultWindowId,
      openerTabId: currentTab.id,
      index: (currentTab.incognito ? 0 : currentTab.index) + 1 + index,
    });
  }

  if (!last) {
    _displayCapture(filenames, index + 1);
  }
}

function errorHandler(reason) {
  // show('uh-oh'); // TODO - extra uh-oh info?
}

function progress(complete) {
  if (complete === 0) {
    // Page capture has just been initiated.
    // show('loading');
  } else {
    // document.getElementById('bar').style.width = parseInt(complete * 100, 10) + '%';
  }
}

function splitnotifier() {
  return;
  // show('split-image');
}

//
// start doing stuff immediately! - including error cases
//

window.CaptureAPI = (function () {
  var MAX_PRIMARY_DIMENSION = 15000 * 2,
    MAX_SECONDARY_DIMENSION = 4000 * 2,
    MAX_AREA = MAX_PRIMARY_DIMENSION * MAX_SECONDARY_DIMENSION;

  //
  // URL Matching test - to verify we can talk to this URL
  //

  var matches = ["http://*/*", "https://*/*", "ftp://*/*", "file://*/*"],
    noMatches = [/^https?:\/\/chrome.google.com\/.*$/];

  function isValidUrl(url) {
    // couldn't find a better way to tell if executeScript
    // wouldn't work -- so just testing against known urls
    // for now...
    var r, i;
    for (i = noMatches.length - 1; i >= 0; i--) {
      if (noMatches[i].test(url)) {
        return false;
      }
    }
    for (i = matches.length - 1; i >= 0; i--) {
      r = new RegExp("^" + matches[i].replace(/\*/g, ".*") + "$");
      if (r.test(url)) {
        return true;
      }
    }
    return false;
  }

  function initiateCapture(tab, static, callback) {
    chrome.tabs.sendMessage(
      tab.id,
      { msg: "scrollPage", static: static },
      function () {
        // We're done taking snapshots of all parts of the window. Display
        // the resulting full screenshot images in a new browser tab.
        callback();
      }
    );
  }

  function capture(data, screenshots, sendResponse, splitnotifier) {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, function (dataURI) {
      if (dataURI) {
        var image = new Image();
        image.onload = function () {
          data.image = { width: image.width, height: image.height };

          // given device mode emulation or zooming, we may end up with
          // a different sized image than expected, so let's adjust to
          // match it!
          if (data.windowWidth !== image.width) {
            var scale = image.width / data.windowWidth;
            data.x *= scale;
            data.y *= scale;
            data.totalWidth *= scale;
            data.totalHeight *= scale;
          }

          // lazy initialization of screenshot canvases (since we need to wait
          // for actual image size)
          if (!screenshots.length) {
            Array.prototype.push.apply(
              screenshots,
              _initScreenshots(data.totalWidth, data.totalHeight)
            );
            if (screenshots.length > 1) {
              if (splitnotifier) {
                splitnotifier();
              }
              document.getElementById("screenshot-count").innerText =
                screenshots.length;
            }
          }

          // draw it on matching screenshot canvases
          _filterScreenshots(
            data.x,
            data.y,
            image.width,
            image.height,
            screenshots
          ).forEach(function (screenshot) {
            screenshot.ctx.drawImage(
              image,
              data.x - screenshot.left,
              data.y - screenshot.top
            );
          });

          // send back log data for debugging (but keep it truthy to
          // indicate success)
          sendResponse(JSON.stringify(data, null, 4) || true);
        };
        image.src = dataURI;
      }
    });
  }

  function _initScreenshots(totalWidth, totalHeight) {
    // Create and return an array of screenshot objects based
    // on the `totalWidth` and `totalHeight` of the final image.
    // We have to account for multiple canvases if too large,
    // because Chrome won't generate an image otherwise.
    //
    var badSize =
        totalHeight > MAX_PRIMARY_DIMENSION ||
        totalWidth > MAX_PRIMARY_DIMENSION ||
        totalHeight * totalWidth > MAX_AREA,
      biggerWidth = totalWidth > totalHeight,
      maxWidth = !badSize
        ? totalWidth
        : biggerWidth
        ? MAX_PRIMARY_DIMENSION
        : MAX_SECONDARY_DIMENSION,
      maxHeight = !badSize
        ? totalHeight
        : biggerWidth
        ? MAX_SECONDARY_DIMENSION
        : MAX_PRIMARY_DIMENSION,
      numCols = Math.ceil(totalWidth / maxWidth),
      numRows = Math.ceil(totalHeight / maxHeight),
      row,
      col,
      canvas,
      left,
      top;

    var canvasIndex = 0;
    var result = [];

    for (row = 0; row < numRows; row++) {
      for (col = 0; col < numCols; col++) {
        canvas = document.createElement("canvas");
        canvas.width =
          col == numCols - 1 ? totalWidth % maxWidth || maxWidth : maxWidth;
        canvas.height =
          row == numRows - 1 ? totalHeight % maxHeight || maxHeight : maxHeight;

        left = col * maxWidth;
        top = row * maxHeight;

        result.push({
          canvas: canvas,
          ctx: canvas.getContext("2d"),
          index: canvasIndex,
          left: left,
          right: left + canvas.width,
          top: top,
          bottom: top + canvas.height,
        });

        canvasIndex++;
      }
    }

    return result;
  }

  function _filterScreenshots(
    imgLeft,
    imgTop,
    imgWidth,
    imgHeight,
    screenshots
  ) {
    // Filter down the screenshots to ones that match the location
    // of the given image.
    //
    var imgRight = imgLeft + imgWidth,
      imgBottom = imgTop + imgHeight;
    return screenshots.filter(function (screenshot) {
      return (
        imgLeft < screenshot.right &&
        imgRight > screenshot.left &&
        imgTop < screenshot.bottom &&
        imgBottom > screenshot.top
      );
    });
  }

  function getBlobs(screenshots) {
    return screenshots.map(function (screenshot) {
      var dataURI = screenshot.canvas.toDataURL("image/jpeg", quality / 100);
      finalScreenshot = dataURI;

      // convert base64 to raw binary data held in a string
      // doesn't handle URLEncoded DataURIs
      var byteString = atob(dataURI.split(",")[1]);

      // separate out the mime component
      var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

      // write the bytes of the string to an ArrayBuffer
      var ab = new ArrayBuffer(byteString.length);
      var ia = new Uint8Array(ab);
      for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      // create a blob for writing to a file
      var blob = new Blob([ab], { type: mimeString });
      return blob;
    });
  }

  function saveBlob(blob, filename, index, callback, errback) {
    filename = _addFilenameSuffix(filename, index);

    function onwriteend() {
      // open the file that now contains the blob - calling
      // `openPage` again if we had to split up the image
      var urlName =
        "filesystem:chrome-extension://" +
        chrome.i18n.getMessage("@@extension_id") +
        "/temporary/" +
        filename;

      callback(urlName);
    }

    // come up with file-system size with a little buffer
    var size = blob.size + 1024 / 2;

    // create a blob for writing to a file
    var reqFileSystem =
      window.requestFileSystem || window.webkitRequestFileSystem;
    reqFileSystem(
      window.TEMPORARY,
      size,
      function (fs) {
        fs.root.getFile(
          filename,
          { create: true },
          function (fileEntry) {
            fileEntry.createWriter(function (fileWriter) {
              fileWriter.onwriteend = onwriteend;
              fileWriter.write(blob);
            }, errback); // TODO - standardize error callbacks?
          },
          errback
        );
      },
      errback
    );
  }

  function _addFilenameSuffix(filename, index) {
    if (!index) {
      return filename;
    }
    var sp = filename.split(".");
    var ext = sp.pop();
    return sp.join(".") + "-" + (index + 1) + "." + ext;
  }

  function captureToBlobs(tab, callback, errback, progress, splitnotifier) {
    var loaded = false,
      screenshots = [],
      timeout = 3000,
      timedOut = false,
      noop = function () {};

    callback = callback || noop;
    errback = errback || noop;
    progress = progress || noop;

    if (!isValidUrl(tab.url)) {
      errback("invalid url"); // TODO errors
    }

    // TODO will this stack up if run multiple times? (I think it will get cleared?)
    chrome.runtime.onMessage.addListener(function (
      request,
      sender,
      sendResponse
    ) {
      if (request.msg === "capture") {
        progress(request.complete);
        capture(request, screenshots, sendResponse, splitnotifier);

        // https://developer.chrome.com/extensions/messaging#simple
        //
        // If you want to asynchronously use sendResponse, add return true;
        // to the onMessage event handler.
        //
        return true;
      } else {
        console.error(
          "Unknown message received from content script: " + request.msg
        );
        errback("internal error");
        return false;
      }
    });

    chrome.scripting.executeScript(
      { target: { tabId: tab.id }, files: ["capture-page.js"] },
      function () {
        if (timedOut) {
          console.error(
            "Timed out too early while waiting for " +
              "chrome.tabs.executeScript. Try increasing the timeout."
          );
        } else {
          loaded = true;
          progress(0);
          var static = $("#static").prop("checked");
          console.log(static);
          initiateCapture(tab, static, function () {
            callback(getBlobs(screenshots));
          });
        }
      }
    );

    window.setTimeout(function () {
      if (!loaded) {
        timedOut = true;
        errback("execute timeout");
      }
    }, timeout);
  }

  function captureToFiles(
    tab,
    filename,
    callback,
    errback,
    progress,
    splitnotifier
  ) {
    captureToBlobs(
      tab,
      function (blobs) {
        var i = 0,
          len = blobs.length,
          filenames = [];

        (function doNext() {
          saveBlob(
            blobs[i],
            filename,
            i,
            function (filename) {
              i++;
              filenames.push(filename);
              i >= len ? callback(filenames) : doNext();
            },
            errback
          );
        })();
      },
      errback,
      progress,
      splitnotifier
    );
  }

  return {
    captureToBlobs: captureToBlobs,
    captureToFiles: captureToFiles,
  };
})();
