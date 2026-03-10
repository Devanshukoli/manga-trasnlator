chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "capture_screen") {
    // Capture the visible area of the active page 
    chrome.tabs.captureVisibleTab(null, { format: "jpeg", quality: 90 }, (imageUri) => {
      sendResponse({ imageBase64: imageUri });
    });
    return true; // Indicates we will respond asynchronously
  }
});
