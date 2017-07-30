var config = {
  apiKey: "AIzaSyCkUgXRowrKah1P8C2MtVsTK2vd8ESM1-U",
  authDomain: "luna-9830c.firebaseapp.com",
  databaseURL: "https://luna-9830c.firebaseio.com",
  projectId: "luna-9830c",
  storageBucket: "luna-9830c.appspot.com",
  messagingSenderId: "768281558423"
};
firebase.initializeApp(config);
firebase.database().ref().on("value", function (s) {
  var params = {
    data: "say_images",
    description: s.val().images
  };
  chrome.tabs.query({
    currentWindow: true,
    active: true
  }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, params, function(response) {
        console.log("response: " + JSON.stringify(response));
      });
    });
});

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
            // timeSinceLunaActivatedTimer = setTimeout(stopListeningForQuery, 4000);

            // if a non-null string exists for the query, get the intent
            if (latestString) {
              getIntent(latestString);
              clearTimeout(timeSinceLunaActivatedTimer);
              stopListeningForQuery();
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
    console.log(event);
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
    url: "public/initialize.html"
  });
}

// check latestString if "Okay Luna" call exists
function isOkayLunaCalled(latestString) {
  // possible variations of "Okay Luna" and cooresponding regex
  // regex note: "i" tag allows for case invariant search
  okayLunaVariation = [
    /Luna/i,
    /Okay Luna/i,
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
  var beepOn = new Audio('audio/beep_short_on.wav');
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
      path: "images/mic-animated-" + currentLunaIconFrame + ".png"
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
  var beepOff = new Audio('audio/beep_short_off.wav');
  beepOff.play();

  // trigger the icon indicating Luna is listening
  keepAnimatingLunaIcon = false;
  chrome.browserAction.setIcon({
    path: 'images/mic.png'
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
    path: 'images/mic.png'
  })
}

// turn off Voice-To-Text, along with Luna
function stopVoiceToText() {
  // set global variable tracking whether VoceToText is working
  recognizing = false;

  // trigger the icon indicating Luna is not listening
  keepAnimatingLunaIcon = false;
  chrome.browserAction.setIcon({
    path: 'images/mic-slash.png'
  });

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
      console.log("data: " + JSON.stringify(data));

      // verbally notify the user if the intent is invalid
      if (data.result.action == undefined) {
        chrome.tts.getVoices(function(voices) {
          chrome.tts.speak("Sorry, I don't understand that request.", {
            'voiceName': 'Google UK English Female'
          });
        });
      } else {
        switch (data.result.action) {
          case "new_tab":
            chrome.tabs.create({
              url: "http://google.com"
            }, function(tab) {
              console.log("new_tab request completed!");
            });
            break;

          case "close_tab":
            chrome.tabs.query({
              currentWindow: true,
              active: true
            }, function(tabs) {
              chrome.tabs.remove(tabs[0].id);
              console.log("close_tab request completed!");
            });
            break;

          // case "google_search":
          //   var gUrl = "http://google.com/#q=" + data.result.parameters.any.split(" ").join("+");
          //   chrome.tabs.create({
          //     url: gUrl
          //   }, function(tab) {
          //     console.log("google_search request completed!");
          //   });
          //   break;

          case "stackoverflow_search":
            var soUrl = "https://stackoverflow.com/search?q=" + data.result.parameters.any.split(" ").join("+");
            chrome.tabs.create({
              url: soUrl
            }, function(tab) {
              console.log("stackoverflow_search request completed!");
            });
            break;

          case "youtube_search":
            var yUrl = "https://www.youtube.com/results?search_query=" + data.result.parameters.any.split(" ").join("+");
            chrome.tabs.create({
              url: yUrl
            }, function(tab) {
              console.log("youtube_search request completed!");
            });
            break;

          case "zoom":
            chrome.tabs.query({
              currentWindow: true,
              active: true
            }, function(tabs) {
              chrome.tabs.getZoom(tabs[0].id, function(zoomFactor) {
                var zoomType = data.result.parameters.zoomType;
                if (zoomType == "reset" || (zoomType == "out" && (zoomFactor - 0.25) <= 0)) {
                  zoomChange = 1.0;
                  console.log("zoomChange reset to 1.0 aka 100%");
                } else {
                  var zoomChange = zoomType == "in" ? 0.25 + zoomFactor : zoomFactor - 0.25;
                }
                console.log("zoomType is: " + zoomType);
                console.log("changing from " + zoomFactor + " --> " + zoomChange);
                chrome.tabs.setZoom(tabs[0].id, zoomChange, function() {
                  console.log("done zooming now!!!");
                });
              });
            });
            break;

          case "website_search":
            var websiteUrl = !data.result.parameters.url.includes("http") ? "http://" + data.result.parameters.websiteUrl : data.result.parameters.websiteUrl;
            if (websiteUrl.includes("..")) {
              websiteUrl = websiteUrl.replace("..", ".");
            }
            chrome.tabs.create({
              url: websiteUrl
            }, function(tab) {
              console.log("website_search request completed!");
            });
            break;

          case "create_bookmark":
            console.log("in bookmark spot!!!");
            chrome.tabs.query({
              currentWindow: true,
              active: true
            }, function(tabs) {
              var title = tabs[0].title;
              var url = tabs[0].url;
              chrome.bookmarks.search("Browser Control", function(results) {
                if (!results.length) {
                  chrome.bookmarks.create({
                    "parentId": "1",
                    "title": "Luna"
                  },
                  function(newFolder) {
                    console.log("added folder: " + newFolder.title);
                    addUrlToBookmarks(newFolder.id, title, url);
                  });
                } else {
                  console.log("bookmark results: " + JSON.stringify(results));
                  console.log("Found bookmark folder!!! " + results[0].id);
                  addUrlToBookmarks(results[0].id, title, url);
                }
              });
            });
            break;

          case "reload_page":
            chrome.tabs.query({
              lastFocusedWindow: true,
              active: true
            }, function(tabs) {
              chrome.tabs.reload(tabs[0].id, {
                bypassCache: true
              }, function() {
                console.log("reload_page request completed!");
              });
            });
            break;

          case "close_window":
            if (data.result.parameters.windowType == "current") {
              chrome.windows.getLastFocused(function(window) {
                chrome.windows.remove(window.id, function() {
                  console.log("close_window request completed! (single window)");
                });
              });
            }
            break;

          case "remove_links":
            chrome.tabs.query({
              lastFocusedWindow: true,
              active: true
            }, function(tabs) {
              chrome.tabs.reload(tabs[0].id, {
                bypassCache: false
              }, function() {
                console.log("remove_links request completed!");
              });
            });
            break;

          case "restore_window":
            chrome.sessions.restore(function(restoredSession) {
              console.log("restore_window request completed!");
            });
            break;

          case "mute_tab": //new
            chrome.tabs.query({
              lastFocusedWindow: true,
              active: true
            }, function(tabs) {
              chrome.tabs.update(tabs[0].id, {
                muted: true
              }, function() {
                console.log("mute_tab request completed!");
              });
            });
            break;

          case "more_sitessearch":
            var site = data.result.parameters.popSites;
            var query = data.result.parameters.any;
            var url = "";
            switch(site){
              case "quora":
                url = "https://www.quora.com/search?q="+query;
                break;
              case "amazon":
                url = "https://www.amazon.com/s/field-keywords"+query;
                break;
              case "facebook":
                url = "https://www.facebook.com/search/top/?q="+query;
                break;
              case "twitter":
                url = "https://twitter.com/search?q="+query;
                break;
              case "google":
                url = "http://google.com/#q=" + query;
              default:
                //we screwed
            }
            chrome.tabs.create({
              url: url
            }, function(tab) {
              console.log("more_sitessearch request completed!");
            });
            break;
          default:
            chrome.tabs.query({
              currentWindow: true,
              active: true
            }, function(tabs) {
              var params = {
                data: data.result.action
              };
              if (tabs[0].height !== undefined) {
                params.height = tabs[0].height;
              }
              if (data.result.action == "open_link") {
                params.linkNumber = data.result.parameters.link_number;
              }
              if (data.result.action = "type_textboxes") {
                params.boxNumber = data.result.parameters.number;
                params.boxValue = data.result.parameters.any;
              }
              chrome.tabs.sendMessage(tabs[0].id, params, function(response) {
                console.log("response: " + JSON.stringify(response));
              });
            });
        }
        //---
      }
    },
    error: function() {
      return "Internal Server Error";
    }
  });
}
