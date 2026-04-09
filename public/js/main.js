(function() {
  var form = document.getElementById('generateForm');
  var textarea = document.getElementById('inputText');
  var charCount = document.getElementById('charCount');
  var statusEl = document.getElementById('status');
  var btn = document.getElementById('generateBtn');

  var MAX = 10000;
  var MIN = 1;

  var prior = sessionStorage.getItem('originalInput');
  if (prior) textarea.value = prior;
  updateCharCount();

  textarea.addEventListener('input', updateCharCount);

  function updateCharCount() {
    var len = textarea.value.trim().length;
    charCount.textContent = String(len);
    btn.disabled = len < MIN || len > MAX;
    if (len > MAX) {
      setStatus('Too long. Please reduce to 10,000 characters or less.', true);
    } else {
      setStatus('');
    }
  }

  function setStatus(msg, isError) {
    statusEl.textContent = msg || '';
    statusEl.classList.toggle('error', !!isError);
  }

  function setLoading(on) {
    if (on) {
      btn.disabled = true;
      btn.innerHTML = '<span class="loading-spinner"></span> Converting\u2026';
      setStatus('Converting your text into Easy Read format. This may take a moment.');
      statusEl.focus();
    } else {
      btn.disabled = false;
      btn.textContent = 'Generate Easy Read';
    }
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    setStatus('');

    var text = textarea.value.trim();
    if (text.length < MIN || text.length > MAX) {
      setStatus('Please enter between 1 and 10,000 characters.', true);
      return;
    }

    sessionStorage.setItem('originalInput', textarea.value);
    setLoading(true);

    fetch('/api/transform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text })
    })
    .then(function(resp) {
      return resp.text().then(function(raw) {
        var json;
        try { json = JSON.parse(raw); } catch (_) { json = null; }
        if (!resp.ok) {
          throw new Error(json && json.error ? json.error : 'Request failed.');
        }
        return json;
      });
    })
    .then(function(data) {
      if (!data || typeof data.title !== 'string' || !Array.isArray(data.sections)) {
        throw new Error('Invalid response format. Please try again.');
      }
      
      // Auto-save document to get a unique URL
      setStatus('Saving your document...');
      return fetch('/api/save-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          summary: data.summary,
          sections: data.sections,
          originalText: textarea.value
        })
      })
      .then(function(saveResp) {
        if (!saveResp.ok) throw new Error('Failed to save document.');
        return saveResp.json();
      })
      .then(function(saveData) {
        window.location.href = saveData.url;
      });
    })
    .catch(function(err) {
      setStatus(err.message || 'Something went wrong. Please try again.', true);
      setLoading(false);
    });
  });
})();
