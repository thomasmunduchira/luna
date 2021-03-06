var data;
var image;
var timer;
var height;
var linkNumber;
var boxNumber;
var boxValue;
var synth = window.speechSynthesis;
var description;
var youtubeStatus;
var videoPos;
var utterThis = new SpeechSynthesisUtterance("");
//new SpeechSynthesisUtterance("I'm sorry, I don't understand that request. Please try again later or try a different request.");

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    console.log("DATA: " + request.data);
    data = request.data;
    if (typeof request.height !== "undefined"){
      height = request.height;
      console.log("height is: " + height);
    }
    if (typeof request.linkNumber !== "undefined"){
      linkNumber = request.linkNumber;
      console.log("linkNumber is: " + linkNumber);
    }
    if (typeof request.boxNumber !== "undefined"){
      boxNumber = request.boxNumber;
      console.log("boxNumber is: " + boxNumber);
    }
    if (typeof request.boxValue !== "undefined"){
      boxValue = request.boxValue;
      console.log("boxValue is: " + boxValue);
    }
    if (typeof request.description !== "undefined"){
      description = request.description;
      console.log("description is: " + description);
    }
    if (typeof request.youtubeStatus !== "undefined"){
      youtubeStatus = request.youtubeStatus;
      console.log("youtubeStatus is: " + youtubeStatus);
    }
    if (typeof request.videoPos !== "undefined"){
      videoPos = request.videoPos;
      console.log("videoPos is: " + videoPos);
    }
    selectIntent(data);
  }
);

var intentFuncMap = {
  "scroll_up": scrollUp,
  "scroll_up_full": scrollUpFull,
  "scroll_down": scrollDown,
  "scroll_down_full": scrollDownFull,
  "go_back": goBack,
  "go_forward": goForward,
  "show_links": showLinks,
  "open_link": openLink,
  "show_textboxes": showTextboxes,
  "type_textboxes": typeTextboxes,
  "invert_colors": invertColors,
  "describe_images": describeImages,
  "say_images": sayImages,
  "youtube_assist": youtubeAssist
};

function scrollUp() {
  console.log("I'm trying to scroll up");
  window.scrollBy(window.scrollY, -height/2);
  chrome.runtime.sendMessage({"actions" : "scrollUp"}, function (response) {
      console.log("scrollUp response: " + response);
  });
}

function scrollUpFull() {
  console.log("I'm trying to scroll up full");
  window.scrollTo(window.scrollY, 0);
  chrome.runtime.sendMessage({"actions" : "scrollUpFull"}, function (response) {
      console.log("scrollUpFull response: " + response);
  });
}

function scrollDown() {
  console.log("I'm trying to scroll down");
  window.scrollBy(window.scrollY, height/2);
  chrome.runtime.sendMessage({"actions" : "scrollDown"}, function (response) {
      console.log("scrollDown response: " + response);
      console.log("sD new position: " + window.scrollY);
  });
}

function scrollDownFull() {
  console.log("I'm trying to scroll down full");
  window.scrollTo(window.scrollY, document.body.scrollHeight);
  chrome.runtime.sendMessage({"actions" : "scrollDownFull"}, function (response) {
      console.log("scrollDownFull response: " + response);
      console.log("sDF new position: " + window.scrollY);
  });
}

function goBack() {
  console.log("I'm trying to go back");
  window.history.back();
  chrome.runtime.sendMessage({"actions" : "goBack"}, function (response) {
      console.log("goBack response: " + response);
  });
}

function goForward() {
  console.log("I'm trying to go forward");
  window.history.forward();
  chrome.runtime.sendMessage({"actions" : "goForward"}, function (response) {
      console.log("goForward response: " + response);
  });
}

function showLinks() {
  console.log("I'm trying to show links");
  var links = document.getElementsByTagName("a");
  for(var i = 0; i < links.length; i++) {
    console.log("link " + i + " on page: " + links[i].href);
    links[i].innerHTML = "<mark>Link " + i + ":</mark> " + links[i].innerHTML;
    links[i].className += " chromeControlLinkSelected-" + i;
  }
  chrome.runtime.sendMessage({"actions" : "showLinks"}, function (response) {
    console.log("showLinks response: " + response);
  });
}

function openLink() {
  console.log("I'm trying to open link");
  var link = document.getElementsByClassName("chromeControlLinkSelected-" + linkNumber)[0];
  window.location.href = link;
  chrome.runtime.sendMessage({"actions" : "openLink"}, function (response) {
      console.log("openLink response: " + JSON.stringify(response));
  });
}

function showTextboxes() {
  console.log("showing boxes");
  var boxes = document.getElementsByTagName("input");
  for (var i = 0; i < boxes.length; i++) {
    console.log("box " + i + " on page: " + boxes[i]);
    boxes[i].value = "Box " + i + " :::: " + boxes[i].value;
    boxes[i].style.backgroundColor = "yellow";
    boxes[i].className += " chromeControlBoxSelected-" + i;
  }
  chrome.runtime.sendMessage({"actions" : "showTextboxes"}, function (response) {
    console.log("showTextboxes response: " + response);
  });
}

function typeTextboxes() {
  console.log("typing text");
  var box = document.getElementsByClassName("chromeControlBoxSelected-" + boxNumber)[0];
  box.value = boxValue;
  chrome.runtime.sendMessage({"actions" : "typeTextboxes"}, function (response) {
    console.log("typeTextboxes response: " + JSON.stringify(response));
  });
}

function invertColors() {
    (function () {
      var css = 'html {-webkit-filter: invert(100%);' + '-moz-filter: invert(100%);' + '-o-filter: invert(100%);' + '-ms-filter: invert(100%); }';
      var head = document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      if (!window.counter) {
          window.counter = 1;
      } else {
          window.counter++;
          if (window.counter % 2 == 0) {
              var css = 'html {-webkit-filter: invert(0%); -moz-filter: invert(0%); -o-filter: invert(0%); -ms-filter: invert(0%); }'
          }
      }
      style.type = 'text/css';
      if (style.styleSheet) {
          style.styleSheet.cssText = css;
      } else {
          style.appendChild(document.createTextNode(css));
      }
      head.appendChild(style);
  }());
  chrome.runtime.sendMessage({"actions" : "invertColors"}, function (response) {
      console.log("invertColors response: " + JSON.stringify(response));
  });
}

function describeImages() {
    console.log("Try to make call for get and analyze images");
    var images = document.getElementsByTagName('img');
    var srcList = [];
    for(var i = 0; i < 5; i++){
      console.log("this is an OG img mofos: " + images[i].src);
      srcList.push(images[i].src);
    }

    $.ajax({
    url: 'http://127.0.0.1:3000/',
    type: 'POST',
    data: {
      "imgArray": srcList
    },
    success: function (data) {
      console.log("images analysis works: " + JSON.stringify(data));
      var text = new SpeechSynthesisUtterance(data);
      synth.speak(text);
      chrome.runtime.sendMessage({"actions" : "describeImages"}, function (response) {
          console.log("describeImages response: " + JSON.stringify(response));
      });
    }
  });
}

function sayImages() {
  var text = new SpeechSynthesisUtterance("The images on the page include: " + description);
  synth.speak(text);
  chrome.runtime.sendMessage({"actions" : "sayImages"}, function (response) {
      console.log("sayImages response: " + JSON.stringify(response));
  });
}

function youtubeAssist() {
  if(youtubeStatus == "play" || youtubeStatus == "pause"){
    document.getElementsByClassName('ytp-play-button')[0].click();
  }
  else {
    if(videoPos !== undefined){
      document.getElementById("video").currentTime = data.videoPos;
    }
  }
}

function selectIntent(data) {
  console.log("inside selectIntent!!!");
  var foundFunction = false;
  var x;
  for (var key in intentFuncMap) {
    if (data == key) {
      console.log("found function! it is: " + key);
      foundFunction = true;
      x = key
      break;
    }
  }
  if (foundFunction){
    intentFuncMap[x]();
  }
  else {
    if (data != "reset") {
      synth.speak(utterThis);
    }
  }
}
