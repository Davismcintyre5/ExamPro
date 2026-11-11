const buildPageCSS = (settings) => {
  const paperSize = settings?.paperSize || 'A4';
  const orientation = settings?.orientation || 'portrait';

  const paperSizes = {
    A4: { portrait: '210mm 297mm', landscape: '297mm 210mm' },
    A5: { portrait: '148mm 210mm', landscape: '210mm 148mm' },
    Letter: { portrait: '216mm 279mm', landscape: '279mm 216mm' },
  };

  const size = paperSizes[paperSize]?.[orientation] || paperSizes.A4.portrait;

  return `
    @page {
      size: ${size};
      margin: 0;
    }
  `;
};

const buildLetterheadHTML = (settings) => {
  if (!settings?.letterhead) return '';

  return `
    <div class="print-letterhead">
      <img src="${settings.letterhead}" alt="" />
    </div>
    <style>
      .print-letterhead {
        width: 100%;
        display: block;
        page-break-after: avoid;
        page-break-inside: avoid;
        margin: 0;
        padding: 0;
        line-height: 0;
        font-size: 0;
      }
      .print-letterhead img {
        display: block;
        width: 100%;
        height: auto;
        margin: 0;
        padding: 0;
      }
      .has-letterhead .report-header { display: none !important; }
    </style>
  `;
};

const buildBaseStyles = (settings) => {
  const hasLetterhead = Boolean(settings?.letterhead);
  const marginTop = hasLetterhead ? (settings?.printMarginTop || 8) : 20;
  const marginBottom = settings?.printMarginBottom || 15;
  const marginLeft = 15;
  const marginRight = 15;

  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      background: white;
      color: black;
    }

    body {
      font-family: 'Times New Roman', Georgia, serif;
    }

    .print-content {
      padding: ${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }

    th, td {
      border: 1px solid #333;
      padding: 6px 8px;
      text-align: left;
      font-size: 11px;
      vertical-align: top;
    }

    th {
      background-color: #f3f4f6;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.3px;
    }

    .report-header {
      text-align: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #333;
    }

    .report-header .school-name {
      font-size: 20px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .report-header .school-motto {
      font-size: 12px;
      font-style: italic;
      color: #555;
      margin-top: 2px;
    }

    .report-header .school-address {
      font-size: 10px;
      color: #666;
      margin-top: 4px;
      line-height: 1.4;
    }

    .report-title {
      text-align: center;
      font-size: 15px;
      font-weight: bold;
      text-transform: uppercase;
      margin: 12px 0;
      text-decoration: underline;
    }

    .report-meta {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .report-meta span {
      color: #333;
    }

    .report-footer {
      text-align: center;
      margin: 20px ${marginRight}mm 0 ${marginLeft}mm;
      font-size: 10px;
      color: #6b7280;
      border-top: 1px solid #ddd;
      padding-top: 10px;
    }

    .text-green-600 { color: #16a34a !important; }
    .text-blue-600 { color: #2563eb !important; }
    .text-yellow-600 { color: #ca8a04 !important; }
    .text-orange-600 { color: #ea580c !important; }
    .text-red-600 { color: #dc2626 !important; }
    .text-gray-500 { color: #6b7280 !important; }
    .text-gray-900 { color: #111827 !important; }
    .font-medium { font-weight: 500; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-xs { font-size: 10px; }
    .text-sm { font-size: 11px; }
    .uppercase { text-transform: uppercase; }
    .whitespace-nowrap { white-space: nowrap; }
    .grid { display: grid; }
    .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
    .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
    .gap-4 { gap: 16px; }
    .p-4 { padding: 16px; }
    .mb-6 { margin-bottom: 24px; }
    .rounded-lg { border-radius: 8px; }
    .border { border: 1px solid #ddd; }
    .print-hidden { display: none !important; }

    ${hasLetterhead ? '.report-header { display: none !important; }' : ''}

    @media print {
      .print-hidden, button, .no-print { display: none !important; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
      .print-letterhead { page-break-after: avoid; page-break-inside: avoid; }
      ${hasLetterhead ? '.report-header { display: none !important; }' : ''}
    }
  `;
};

const buildPrintDocument = ({ content, settings, title }) => {
  const schoolName = settings?.schoolName || 'Document';
  const reportFooter = settings?.reportFooter || `© ${new Date().getFullYear()} ${schoolName}`;
  const hasLetterhead = Boolean(settings?.letterhead);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title || 'Report'} - ${schoolName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${buildPageCSS(settings)}
    ${buildBaseStyles(settings)}
  </style>
</head>
<body class="${hasLetterhead ? 'has-letterhead' : ''}">
  ${buildLetterheadHTML(settings)}

  <div class="print-content">
    ${content}
  </div>

  <div class="report-footer">
    ${reportFooter}
  </div>

  <script>
    function waitForImages() {
      var imgs = Array.from(document.images);
      if (imgs.length === 0) return Promise.resolve();
      return Promise.all(imgs.map(function(img) {
        if (img.complete) return Promise.resolve();
        return new Promise(function(resolve) {
          img.addEventListener('load', resolve);
          img.addEventListener('error', resolve);
        });
      }));
    }

    window.onload = function() {
      waitForImages().then(function() {
        setTimeout(function() {
          window.print();
        }, 400);
      });
    };
  </script>
</body>
</html>
  `.trim();
};

export const printReport = ({ content, settings, title = 'Report' }) => {
  if (!content) {
    throw new Error('No content provided');
  }

  const html = buildPrintDocument({ content, settings, title });
  const printWindow = window.open('', '_blank', 'width=900,height=700');

  if (!printWindow) {
    throw new Error('Popup blocked. Please allow popups to print.');
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

export const printElement = ({ element, settings, title = 'Report' }) => {
  if (!element) {
    throw new Error('No element provided');
  }
  const content = element.innerHTML;
  printReport({ content, settings, title });
};

export default {
  printReport,
  printElement,
};