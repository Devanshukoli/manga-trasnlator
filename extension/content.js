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

let currentAbortController = null;

// Loading overlay logic
const showOverlay = (text, isTranslating = false) => {
  let overlay = document.getElementById('manga-trans-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'manga-trans-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.85); color: white; z-index: 9999999;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      font-size: 24px; font-family: sans-serif; text-align: center; padding: 40px; box-sizing: border-box;
    `;
    document.body.appendChild(overlay);
  }

  let innerHTML = `<div style="max-width:800px;line-height:1.6;margin-bottom:20px;">${text}</div>`;

  if (isTranslating) {
    // Show a pulsing translating state instead of standard close
    innerHTML += `<div style="margin-top: 15px; font-size: 16px; color: #ffeb3b;">API is currently processing your request...</div>
                  <button id="manga-trans-cancel" style="margin-top:20px;padding:10px 20px;cursor:pointer;background:#e84118;color:#fff;border:none;border-radius:5px;font-size:18px;font-weight:bold;">Cancel Translation</button>`;
  } else {
    innerHTML += `<button id="manga-trans-close" style="position:absolute;top:20px;right:40px;padding:10px;cursor:pointer;">Close</button>`;
  }

  overlay.innerHTML = innerHTML;

  if (isTranslating) {
    document.getElementById('manga-trans-cancel').onclick = () => {
      if (currentAbortController) {
        currentAbortController.abort();
      }
      overlay.style.display = 'none';
      translateBtn.innerHTML = 'Scan & Translate Manga (LTR)';
      translateBtn.style.pointerEvents = 'auto';
      translateBtn.style.opacity = '1';
    };
  } else {
    document.getElementById('manga-trans-close').onclick = () => {
      overlay.style.display = 'none';
    };
  }

  overlay.style.display = 'flex';
};

translateBtn.addEventListener('click', () => {
  if (translateBtn.innerHTML === 'Scanning...' || translateBtn.innerHTML === 'Translating...') {
    return; // prevent double clicks
  }

  translateBtn.innerHTML = 'Scanning...';
  translateBtn.style.pointerEvents = 'none';
  translateBtn.style.opacity = '0.7';

  chrome.runtime.sendMessage({ action: "capture_screen" }, (response) => {
    if (response && response.imageBase64) {
      translateBtn.innerHTML = 'Translating...';

      showOverlay(`<h2 style="color:#00a8ff;">🔄 Extracting & Translating...</h2>`, true);

      currentAbortController = new AbortController();
      const signal = currentAbortController.signal;

      chrome.storage.local.get(['apiKey', 'provider', 'selectedModel'], (settings) => {
        // Call local backend
        fetch('http://localhost:3000/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            imageBase64: response.imageBase64,
            apiKey: settings.apiKey,
            provider: settings.provider,
            model: settings.selectedModel
          }),
          signal: signal
        })
          .then(res => res.json().then(data => ({ status: res.status, ok: res.ok, data })))
          .then(({ status, ok, data }) => {
            translateBtn.innerHTML = 'Scan & Translate Manga (LTR)';
            translateBtn.style.pointerEvents = 'auto';
            translateBtn.style.opacity = '1';

            if (ok && data.success) {
              showOverlay(`<h2 style="color:#ffcc00;">English translation:</h2><p>${data.translatedText}</p><hr/><h4 style="color:#aaa;">Original LTR scan:</h4><p style="font-size:16px;">${data.originalText}</p>`);
            } else {
              // Render the error in the overlay with a copy button
              const errorText = data.details || data.error || 'Unknown error occurred.';
              const fullErrorString = `Status: ${status}\nError: ${data.error}\nDetails: ${errorText}`;

              showOverlay(`
                <h2 style="color:#e84118;">❌ Translation Failed</h2>
                <p style="color:#ffb8b8; font-size: 18px;">${data.error || 'The server responded with an error.'}</p>
                <div style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 5px; text-align: left; font-size: 14px; overflow-x: auto; margin-top: 15px;">
                  <code id="manga-error-text" style="color: #ff9f43; white-space: pre-wrap;">${fullErrorString}</code>
                </div>
                <button id="manga-copy-error" style="margin-top: 20px; padding: 10px 20px; background: #686de0; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                  📋 Copy Error Text
                </button>
              `);

              // Add copy functionality
              setTimeout(() => {
                const copyBtn = document.getElementById('manga-copy-error');
                if (copyBtn) {
                  copyBtn.onclick = () => {
                    navigator.clipboard.writeText(fullErrorString).then(() => {
                      copyBtn.innerHTML = '✅ Copied!';
                      setTimeout(() => copyBtn.innerHTML = '📋 Copy Error Text', 2000);
                    });
                  };
                }
              }, 100);
            }
          })
          .catch(err => {
            translateBtn.innerHTML = 'Scan & Translate Manga (LTR)';
            translateBtn.style.pointerEvents = 'auto';
            translateBtn.style.opacity = '1';

            if (err.name === 'AbortError') {
              console.log('Translation aborted by user');
            } else {
              const errorString = err.toString();
              showOverlay(`
                <h2 style="color:#e84118;">❌ Fetch Failed</h2>
                <p style="color:#ffb8b8; font-size: 18px;">Could not connect to the local backend. Is Node running on port 3000?</p>
                <div style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 5px; text-align: left; font-size: 14px; overflow-x: auto; margin-top: 15px;">
                  <code id="manga-error-text" style="color: #ff9f43; white-space: pre-wrap;">${errorString}</code>
                </div>
                <button id="manga-copy-error" style="margin-top: 20px; padding: 10px 20px; background: #686de0; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                  📋 Copy Error Text
                </button>
              `);

              setTimeout(() => {
                const copyBtn = document.getElementById('manga-copy-error');
                if (copyBtn) {
                  copyBtn.onclick = () => {
                    navigator.clipboard.writeText(errorString).then(() => {
                      copyBtn.innerHTML = '✅ Copied!';
                      setTimeout(() => copyBtn.innerHTML = '📋 Copy Error Text', 2000);
                    });
                  };
                }
              }, 100);
              console.error(err);
            }
          });
      });
    } else {
      translateBtn.innerHTML = 'Scan & Translate Manga (LTR)';
      translateBtn.style.pointerEvents = 'auto';
      translateBtn.style.opacity = '1';
      alert("Failed to capture screen.");
    }
  });
});
