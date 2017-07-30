// global default state of whether user has getUserMedia permission for audio stream is false
localStorage.setItem("isGetUserMediaInitialized", "false");

// global default state of whether Google Vocie API's Voice-To-Text is working
var recognizing = false;

// global default state of whether Luna has been called
var isListeningForQueryActivated = false;

// times how long since Luna has been activated
var timeSinceLunaActivatedTimer;

// global variables for keeping track of the animated Luna icon
var minLunaIconFrame = 0;
var maxLunaIconFrame = 5;
var currentLunaIconFrame = minLunaIconFrame;
var keepAnimatingLunaIcon = false;

// toggle Luna on/off by clicking Chrome icon
chrome.browserAction.onClicked.addListener(function() {
  // turn on Luna
  if (!recognizing) {
    // initialize getUserMedia if not yet approved by user
    if (!JSON.parse(localStorage.getItem("isGetUserMediaInitialized"))) {
      initializeGetUserMedia();
    }

    // if getUserMedia initialization successful, turn on voice-to-text
    if (JSON.parse(localStorage.getItem("isGetUserMediaInitialized"))) {
      startVoiceToText();
    }

  } else { //turn off
    // turn on voice-to-text
    stopVoiceToText();
  }
});

// initialize Google Web Speech API
if ('webkitSpeechRecognition' in window) {
  // main Google Web Speech API object for listening to audio stream
  var recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = "en";

  // initialize timer variable;
  var start_timestamp

  console.log(recognition);
  // Google Web Speech APIenent handler for the start of speech
  recognition.onspeechstart = function(event) {
    if (recognizing) {
      // start timer for error debugging purposes
      start_timestamp = event.timeStamp;
    }

  };

  // Google Web Speech APIenent handler on end of audio-processing
  recognition.onresult = function(event) {
    if (recognizing) {
      for (var i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          var latestString = event.results[i][0].transcript;
          console.log(latestString);

          // this prevents Luna from listening to it's own verbal warnings
          if (latestString == "sorry I don't understand that request") {
            break;
          }

          // check if latest string includes call to "Okay Luna"
          if (isOkayLunaCalled(latestString)) {
            startListeningForQuery();
          } else if (isListeningForQueryActivated) { // if listening for query
            // listen for new queries without "Hello Luna" prompt for 9 seconds
            clearTimeout(timeSinceLunaActivatedTimer);
            timeSinceLunaActivatedTimer = setTimeout(stopListeningForQuery, 9000);

            // if a non-null string exists for the query, get the intent
            if (latestString) {
              getIntent(latestString)
            }
          }
          break;
        }
      }
    }
  };

  // Google Web Speech API enent handler for end of listening
  recognition.onend = function() {
    if (recognizing) {
      recognition.start();
    }
  };

  // Google Web Speech API enent handler for error
  recognition.onerror = function(event) {
    if (event.error == 'no-speech') {
      console.log('info_no_speech');
    }
    if (event.error == 'audio-capture') {
      console.log('info_no_microphone');
    }
    if (event.error == 'not-allowed') {
      if (event.timeStamp - start_timestamp < 100) {
        console.log('info_blocked');
      } else {
        console.log('info_denied');
      }
    }
  };
}

// prompt user for getUserMedia permission via the
// background page and redirect user to original page
function initializeGetUserMedia() {
  // save current link in local storage so that the
  // options page is able to navigate back to this
  // page after user approves getUserMedia permissions
  chrome.tabs.query({
    currentWindow: true,
    active: true
  }, function(tabs) {
    var currentURL = tabs[0].url;

    // regex for: chrome-extension://
    var reg1 = /chrome\-extension:\/\//;

    // regex for: .html
    var reg2 = /initialize\.html/;

    // if current URL has reg1 and reg2, it is the option page.
    // if and only if the current page is not the options page,
    // store the current URL for future
    // refernce in order to return to this page
    if (!((reg1.test(currentURL)) && (reg2.test(currentURL)))) {
      localStorage.setItem('currentURL', currentURL);
    }
  });

  // go to options page to get getUserMedia permissions for audio stream
  chrome.tabs.update({
    url: "initialize.html"
  });
}

// check latestString if "Okay Luna" call exists
function isOkayLunaCalled(latestString) {
  // possible variations of "Okay Luna" and cooresponding regex
  // regex note: "i" tag allows for case invariant search
  okayLunaVariation = [
    /Okay Luna/i,
    /Okay we'll see/i,
    /It\'s okay Luna/i,
    /Okay Luna/i,
    /Okay Luna\'s/i,
  ]

  // check if "Okay Luna" or a similar variation called
  for (var i = 0; i < okayLunaVariation.length; i++) {
    if (okayLunaVariation[i].test(latestString)) {
      // "Okay Luna" called
      return true;
    }
  }

  // "Okay Luna" and its variation not found
  return false;
}

// Given that "Okay Luna" has been called, start listening for query
function startListeningForQuery() {
  // trigger audio since Luna called
  var beepOn = new Audio('beep_short_on.wav');
  beepOn.play();

  // start animating Luna icon to indiate
  keepAnimatingLunaIcon = true;
  if (!isListeningForQueryActivated) {
    animateLunaIcon();
  }

  // after 6 seconds, Luna will be deactivated unless a user says a query
  clearTimeout(timeSinceLunaActivatedTimer);
  timeSinceLunaActivatedTimer = setTimeout(stopListeningForQuery, 6000);

  // Okay Luna has been called!
  isListeningForQueryActivated = true;
}

// animate the Luna icon frame by frame
function animateLunaIcon() {
  if (keepAnimatingLunaIcon) {
    chrome.browserAction.setIcon({
      path: "mic-animated-" + currentLunaIconFrame + ".png"
    });
    if (currentLunaIconFrame++ >= maxLunaIconFrame) {
      currentLunaIconFrame = minLunaIconFrame;
    }

    // switch to next frame of icon every .2 seconds
    window.setTimeout(animateLunaIcon, 200);
  }
}

// Stop listening for query
function stopListeningForQuery() {
  // deactvate query listening state
  isListeningForQueryActivated = false;

  // trigger audio to indicate Luna no longer registering the query
  var beepOff = new Audio('beep_short_off.wav');
  beepOff.play();

  // trigger the icon indicating Luna is listening
  keepAnimatingLunaIcon = false;
  chrome.browserAction.setIcon({
    path: 'mic.png'
  })
}

// enable Google Web Speech API's Voice-To-Text functionality
function startVoiceToText() {
  // if still listening from last Voice-To-Text session, turn it off
  // in order to restart
  if (recognizing) {
    recognition.stop();
    return;
  }

  // enable Luna to start listening
  recognition.start();

  // set global variable tracking whether VoceToText is working
  recognizing = true;

  // trigger the icon indicating Luna is listening
  keepAnimatingLunaIcon = false;
  chrome.browserAction.setIcon({
    path: 'mic.png'
  })
}

// turn off Voice-To-Text, along with Luna
function stopVoiceToText() {
  // set global variable tracking whether VoceToText is working
  recognizing = false;

  // trigger the icon indicating Luna is not listening
  keepAnimatingLunaIcon = false;
  chrome.browserAction.setIcon({
    path: 'mic-slash.png'
  })

  // stop listening for query and reset query timer
  clearTimeout(timeSinceLunaActivatedTimer);
  isListeningForQueryActivated = false;

  // stop the Voice-To-Text functionality
  recognition.stop();
}

// call API.AI to get the intent of the query
function getIntent(query) {
  // asynchronously query the API.AI api server
  $.ajax({
    method: "POST",
    url: "https://api.api.ai/v1/query?v=20150910",
    contentType: 'application/json; charset=UTF-8',
    dataType: 'json',
    headers: {
      'Authorization': 'Bearer fdd773da222c41ea833f9340c736179a'
    },
    data: JSON.stringify({
      'lang': 'en',
      'sessionId': '12345',
      'query': query
    }),
    // on success, the api answer is captured in the data variable
    // execute functions in action.js depending on the intent
    success: function(data) {
      console.log(data);

      // verbally notify the user if the intent is invalid
      if (data.result.action == undefined) {
        chrome.tts.getVoices(function(voices) {
          chrome.tts.speak("Sorry, I don't understand that request.", {
            'voiceName': 'Google UK English Female'
          });
        });
      } else {
        // get the active tab's ID
        chrome.tabs.query({
          active: true,
          currentWindow: true
        }, function(tabs) {
          // inject the active tab with the content script (actions.js),
          // passing the JSON response from API.AI as an argument
          chrome.tabs.sendMessage(tabs[0].id, {
            data: data
          }, function(response) {
            // add code here...
          });
        });
      }
    },
    error: function() {
      return ("Internal Server Error");
    }
  });
}
