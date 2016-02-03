chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
    'innerBounds': {
      'width': 1180,
      'height': 600
    }
  }); 
	
//	chrome.app.tabs.create();
});