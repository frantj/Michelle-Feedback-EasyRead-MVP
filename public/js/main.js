(function() {
  const form = document.getElementById('generateForm');
  const textarea = document.getElementById('inputText');
  const charCount = document.getElementById('charCount');
  const statusEl = document.getElementById('status');
  const btn = document.getElementById('generateBtn');

  const MAX = 10000;
  const MIN = 1;

  // Restore previous input if navigating back
  const prior = sessionStorage.getItem('originalInput');
  if (prior) textarea.value = prior;
  charCount.textContent = String(textarea.value.length);
  btn.disabled = textarea.value.length < MIN || textarea.value.length > MAX;

  textarea.addEventListener('input', () => {
    const len = textarea.value.length;
    charCount.textContent = String(len);
    btn.disabled = len < MIN || len > MAX;
    if (len < MIN) {
      statusEl.textContent = 'Please enter some text to begin.';
    } else if (len > MAX) {
      statusEl.textContent = `Too long. Please reduce to ${MAX} characters or less.`;
    } else {
      statusEl.textContent = '';
    }
  });

  function setStatus(msg) {
    statusEl.textContent = msg || '';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('');

    const text = textarea.value || '';
    const len = text.length;
    if (len < MIN || len > MAX) {
      setStatus(`Please enter between ${MIN} and ${MAX} characters.`);
      return;
    }

    // Save original input for Back navigation
    sessionStorage.setItem('originalInput', text);

    btn.disabled = true;
    setStatus('Processing…');
    statusEl.focus && statusEl.focus();
    try {
      const resp = await fetch('/api/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      // Read body once to avoid double-read errors
      const raw = await resp.text();
      let json;
      try {
        json = raw ? JSON.parse(raw) : null;
      } catch (_) {
        json = null;
      }
      if (!resp.ok) {
        const message = json && json.error ? json.error : (raw || 'Request failed');
        throw new Error(message);
      }
      const data = json;
      // Expect strict JSON contract: { summary, easyRead }
      if (!data || typeof data.summary !== 'string' || typeof data.easyRead !== 'string') {
        throw new Error('Invalid response format.');
      }
      const payload = { summary: data.summary, easyRead: data.easyRead, originalText: text };
      sessionStorage.setItem('results', JSON.stringify(payload));
      window.location.href = '/results.html';
    } catch (err) {
      setStatus(err && err.message ? err.message : 'Something went wrong.');
      btn.disabled = false;
    } finally {
      // leave status text for screen readers
    }
  });
})();
