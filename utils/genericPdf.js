const PDFDocument = require('pdfkit');
const axios = require('axios');

const fetchImageBuffer = async (url) => {
  if (!url) return null;
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxRedirects: 5,
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error('fetchImageBuffer failed:', error.message);
    return null;
  }
};

const buildTablePDF = async ({ settings, title, meta, headers, rows }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const marginLeft = 30;
      const marginRight = 30;
      const contentWidth = pageWidth - marginLeft - marginRight;

      let contentTop = 30;
      let letterheadRendered = false;

      if (settings?.letterhead) {
        const imgBuffer = await fetchImageBuffer(settings.letterhead);
        if (imgBuffer) {
          try {
            const img = doc.openImage(imgBuffer);
            const scale = pageWidth / img.width;
            const renderedHeight = img.height * scale;
            doc.image(imgBuffer, 0, 0, {
              width: pageWidth,
              height: renderedHeight,
            });
            contentTop = renderedHeight + (settings.printMarginTop || 8) * 2.83465;
            letterheadRendered = true;
          } catch (err) {
            console.error('Failed to place letterhead:', err.message);
          }
        }
      }

      if (!letterheadRendered) {
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#000');
        doc.text(settings?.schoolName || '', marginLeft, contentTop, {
          width: contentWidth,
          align: 'center',
        });
        contentTop = doc.y + 6;

        if (settings?.motto) {
          doc.fontSize(9).font('Helvetica-Oblique').fillColor('#555');
          doc.text(`"${settings.motto}"`, marginLeft, contentTop, {
            width: contentWidth,
            align: 'center',
          });
          contentTop = doc.y + 4;
        }

        const parts = [];
        if (settings?.address) parts.push(settings.address);
        if (settings?.city) parts.push(settings.city);
        if (settings?.phone) parts.push(`Tel: ${settings.phone}`);
        if (parts.length > 0) {
          doc.fontSize(8).font('Helvetica').fillColor('#666');
          doc.text(parts.join(' | '), marginLeft, contentTop, {
            width: contentWidth,
            align: 'center',
          });
          contentTop = doc.y + 6;
        }

        doc
          .strokeColor('#333')
          .lineWidth(1)
          .moveTo(marginLeft, contentTop)
          .lineTo(pageWidth - marginRight, contentTop)
          .stroke();
        contentTop += 10;
      }

      doc.fillColor('#000').fontSize(13).font('Helvetica-Bold');
      doc.text(title, marginLeft, contentTop, {
        width: contentWidth,
        align: 'center',
      });
      contentTop = doc.y + 8;

      if (meta && meta.length > 0) {
        doc.fontSize(8).font('Helvetica').fillColor('#333');
        const metaLine = meta.map((m) => `${m.label}: ${m.value}`).join('   |   ');
        doc.text(metaLine, marginLeft, contentTop, {
          width: contentWidth,
          align: 'center',
        });
        contentTop = doc.y + 12;
      }

      if (!headers || headers.length === 0) {
        doc.end();
        return;
      }

      const headerRowHeight = 22;
      const rowHeight = 20;
      const colCount = headers.length;
      const colWidth = contentWidth / colCount;

      const drawTableHeader = () => {
        const y = contentTop;
        doc.rect(marginLeft, y, contentWidth, headerRowHeight).fill('#e5e7eb');
        doc.fillColor('#000').fontSize(7.5).font('Helvetica-Bold');
        let x = marginLeft;
        headers.forEach((h) => {
          doc.text(h.label, x + 3, y + 7, {
            width: colWidth - 6,
            align: 'left',
            lineBreak: false,
            ellipsis: true,
          });
          x += colWidth;
        });
        doc
          .strokeColor('#333')
          .lineWidth(0.6)
          .rect(marginLeft, y, contentWidth, headerRowHeight)
          .stroke();
        contentTop = y + headerRowHeight;
      };

      drawTableHeader();

      rows.forEach((row, rowIdx) => {
        if (contentTop + rowHeight > pageHeight - 50) {
          doc.addPage();
          contentTop = 40;
          drawTableHeader();
        }

        const y = contentTop;
        if (rowIdx % 2 === 1) {
          doc.rect(marginLeft, y, contentWidth, rowHeight).fill('#fafafa');
        }

        doc.fillColor('#111').fontSize(7.5).font('Helvetica');
        let x = marginLeft;
        headers.forEach((h) => {
          const val = row[h.key];
          doc.text(String(val ?? '-'), x + 3, y + 6, {
            width: colWidth - 6,
            align: 'left',
            lineBreak: false,
            ellipsis: true,
          });
          x += colWidth;
        });

        doc
          .strokeColor('#ddd')
          .lineWidth(0.3)
          .moveTo(marginLeft, y + rowHeight)
          .lineTo(pageWidth - marginRight, y + rowHeight)
          .stroke();

        let vx = marginLeft;
        doc.strokeColor('#ddd').lineWidth(0.3);
        for (let i = 0; i <= colCount; i++) {
          doc.moveTo(vx, y).lineTo(vx, y + rowHeight).stroke();
          vx += colWidth;
        }

        contentTop = y + rowHeight;
      });

      const tableHeight = rows.length * rowHeight + headerRowHeight;
      doc
        .strokeColor('#333')
        .lineWidth(0.6)
        .rect(marginLeft, contentTop - tableHeight, contentWidth, tableHeight)
        .stroke();

      doc.fontSize(7).font('Helvetica').fillColor('#888');
      doc.text(
        settings?.reportFooter ||
          `© ${new Date().getFullYear()} ${settings?.schoolName || ''}`,
        marginLeft,
        pageHeight - 30,
        { width: contentWidth, align: 'center' }
      );

      doc.end();
    } catch (err) {
      console.error('buildTablePDF error:', err);
      reject(err);
    }
  });
};

module.exports = { buildTablePDF, fetchImageBuffer };