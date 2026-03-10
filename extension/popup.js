document.addEventListener('DOMContentLoaded', () => {
  const provider = document.getElementById('provider');
  const apiKey = document.getElementById('apiKey');
  const fetchModelsBtn = document.getElementById('fetchModelsBtn');
  const modelContainer = document.getElementById('modelContainer');
  const modelSelect = document.getElementById('modelSelect');
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');

  // Load existing settings from chrome storage on open
  chrome.storage.local.get(['provider', 'apiKey', 'modelOptions', 'selectedModel'], (res) => {
    if (res.provider) provider.value = res.provider;
    if (res.apiKey) apiKey.value = res.apiKey;

    if (res.modelOptions && res.modelOptions.length > 0) {
      populateModels(res.modelOptions, res.selectedModel);
    }
  });

  const showStatus = (text, isError = false) => {
    status.textContent = text;
    status.className = isError ? 'error' : '';
    status.style.display = 'block';
    setTimeout(() => { status.style.display = 'none'; }, 3000);
  };

  const populateModels = (models, selected = null) => {
    modelSelect.innerHTML = '';
    models.forEach(m => {
      const opt = document.createElement('option');
      // Some API models use "models/gemini-pro", strip "models/" if present for cleaner usage
      const rawName = m.name.replace('models/', '');
      opt.value = rawName;
      opt.textContent = m.displayName || rawName;
      modelSelect.appendChild(opt);
    });
    if (selected) {
      modelSelect.value = selected;
    }
    modelContainer.style.display = 'block';
  };

  fetchModelsBtn.addEventListener('click', async () => {
    if (!apiKey.value.trim()) {
      showStatus('Please enter an API key!', true);
      return;
    }

    fetchModelsBtn.textContent = 'Fetching...';
    try {
      const res = await fetch(`http://localhost:3000/api/models?provider=${provider.value}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey.value.trim()}`
        }
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch models');
      }

      populateModels(data.models);

      // Persist the options into storage so we don't have to fetch every time we open the standard extension ui
      chrome.storage.local.set({
        provider: provider.value,
        apiKey: apiKey.value.trim(),
        modelOptions: data.models
      });

      showStatus('Models fetched successfully!');
    } catch (err) {
      showStatus(err.message, true);
    } finally {
      fetchModelsBtn.textContent = 'Fetch Provider Models';
    }
  });

  saveBtn.addEventListener('click', () => {
    if (!modelSelect.value) {
      showStatus('Please select a model first.', true);
      return;
    }

    chrome.storage.local.set({
      selectedModel: modelSelect.value,
      apiKey: apiKey.value.trim(),
      provider: provider.value
    }, () => {
      showStatus('Settings saved!');
    });
  });
});
