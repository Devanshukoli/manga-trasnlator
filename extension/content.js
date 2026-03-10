// Inject floating translator button onto the page
const translateBtn = document.createElement('div');
translateBtn.innerHTML = 'Scan & Translate Manga (LTR)';
translateBtn.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #ff4757;
  color: #fff;
  padding: 12px 20px;
  border-radius: 50px;
  font-family: sans-serif;
  font-weight: bold;
  cursor: pointer;
  z-index: 999999;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  transition: opacity 0.3s;
`;

document.body.appendChild(translateBtn);

// Loading overlay logic
const showOverlay = (text) => {
  let overlay = document.getElementById('manga-trans-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'manga-trans-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8); color: white; z-index: 9999999;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      font-size: 24px; font-family: sans-serif; text-align: center; padding: 40px; box-sizing: border-box;
    `;
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `<button id="manga-trans-close" style="position:absolute;top:20px;right:40px;padding:10px;cursor:pointer;">Close</button><div style="max-width:800px;line-height:1.6;">${text}</div>`;

  document.getElementById('manga-trans-close').onclick = () => {
    overlay.style.display = 'none';
  };
  overlay.style.display = 'flex';
};

translateBtn.addEventListener('click', () => {
  translateBtn.innerHTML = 'Scanning...';

  chrome.runtime.sendMessage({ action: "capture_screen" }, (response) => {
    if (response && response.imageBase64) {
      translateBtn.innerHTML = 'Translating...';

      // Call local backend
      fetch('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageBase64: response.imageBase64 })
      })
        .then(res => res.json())
        .then(data => {
          translateBtn.innerHTML = 'Scan & Translate Manga (LTR)';
          if (data.success) {
            showOverlay(`<h2 style="color:#ffcc00;">English translation:</h2><p>${data.translatedText}</p><hr/><h4 style="color:#aaa;">Original LTR scan:</h4><p style="font-size:16px;">${data.originalText}</p>`);
          } else {
            alert('Error from backend: ' + data.error);
          }
        })
        .catch(err => {
          translateBtn.innerHTML = 'Scan & Translate Manga (LTR)';
          alert('Translation failed. Is the NodeJS backend running on port 3000?');
          console.error(err);
        });
    } else {
      translateBtn.innerHTML = 'Scan & Translate Manga (LTR)';
      alert("Failed to capture screen.");
    }
  });
});
