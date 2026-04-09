(function() {
  var pageTitle = document.getElementById('pageTitle');
  var summaryEl = document.getElementById('summary');
  var contentEl = document.getElementById('easyReadContent');
  var copyBtn = document.getElementById('copyAllBtn');
  var backBtn = document.getElementById('backBtn');
  var copyStatus = document.getElementById('copyStatus');

  var imageMap = {};
  var payload;

  // Focus H1 on load for accessibility
  if (pageTitle) {
    pageTitle.setAttribute('tabindex', '-1');
    pageTitle.focus();
  }

  // All results pages are now permalinks at /doc/:id
  var pathMatch = window.location.pathname.match(/^\/doc\/([a-f0-9]{16})$/);
  if (pathMatch) {
    var docId = pathMatch[1];
    fetch('/api/document/' + docId)
      .then(function(r) {
        if (!r.ok) throw new Error('Document not found');
        return r.json();
      })
      .then(function(data) {
        payload = data;
        loadImageMapAndRender();
      })
      .catch(function() {
        document.body.innerHTML = '<div style="padding:2rem;text-align:center;"><h1>Document Not Found</h1><p><a href="/">Go Home</a></p></div>';
      });
  } else {
    window.location.href = '/';
    return;
  }

  function loadImageMapAndRender() {
    fetch('/api/image-map')
      .then(function(r) { return r.json(); })
      .then(function(map) { imageMap = map; render(); })
      .catch(function() { render(); });
  }

  function render() {
    // Set title
    pageTitle.textContent = payload.title || 'Easy Read Document';
    document.title = payload.title + ' — Easy Read Generator';

    // Render summary
    summaryEl.textContent = payload.summary || '';

    // Render Easy Read sections
    var frag = document.createDocumentFragment();

    payload.sections.forEach(function(section) {
      var sectionDiv = document.createElement('section');
      sectionDiv.className = 'er-section';

      if (section.heading) {
        var h = document.createElement('h2');
        h.className = 'er-section-heading';
        h.textContent = section.heading;
        sectionDiv.appendChild(h);
      }

      (section.sentences || []).forEach(function(sentence) {
        var row = document.createElement('div');
        row.className = 'er-row';

        // Image cell
        var imgCell = document.createElement('div');
        imgCell.className = 'er-image-cell';

        var matched = findImage(sentence.imageKeyword);
        if (matched) {
          var img = document.createElement('img');
          img.src = '/images/library/' + matched.file;
          img.alt = matched.alt;
          img.loading = 'lazy';
          imgCell.appendChild(img);
        } else {
          var placeholder = document.createElement('div');
          placeholder.className = 'er-image-placeholder';
          placeholder.textContent = sentence.imageKeyword || 'image';
          imgCell.appendChild(placeholder);
        }

        // Text cell
        var textCell = document.createElement('div');
        textCell.className = 'er-text-cell';
        textCell.textContent = sentence.text;

        row.appendChild(imgCell);
        row.appendChild(textCell);
        sectionDiv.appendChild(row);
      });

      frag.appendChild(sectionDiv);
    });

    contentEl.innerHTML = '';
    contentEl.appendChild(frag);
  }

  function findImage(keyword) {
    if (!keyword) return null;
    var kw = keyword.toLowerCase().trim();
    // Direct match
    if (imageMap[kw]) return imageMap[kw];
    // Multi-word keyword: try each word
    var words = kw.split(/\s+/);
    for (var w = 0; w < words.length; w++) {
      if (words[w].length > 2 && imageMap[words[w]]) {
        return imageMap[words[w]];
      }
    }
    // Plurals/suffixes: try stripping common endings
    var stems = [kw];
    if (kw.endsWith('s') && kw.length > 3) stems.push(kw.slice(0, -1));
    if (kw.endsWith('ing') && kw.length > 5) stems.push(kw.slice(0, -3));
    if (kw.endsWith('ed') && kw.length > 4) stems.push(kw.slice(0, -2));
    if (kw.endsWith('er') && kw.length > 4) stems.push(kw.slice(0, -2));
    if (kw.endsWith('ly') && kw.length > 4) stems.push(kw.slice(0, -2));
    for (var s = 1; s < stems.length; s++) {
      if (imageMap[stems[s]]) return imageMap[stems[s]];
    }
    return null;
  }

  // Build plain-text version for copy
  function buildCopyText() {
    var lines = [];
    lines.push(payload.title || 'Easy Read Document');
    lines.push('');
    lines.push('Summary');
    lines.push(payload.summary || '');
    lines.push('');
    payload.sections.forEach(function(section) {
      if (section.heading) {
        lines.push(section.heading);
        lines.push('');
      }
      (section.sentences || []).forEach(function(s) {
        lines.push(s.text);
      });
      lines.push('');
    });
    return lines.join('\n').trim();
  }

  copyBtn.addEventListener('click', function() {
    var text = buildCopyText();
    navigator.clipboard.writeText(text).then(function() {
      copyStatus.textContent = 'Copied to clipboard.';
      copyBtn.textContent = 'Copied!';
      
      // Show support section after successful copy
      showSupportSection();
      
      setTimeout(function() {
        copyBtn.textContent = 'Copy All Text';
        copyStatus.textContent = '';
      }, 1500);
    }).catch(function() {
      copyStatus.textContent = 'Copy failed. Please select and copy manually.';
    });
  });

  function showSupportSection() {
    var modal = document.getElementById('supportModal');
    var closeBtn = document.getElementById('closeModal');
    var bmcContainer = document.getElementById('bmcButtonContainer');
    
    if (modal && !modal.classList.contains('show')) {
      modal.classList.add('show');
      
      // Focus trap and close handlers
      closeBtn.focus();
      
      closeBtn.addEventListener('click', closeSupportModal);
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          closeSupportModal();
        }
      });
      
      // ESC key to close
      document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
          closeSupportModal();
          document.removeEventListener('keydown', escHandler);
        }
      });
    }
  }
  
  function closeSupportModal() {
    var modal = document.getElementById('supportModal');
    if (modal) {
      modal.classList.remove('show');
    }
  }

  // Download Word button - creates .docx with images
  var downloadWordBtn = document.getElementById('downloadWordBtn');
  if (downloadWordBtn) {
    downloadWordBtn.addEventListener('click', function() {
      generateWordDocument();
    });
  }

  function generateWordDocument() {
    var html = buildWordHTML();
    var blob = new Blob([html], {
      type: 'application/msword'
    });
    
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    var filename = (payload.title || 'easy-read-document').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.html';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Show instructions modal
    showDownloadInstructions();
  }
  
  function showDownloadInstructions() {
    var modal = document.getElementById('downloadModal');
    var closeBtn = document.getElementById('closeDownloadModal');
    
    if (modal) {
      modal.classList.add('show');
      closeBtn.focus();
      
      closeBtn.addEventListener('click', closeDownloadModal);
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          closeDownloadModal();
        }
      });
      
      document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
          closeDownloadModal();
          document.removeEventListener('keydown', escHandler);
        }
      });
    }
  }
  
  function closeDownloadModal() {
    var modal = document.getElementById('downloadModal');
    if (modal) {
      modal.classList.remove('show');
    }
  }

  function showShareLinkModal(shareUrl) {
    var modal = document.getElementById('shareLinkModal');
    var closeBtn = document.getElementById('closeShareModal');
    var shareUrlInput = document.getElementById('shareUrlInput');
    var copyBtn = document.getElementById('copyShareUrlBtn');
    var confirmation = document.getElementById('shareCopyConfirmation');
    
    if (modal && shareUrlInput) {
      shareUrlInput.value = shareUrl;
      modal.classList.add('show');
      closeBtn.focus();
      
      closeBtn.addEventListener('click', closeShareLinkModal);
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          closeShareLinkModal();
        }
      });
      
      document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
          closeShareLinkModal();
          document.removeEventListener('keydown', escHandler);
        }
      });
      
      copyBtn.addEventListener('click', function() {
        shareUrlInput.select();
        navigator.clipboard.writeText(shareUrl).then(function() {
          confirmation.textContent = '✓ Link copied to clipboard!';
          setTimeout(function() {
            confirmation.textContent = '';
          }, 3000);
        }).catch(function() {
          confirmation.textContent = 'Please copy the link manually';
        });
      });
    }
  }
  
  function closeShareLinkModal() {
    var modal = document.getElementById('shareLinkModal');
    var confirmation = document.getElementById('shareCopyConfirmation');
    if (modal) {
      modal.classList.remove('show');
      if (confirmation) {
        confirmation.textContent = '';
      }
    }
  }

  function buildWordHTML() {
    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><meta charset="utf-8"><title>' + (payload.title || 'Easy Read Document') + '</title>';
    html += '<style>';
    html += 'body { font-family: Arial, sans-serif; font-size: 16pt; line-height: 1.5; }';
    html += 'h1 { font-size: 24pt; font-weight: bold; margin-bottom: 12pt; border-bottom: 3pt solid #f7a823; padding-bottom: 6pt; }';
    html += 'h2 { font-size: 18pt; font-weight: bold; margin-top: 18pt; margin-bottom: 12pt; border-bottom: 2pt solid #f7a823; padding-bottom: 4pt; }';
    html += '.summary { background-color: #fffaed; border-left: 5pt solid #f7a823; padding: 12pt; margin-bottom: 18pt; }';
    html += 'table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }';
    html += 'td { vertical-align: top; padding: 8pt; border-bottom: 1pt solid #e0e0e0; }';
    html += 'td.image-cell { width: 140pt; text-align: center; }';
    html += 'td.text-cell { font-size: 16pt; line-height: 1.6; }';
    html += 'img { max-width: 130pt; max-height: 130pt; }';
    html += '.placeholder { width: 130pt; height: 130pt; background-color: #f5f5f5; border: 1pt solid #ddd; display: flex; align-items: center; justify-content: center; font-size: 10pt; color: #888; font-style: italic; }';
    html += '</style></head><body>';
    
    // Title
    html += '<h1>' + escapeHtml(payload.title || 'Easy Read Document') + '</h1>';
    
    // Summary
    html += '<div class="summary"><h2>Summary</h2><p>' + escapeHtml(payload.summary || '') + '</p></div>';
    
    // Sections
    payload.sections.forEach(function(section) {
      if (section.heading) {
        html += '<h2>' + escapeHtml(section.heading) + '</h2>';
      }
      
      html += '<table>';
      (section.sentences || []).forEach(function(sentence) {
        html += '<tr>';
        
        // Image cell
        html += '<td class="image-cell">';
        var matched = findImage(sentence.imageKeyword);
        if (matched) {
          var imgSrc = window.location.origin + '/images/library/' + matched.file;
          html += '<img src="' + imgSrc + '" alt="' + escapeHtml(matched.alt) + '">';
        } else {
          html += '<div class="placeholder">' + escapeHtml(sentence.imageKeyword || 'image') + '</div>';
        }
        html += '</td>';
        
        // Text cell
        html += '<td class="text-cell">' + escapeHtml(sentence.text) + '</td>';
        html += '</tr>';
      });
      html += '</table>';
    });
    
    html += '</body></html>';
    return html;
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Print button - preserves images
  var printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', function() {
      window.print();
    });
  }

  backBtn.addEventListener('click', function() {
    if (payload && payload.originalText) {
      sessionStorage.setItem('originalInput', payload.originalText);
    }
    window.location.href = '/';
  });

  // Share Link button - copies the current permalink URL
  var shareBtnEl = document.getElementById('shareBtn');
  if (shareBtnEl) {
    shareBtnEl.addEventListener('click', function() {
      var shareUrl = window.location.href;
      showShareLinkModal(shareUrl);
    });
  }
})();
