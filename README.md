# How to get started

1. Clone the repository
  * `git clone git@github.com:AndrewNg/Luna.git`
2. In Google Chrome, open up your extensions page located at chrome://extensions
3. Enable Developer Mode
4. Click "Load Unpacked Extension" and select Luna as the directory
5. If this is your first time using Luna, we have to do a little hack to enable Luna to get access to your microphone
  * First, right click Luna's extension icon and click "Options". You can also get to this page by clicking "Options" on the extension page
  * You should see Luna request access to your microphone. Give her access!
6. Open a new page (say [Google](http://google.com)) and click on Luna's extension icon located on the right side of the navigation bar
7. Say "Luna" and wait for a ding
8. You're good to go! Give it commands like "search for HackPrinceton", "go to CNN", "scroll down", or even "click the link about the Final Four". Quick note—if you don't say anything for more than 10 seconds, Luna will go to sleep because she doesn't want to eavesdrop on you and you'll hear a little swooping sound. Say "Luna" again to wake her up for more commands.

We don't have a great way of shutting Luna completely off right now (she gets attached easily). The easiest way is to go to chrome://extensions and click "view background page" under Luna. Refresh the console window that pops up to turn her off. This is also a good way to reset Luna if you're having any difficulty.

# Commands
Right now Luna supports the following actions:
  * Scrolling (scroll up, scroll down, stop)
  * New tab
  * Close tab
  * Go back
  * Go forward
  * Click link
  * Navigate to a link
  * Look up

Luna is trained using [api.ai](https://api.ai/), so she can process commands in natural language. Try out different commands and let us know which ones work (and don't work)! We'll be adding support for other commands and refining the existing ones in the future.

# Debugging
If you're having trouble getting Luna set up, click on "background page" underneath Luna in [chrome://extensions](chrome://extensions). Send us an email at ajng@princeton.edu with your logs if you're having trouble and we'll try to get you set up!

# Bugs that we know of
* Luna doesn't work out of the box (i.e, on the extension page or a regular new tab page. You have to go to a site first.)
* Closing a tab only works with tabs created after Luna has been initialized
* Commands only work on pages where JavaScript is enabled
* Clicking the extension button again breaks Luna

# Improvements
* An easy way to turn on and turn off Luna (binding an action to pressing the extension button)
* Indication that Luna is working after you click the button
* Identifying text boxes for typing and typing in said boxes
* New extension icon
* Clean up the code (lol)
* Scrolling ends up stopping a bit further than the user intended

For more info, visit our [Devpost page](http://devpost.com/software/lucy).
