/* ============================================================
   Review 18 — 2026-09-03.  The layer over site.js.

   Two things live here rather than in site.js, because neither is
   about what the site knows: el-26 Skeleton, which is about the
   moment before it knows anything, and the spreadsheet export,
   which is about taking a table out of the site altogether.

   Both work off the DOM rather than off the data, deliberately:
   the skeleton copies the geometry of the block it covers, so
   nothing moves when the data lands, and the export copies the
   table that is on the screen, so the file and the page cannot
   disagree about what the filters left.
   ============================================================ */
(function () {
  'use strict';

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* ==========================================================
     1  el-26 Skeleton — the loading state, in place

     Every table, rail and card grid on this site is drawn from
     eight JSON files fetched at boot. Until they land the page
     shows the specimen markup it was built from: Serbia in every
     table, the same four player cards, a news story from the
     mock. For the few hundred milliseconds that takes it reads
     as real content that then changes under the reader.

     The skeleton is laid OVER each block and sized from that
     block's own children, so it is the same height, the same row
     count and the same column positions as what replaces it —
     the design system's note on el-26, honoured by construction
     rather than by measurement.
     ========================================================== */

  /* The blocks worth covering: the ones drawn from the feed. */
  var SKEL = [
    { sel: '.tbl',        kind: 'rows',  child: '.trow' },
    { sel: '.acc',        kind: 'acc',   child: null },
    { sel: '.e03',        kind: 'cards', child: '.e03-sh' },
    { sel: '.e09-grid',   kind: 'cards', child: '.e09-cell' },
    { sel: '.e10',        kind: 'cards', child: '.pcard-sh, .sh' },
    { sel: '.c02',        kind: 'cards', child: '.c02-hcard, .c02-card' },
    { sel: '.e04-stats',  kind: 'stats', child: '.e04-stat' },
    { sel: '.r01',        kind: 'rows',  child: '.r01-row' },
    { sel: '.car',        kind: 'cards', child: '.car-slide' },
    { sel: '.s09-nums',   kind: 'stats', child: '.s09-line' }
  ];

  /* A skeleton bar of a stated height, so a row is a row and a
     card is a card. */
  function bar(cls, w, h) {
    var n = el('div', 'sk ' + cls);
    if (w) n.style.width = w;
    if (h) n.style.height = h;
    return n;
  }

  function rowShape(h) {
    var r = el('div', 'sk-row');
    r.style.height = h + 'px';
    r.appendChild(bar('sk-circle', '24px', '24px'));
    r.appendChild(bar('sk-line', (120 + Math.round(Math.random() * 90)) + 'px'));
    r.appendChild(el('div', 'sk-grow'));
    r.appendChild(bar('sk-line-s', '56px'));
    r.appendChild(bar('sk-line-s', '56px'));
    return r;
  }

  function cardShape(w, h) {
    var c = el('div', 'sk-card');
    c.style.width = w ? w + 'px' : '';
    c.style.height = h ? h + 'px' : '';
    c.appendChild(bar('sk-block', '100%', Math.max(40, Math.round(h * 0.58)) + 'px'));
    c.appendChild(bar('sk-title', '78%'));
    c.appendChild(bar('sk-line', '52%'));
    return c;
  }

  function statShape(w, h) {
    var c = el('div', 'sk-card sk-stat');
    c.style.width = w ? w + 'px' : '';
    c.style.height = h ? h + 'px' : '';
    c.appendChild(bar('sk-line-s', '64%'));
    c.appendChild(bar('sk-title', '46%'));
    return c;
  }

  var covered = [];

  function cover(host, spec) {
    if (!host || host._sk) return;
    var box = host.getBoundingClientRect();
    if (box.height < 24) return;              /* nothing drawn yet */
    host._sk = 1;
    host.classList.add('sk-host');

    var over = el('div', 'sk-over');
    var kids = spec.child ? $$(spec.child, host) : [];

    if (spec.kind === 'rows') {
      var head = $('.thead', host);
      if (head) {
        var hb = el('div', 'sk-head');
        hb.style.height = head.offsetHeight + 'px';
        over.appendChild(hb);
      }
      (kids.length ? kids : [null]).slice(0, 12).forEach(function (k) {
        over.appendChild(rowShape(k ? k.offsetHeight : 56));
      });
    } else if (spec.kind === 'acc') {
      /* An accordion is a head and, when it is open, a table. Both
         are covered as one block of its own height. */
      var h = el('div', 'sk-row');
      h.style.height = Math.min(88, host.offsetHeight) + 'px';
      h.appendChild(bar('sk-line-s', '64px'));
      h.appendChild(bar('sk-title', '220px'));
      h.appendChild(el('div', 'sk-grow'));
      h.appendChild(bar('sk-line-s', '110px'));
      over.appendChild(h);
      var rest = host.offsetHeight - 88;
      if (rest > 60) {
        var n = Math.min(6, Math.round(rest / 56));
        for (var i = 0; i < n; i++) over.appendChild(rowShape(56));
      }
    } else {
      var grid = el('div', spec.kind === 'stats' ? 'sk-statrow' : 'sk-cardrow');
      (kids.length ? kids : []).slice(0, 8).forEach(function (k) {
        grid.appendChild(spec.kind === 'stats'
          ? statShape(k.offsetWidth, k.offsetHeight)
          : cardShape(k.offsetWidth, k.offsetHeight));
      });
      if (!grid.children.length) return;
      over.appendChild(grid);
    }

    host.appendChild(over);
    covered.push(host);
  }

  function install() {
    SKEL.forEach(function (spec) {
      $$(spec.sel).forEach(function (host) {
        /* Never cover a block that is inside another covered one —
           two skeletons stacked read as a fault. */
        if (host.closest('.sk-host')) return;
        try { cover(host, spec); } catch (e) {}
      });
    });
  }

  /* Swept from the document, not from the list of blocks that were
     covered. repeat() clones the first accordion once per stop, and a
     clone carries the skeleton with it — the covered node is thrown
     away and six copies of it are put on the page. Clearing the array
     left every one of them pulsing for ever, which is what "Live now
     never loads" was. (review7 hit this with .rv, review16 with
     display:contents; a clone bringing state along is the recurring
     shape of the bug on this site.) */
  function clear() {
    $$('.sk-over').forEach(function (n) { n.remove(); });
    $$('.sk-host').forEach(function (h) { h.classList.remove('sk-host'); h._sk = 0; });
    covered = [];
  }

  /* Held open on demand, so the state can be shown and screenshotted
     without throttling a network to see it: index.html#skeleton=hold */
  var HOLD = /(?:^|[#&])skeleton=hold\b/.test(location.hash || '');

  install();

  if (HOLD) {
    /* The tables that matter most are rebuilt by site.js, which
       replaces their innerHTML and takes the skeleton with it. For
       the held preview, wait for the render and lay the skeletons
       back over the finished page — which is the truest picture of
       the loading state anyway, because it is the real geometry. */
    if (window.MutationObserver) {
      var hm = new MutationObserver(function () {
        if (!document.body.dataset.rendered) return;
        hm.disconnect();
        setTimeout(function () { clear(); install(); }, 60);
      });
      hm.observe(document.body, { attributes: true, attributeFilter: ['data-rendered'] });
    }
  }

  if (!HOLD) {
    /* site.js stamps body[data-rendered] the moment the page is
       painted; that is the signal, not a timer. */
    if (document.body.dataset.rendered) clear();
    else if (window.MutationObserver) {
      var mo = new MutationObserver(function () {
        if (!document.body.dataset.rendered) return;
        mo.disconnect();
        clear();
        try { mountExports(); } catch (e) { console.error('export', e); }
      });
      mo.observe(document.body, { attributes: true, attributeFilter: ['data-rendered'] });
    }
    /* A fetch that never returns must not leave the page pulsing
       for ever. */
    setTimeout(function () { if (covered.length) clear(); }, 12000);
  }

  /* ==========================================================
     2  Export — a real .xlsx, with no dependency

     Alex asked for Excel. Three ways to give it to him:

       CSV with a BOM       opens anywhere, loses every number's
                            type and every column's width, and is
                            not what was asked for.
       SpreadsheetML 2003   an XML .xls; Excel opens it under a
                            "the format does not match the
                            extension" warning, which is the first
                            thing a federation would see.
       .xlsx                a ZIP of XML parts. It is the format
                            that was asked for and the only one
                            that opens clean.

     An .xlsx is written here directly — a stored (uncompressed)
     ZIP is about sixty lines including a CRC table — rather than
     pulling SheetJS off a CDN. The prototype is served from
     GitHub Pages to reviewers on conference wifi; a table that
     exports without a network round trip is worth the sixty
     lines, and there is no third-party script to vet.
     ========================================================== */

  var CRC_T = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(u8) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function utf8(str) { return new TextEncoder().encode(str); }

  /* A stored-entry ZIP. No compression: an exported table is tens
     of kilobytes and deflate would be the only reason to need a
     library. */
  function zip(files) {
    var parts = [], central = [], offset = 0;
    var d = new Date();
    var dosTime = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() / 2)) & 0xFFFF;
    var dosDate = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;

    function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
    function u16(v) { return [v & 255, (v >>> 8) & 255]; }

    files.forEach(function (f) {
      var name = utf8(f.name), data = utf8(f.data), crc = crc32(data);
      var local = [].concat([0x50, 0x4b, 0x03, 0x04], u16(20), u16(0), u16(0),
        u16(dosTime), u16(dosDate), u32(crc), u32(data.length), u32(data.length),
        u16(name.length), u16(0));
      parts.push(new Uint8Array(local), name, data);
      central.push([].concat([0x50, 0x4b, 0x01, 0x02], u16(20), u16(20), u16(0), u16(0),
        u16(dosTime), u16(dosDate), u32(crc), u32(data.length), u32(data.length),
        u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset)));
      central.push(name);
      offset += local.length + name.length + data.length;
    });

    var cdir = [], cdirLen = 0;
    central.forEach(function (c) {
      var a = (c instanceof Uint8Array) ? c : new Uint8Array(c);
      cdir.push(a); cdirLen += a.length;
    });
    var end = new Uint8Array([].concat([0x50, 0x4b, 0x05, 0x06], u16(0), u16(0),
      u16(files.length), u16(files.length), u32(cdirLen), u32(offset), u16(0)));

    var total = offset + cdirLen + end.length;
    var out = new Uint8Array(total), p = 0;
    parts.forEach(function (a) { out.set(a, p); p += a.length; });
    cdir.forEach(function (a) { out.set(a, p); p += a.length; });
    out.set(end, p);
    return new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  function xesc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      /* Excel rejects the control characters a copied cell can carry. */
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  }
  function colName(i) {
    var s = '';
    i += 1;
    while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = (i - m - 1) / 26; }
    return s;
  }
  /* A figure stays a figure: "67%" and "1 860" are numbers a
     federation will want to sort and sum, and a string column of
     them is the commonest way an export is useless. */
  function cellXml(v, r, c) {
    var ref = colName(c) + r;
    if (v == null || v === '' || v === '—' || v === '-') return '';
    var raw = String(v).trim();
    var num = raw.replace(/[  ,\s]/g, '');
    var pct = /^-?\d+(\.\d+)?%$/.test(num);
    if (pct) {
      return '<c r="' + ref + '" s="1"><v>' + (parseFloat(num) / 100) + '</v></c>';
    }
    if (/^-?\d+(\.\d+)?$/.test(num)) {
      return '<c r="' + ref + '"><v>' + num + '</v></c>';
    }
    return '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' +
           xesc(raw) + '</t></is></c>';
  }

  function sheetXml(rows) {
    var body = rows.map(function (row, i) {
      return '<row r="' + (i + 1) + '">' +
        row.map(function (v, c) { return cellXml(v, i + 1, c); }).join('') + '</row>';
    }).join('');
    var cols = (rows[0] || []).map(function (h, i) {
      var w = Math.max(9, Math.min(28, String(h || '').length + 4));
      return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>';
    }).join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<cols>' + cols + '</cols><sheetData>' + body + '</sheetData></worksheet>';
  }

  function xlsx(sheetName, rows) {
    var name = String(sheetName || 'Sheet1').replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 31);
    return zip([
      { name: '[Content_Types].xml',
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
          '<Default Extension="xml" ContentType="application/xml"/>' +
          '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
          '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
          '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
          '</Types>' },
      { name: '_rels/.rels',
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
          '</Relationships>' },
      { name: 'xl/workbook.xml',
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
          'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
          '<sheets><sheet name="' + xesc(name) + '" sheetId="1" r:id="rId1"/></sheets></workbook>' },
      { name: 'xl/_rels/workbook.xml.rels',
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
          '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
          '</Relationships>' },
      /* One style beyond the default: a percentage, so a win ratio
         reads as 67% and sorts as 0.67. */
      { name: 'xl/styles.xml',
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
          '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>' +
          '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>' +
          '<borders count="1"><border/></borders>' +
          '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
          '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
          '<xf numFmtId="9" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>' +
          '</styleSheet>' },
      { name: 'xl/worksheets/sheet1.xml', data: sheetXml(rows) }
    ]);
  }

  function save(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 400);
  }

  /* ---- reading the table that is on the screen ---------------
     Not the data behind it: whatever the gender switch, the
     conference chips and the search box have left is exactly what
     the file gets, because the file is made from the rows the
     reader can see. A stop cell holds two figures — the finish
     and the points it paid — and becomes two columns, which is
     what makes the export worth opening. */
  function readTable(tbl) {
    var head = $('.thead', tbl);
    var rows = $$('.trow, .wt-row, .r01-row', tbl).filter(function (r) { return !r.hidden; });
    if (!head || !rows.length) return null;

    var headCells = $$(':scope > .cell', head);
    var header = [];
    headCells.forEach(function (c) {
      var t = (c.textContent || '').trim().replace(/\s+/g, ' ');
      if (c.classList.contains('cell-wtstop')) { header.push(t, t + ' PTS'); }
      else header.push(t);
    });

    var out = [header];
    rows.forEach(function (r) {
      var cells = $$(':scope > .cell', r);
      var line = [];
      cells.forEach(function (c, i) {
        var hc = headCells[i];
        if (hc && hc.classList.contains('cell-wtstop')) {
          var st = $('.wt-stack', c);
          if (!st) { line.push('', ''); return; }
          var kids = st.children;
          line.push((kids[0] || {}).textContent || '', (kids[1] || {}).textContent || '');
          return;
        }
        /* A federation cell is a flag, a code and sometimes a
           conference on a second line: the code and the line are
           the two things a spreadsheet wants. */
        var code = $('.ftag-code', c), sub = $('.wt-sub', c), nm = $('.ftag-name', c);
        if (code) {
          /* A WT row states the flag and the code and puts the
             federation's name on the row's title, because twelve
             columns leave no room for it. The file has room. */
          var name = (nm && nm.textContent.trim()) || (r.getAttribute('title') || '').trim();
          line.push([code.textContent.trim(), name, sub ? sub.textContent.trim() : '']
            .filter(Boolean).join(' · '));
          return;
        }
        line.push((c.textContent || '').trim().replace(/\s+/g, ' '));
      });
      while (line.length < header.length) line.push('');
      out.push(line);
    });
    return out;
  }

  /* The filters, as the file name states them. */
  function filterSlug() {
    var bits = [];
    var g = $('.el02-on .lbl') || $('.el02-seg.el02-on .lbl');
    if (g) bits.push(g.textContent.trim());
    var chip = $('.st-conf .chip-on .lbl') || $('.el03 .chip-on .lbl');
    if (chip && !/^all\b/i.test(chip.textContent.trim())) bits.push(chip.textContent.trim());
    $$('.selwrap .sel-lbl, .selwrap .lbl').forEach(function (s) {
      var v = s.textContent.trim();
      if (v && !/^all\b/i.test(v) && bits.indexOf(v) < 0 && v.length < 30) bits.push(v);
    });
    var inp = $('.search input');
    if (inp && inp.value.trim()) bits.push(inp.value.trim());
    var tgl = $('.tgl-on[data-toggle="qualification"]');
    if (tgl) bits.push('qualification');
    if (!bits.length) bits.push('all');
    return bits.join('-').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  }

  function stamp() {
    var d = new Date();
    return d.getFullYear() +
      ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);
  }

  function exportBtn(label) {
    var b = el('button', 'btn btn-outline btn-s cut cut-s cut-out x-export',
      '<div class="cutfill"></div>' +
      '<svg fill="currentColor" height="18" viewBox="0 -960 960 960" width="18" aria-hidden="true">' +
      '<path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"></path>' +
      '</svg><span class="lbl">' + label + '</span>');
    b.type = 'button';
    return b;
  }

  function mount(tbl, table, sheet) {
    if (!tbl || tbl._x) return;
    tbl._x = 1;
    var sec = tbl.closest('.tpl-sub') || tbl.parentElement;
    /* Where a legend runs along the top of the table, the export sits
       at its far end: both are things you read about the table rather
       than parts of it. */
    /* Review 19 — Daniel, of Standings: the legend belongs at the
       right end of the bar on its own, and the export belongs beside
       the control it shares the bar with, next to "Qualification
       only". Where the bar has that control, the button goes there. */
    var tblbar = $('.tblbar', sec);
    var tgl = tblbar && $(':scope > .tgl', tblbar);
    if (tgl) {
      var bx = exportBtn('Export');
      tgl.parentNode.insertBefore(bx, tgl.nextSibling);
      bx.addEventListener('click', function () {
        var rows = readTable(tbl);
        if (!rows) return;
        save(xlsx(sheet || table, rows),
             'fiba-nl-' + table + '-' + filterSlug() + '-' + stamp() + '.xlsx');
      });
      return;
    }
    var legend = $('.legend', sec);
    var right = legend ? null : $('.el01-right', sec);
    if (legend) {
      legend.classList.add('legend-x');
      var b0 = exportBtn('Export');
      legend.appendChild(b0);
      b0.addEventListener('click', function () {
        var rows = readTable(tbl);
        if (!rows) return;
        save(xlsx(sheet || table, rows),
             'fiba-nl-' + table + '-' + filterSlug() + '-' + stamp() + '.xlsx');
      });
      return;
    }
    if (!right) {
      var line = $('.el01', sec);
      if (line) { right = el('div', 'el01-right'); line.appendChild(right); }
    }
    var b = exportBtn('Export');
    if (right) right.appendChild(b);
    else {
      var bar = el('div', 'x-bar');
      bar.appendChild(b);
      sec.insertBefore(bar, tbl.closest('.wt-scroll') || tbl);
    }
    b.addEventListener('click', function () {
      var rows = readTable(tbl);
      if (!rows) return;
      var fname = 'fiba-nl-' + table + '-' + filterSlug() + '-' + stamp() + '.xlsx';
      save(xlsx(sheet || table, rows), fname);
    });
  }

  function mountExports() {
    var page = (document.body.dataset.page || '').split('?')[0];
    if (page === 'stats.html') {
      mount($('.st-perf'), 'teams', 'Team performance');
      var pl = $('[data-pane="players"] .tbl') ||
               ($('[data-pane="players"] .thead') || {}).parentElement;
      mount(pl, 'players', 'Player performance');
    } else if (page === 'standings.html') {
      mount($('.tbl'), 'standings', 'Standings');
    }
  }

  /* Held-open skeletons never reach the render signal, so the
     buttons are mounted directly when the page is already drawn. */
  if (document.body.dataset.rendered) {
    try { mountExports(); } catch (e) { console.error('export', e); }
  }

  window.NL = window.NL || {};
  window.NL.xlsx = { build: xlsx, save: save, read: readTable };
})();
