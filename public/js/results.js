(function() {
  const pageTitle = document.getElementById('pageTitle');
  const summaryEl = document.getElementById('summary');
  const easyReadEl = document.getElementById('easyRead');
  const copyBtn = document.getElementById('copyAllBtn');
  const backBtn = document.getElementById('backBtn');
  const copyStatus = document.getElementById('copyStatus');

  function setCopyStatus(msg) {
    copyStatus.textContent = msg || '';
  }

  // Focus H1 on load for accessibility
  if (pageTitle && pageTitle.focus) {
    pageTitle.setAttribute('tabindex', '-1');
    pageTitle.focus();
  }

  // Load results from sessionStorage; redirect if missing
  let payload;
  try {
    const raw = sessionStorage.getItem('results');
    if (!raw) {
      window.location.href = '/index.html';
      return;
    }
    payload = JSON.parse(raw);
    if (typeof payload.summary !== 'string' || typeof payload.easyRead !== 'string') {
      window.location.href = '/index.html';
      return;
    }
  } catch (_) {
    window.location.href = '/index.html';
    return;
  }

  // Render text via textContent to avoid HTML injection
  summaryEl.textContent = payload.summary;
  easyReadEl.textContent = payload.easyRead;

  copyBtn.addEventListener('click', async () => {
    const textToCopy = `Summary\n\n${summaryEl.textContent}\n\nEasy Read Version\n\n${easyReadEl.textContent}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyStatus('Copied to clipboard.');
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy All'; setCopyStatus(''); }, 1200);
    } catch (_) {
      setCopyStatus('Copy failed. Select and copy manually.');
    }
  });

  backBtn.addEventListener('click', () => {
    if (payload && typeof payload.originalText === 'string') {
      sessionStorage.setItem('originalInput', payload.originalText);
    }
    window.location.href = '/index.html';
  });
})();
