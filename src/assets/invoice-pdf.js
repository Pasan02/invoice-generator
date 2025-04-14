/**
 * invoice-pdf.js
 * Handles PDF generation for the Invoice Generator
 * Uses direct data extraction method instead of HTML-to-canvas
 */

/**
 * Initialize PDF functionality
 */
export function initPDFFunctionality() {
  document.addEventListener('DOMContentLoaded', function() {
    // Find the PDF button and replace it
    const previewPdfBtn = document.getElementById('preview-pdf-btn');
    
    if (previewPdfBtn) {
      // Create a clean button to avoid event handler conflicts
      const newButton = previewPdfBtn.cloneNode(true);
      
      // Add our event listener
      newButton.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        try {
          window.showLoadingOverlay('Generating PDF...');
          
          // Make sure jsPDF is loaded
          await ensureLibrariesLoaded();
          
          // Generate the PDF using our direct method
          await generateDirectPDF();
          
          window.showToast('PDF generated successfully!', 'success');
        } catch (err) {
          console.error('PDF Generation Error:', err);
          window.showToast('Failed to generate PDF: ' + (err.message || 'Unknown error'), 'error');
        } finally {
          window.hideLoadingOverlay();
        }
      });
      
      // Replace the original button
      previewPdfBtn.parentNode.replaceChild(newButton, previewPdfBtn);
    }
  });
}

/**
 * Ensure jsPDF library is loaded
 */
async function ensureLibrariesLoaded() {
  // Check if library is already available
  if (window.jspdf && window.jspdf.jsPDF) {
    window.jsPDF = window.jspdf.jsPDF;
    return;
  }
  
  return new Promise((resolve, reject) => {
    // Load jsPDF
    const jspdfScript = document.createElement('script');
    jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    jspdfScript.async = true;
    
    jspdfScript.onload = function() {
      if (window.jspdf && window.jspdf.jsPDF) {
        window.jsPDF = window.jspdf.jsPDF;
      }
      // Give extra time for initialization
      setTimeout(resolve, 100);
    };
    
    jspdfScript.onerror = function() {
      reject(new Error('Failed to load jsPDF library'));
    };
    
    document.head.appendChild(jspdfScript);
  });
}

/**
 * Generate PDF by directly building the document from invoice data
 * instead of converting HTML to canvas
 */
async function generateDirectPDF() {
  // Get invoice data directly from the preview elements
  const invoiceData = extractInvoiceData();
  
  // Create PDF document
  const pdf = new window.jspdf.jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Add content to the PDF
  buildPdfContent(pdf, invoiceData);
  
  // Save the PDF
  pdf.save(`invoice-${invoiceData.invoiceNumber.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`);
}

/**
 * Extract all necessary invoice data from the preview DOM
 */
function extractInvoiceData() {
  return {
    // Invoice details
    invoiceNumber: document.getElementById('preview-invoice-number').textContent,
    invoiceDate: document.getElementById('preview-invoice-date').textContent,
    dueDate: document.getElementById('preview-due-date').textContent,
    
    // Company details
    senderName: document.getElementById('preview-sender-name').textContent,
    senderAddress: document.getElementById('preview-sender-address').textContent,
    senderContact: document.getElementById('preview-sender-contact').textContent,
    
    // Client details
    clientName: document.getElementById('preview-client-name').textContent,
    clientAddress: document.getElementById('preview-client-address').textContent,
    clientContact: document.getElementById('preview-client-contact').textContent,
    
    // Financial details
    currency: document.getElementById('preview-currency-symbol').textContent,
    subtotal: document.getElementById('preview-subtotal').textContent,
    tax: document.getElementById('preview-tax-total').textContent,
    total: document.getElementById('preview-invoice-total').textContent,
    
    // Additional information
    notes: document.getElementById('preview-notes').textContent,
    
    // Payment details
    includePayment: document.getElementById('bank-details-section').style.display !== 'none',
    bankName: document.getElementById('preview-bank-name').textContent,
    accountHolder: document.getElementById('preview-account-holder').textContent,
    accountNumber: document.getElementById('preview-account-number').textContent,
    routingNumber: document.getElementById('preview-routing-number').textContent,
    
    // Line items
    lineItems: getLineItems(),
    
    // Footer text
    footerMessage: document.getElementById('preview-footer-message')?.textContent || 'We appreciate your business and look forward to serving you again!'
  };
}

/**
 * Extract line items from the preview DOM
 */
function getLineItems() {
  const lineItems = [];
  const rows = document.querySelectorAll('#preview-line-items tr');
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 5) {
      lineItems.push({
        description: cells[0].textContent.trim(),
        quantity: cells[1].textContent.trim(),
        rate: cells[2].textContent.trim(),
        tax: cells[3].textContent.trim(),
        amount: cells[4].textContent.trim()
      });
    }
  });
  
  return lineItems;
}

/**
 * Build the PDF content using the extracted data
 */
function buildPdfContent(pdf, data) {
  // Define constants
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  
  // Start position
  let y = margin;
  const initialY = y; // Store initial Y position for INVOICE title

  // Add logo or company name
  const logoImg = document.querySelector('#preview-logo img');
  if (logoImg) {
    try {
      // Get logo dimensions while keeping aspect ratio
      const maxLogoWidth = 50;
      const maxLogoHeight = 20;
      
      let logoWidth = logoImg.naturalWidth || logoImg.width;
      let logoHeight = logoImg.naturalHeight || logoImg.height;
      
      // Calculate aspect ratio
      if (logoWidth > maxLogoWidth) {
        const ratio = maxLogoWidth / logoWidth;
        logoWidth = maxLogoWidth;
        logoHeight = logoHeight * ratio;
      }
      if (logoHeight > maxLogoHeight) {
        const ratio = maxLogoHeight / logoHeight;
        logoHeight = maxLogoHeight;
        logoWidth = logoWidth * ratio;
      }
      
      // Add image to PDF
      pdf.addImage(logoImg.src, 'PNG', margin, y, logoWidth, logoHeight);
      
      // Add company name below logo with more spacing between logo and name
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(31, 41, 55);
      pdf.text(data.senderName, margin, y + logoHeight + 8); // Increased spacing to 8mm
      
      // Adjust y position to account for logo, company name, and reduced spacing to address
      y += logoHeight + 14; // Adjusted to account for increased space between logo and name, but reduced space to address
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
      // Fallback to company name if logo fails
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text(data.senderName, margin, y + 10);
      y += 16; // Adjust y position for company name without logo
    }
  } else {
    // Use company name as logo
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(data.senderName, margin, y + 10);
    y += 16; // Adjust y position for company name without logo
  }
  
  // Add "INVOICE" title in line with logo
  pdf.setFillColor(249, 250, 251);
  pdf.setDrawColor(229, 231, 235);
  pdf.roundedRect(pageWidth - margin - 40, initialY, 40, 15, 2, 2, 'FD'); // Place at initial Y position
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(79, 70, 229); // Indigo-600
  pdf.text('INVOICE', pageWidth - margin - 20, initialY + 10, { align: 'center' }); // Use initial Y position
  
  // Add sender info with reduced spacing
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(107, 114, 128); // Gray-500
  
  const senderAddressLines = pdf.splitTextToSize(data.senderAddress, 80);
  pdf.text(senderAddressLines, margin, y);
  
  y += senderAddressLines.length * 5 + 5;
  pdf.text(data.senderContact, margin, y);
  
  // Client and Invoice Info (side by side)
  y += 15; // Reduced spacing
  const clientSectionY = y;
  
  // Client section (left side)
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(107, 114, 128);
  pdf.text('BILL TO', margin, y);
  
  // Invoice info box (right side) - aligned with BILL TO text exactly
  const infoBoxWidth = 80;
  const infoBoxHeight = 40;
  const infoBoxX = pageWidth - margin - infoBoxWidth;
  
  // Draw invoice info box aligned exactly with BILL TO text
  pdf.setFillColor(249, 250, 251);
  pdf.setDrawColor(229, 231, 235);
  pdf.roundedRect(infoBoxX, clientSectionY - 5, infoBoxWidth, infoBoxHeight, 2, 2, 'FD'); // Shifted up 5mm to align with BILL TO
  
  y += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(31, 41, 55);
  pdf.text(data.clientName, margin, y);
  
  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(107, 114, 128);
  
  const clientAddressLines = pdf.splitTextToSize(data.clientAddress, 80);
  pdf.text(clientAddressLines, margin, y);
  
  y += clientAddressLines.length * 5 + 5;
  pdf.text(data.clientContact, margin, y);
  
  // Invoice number - adjusted to match the shifted box
  let infoY = clientSectionY + 5; // Adjusted for the shifted box
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(107, 114, 128);
  pdf.text('Invoice #:', infoBoxX + 5, infoY);
  pdf.setTextColor(31, 41, 55);
  pdf.text(data.invoiceNumber, infoBoxX + infoBoxWidth - 5, infoY, { align: 'right' });
  
  // Invoice date
  infoY += 10;
  pdf.setTextColor(107, 114, 128);
  pdf.text('Date:', infoBoxX + 5, infoY);
  pdf.setTextColor(31, 41, 55);
  pdf.text(data.invoiceDate, infoBoxX + infoBoxWidth - 5, infoY, { align: 'right' });
  
  // Due date
  infoY += 10;
  pdf.setTextColor(107, 114, 128);
  pdf.text('Due Date:', infoBoxX + 5, infoY);
  pdf.setTextColor(31, 41, 55);
  pdf.text(data.dueDate, infoBoxX + infoBoxWidth - 5, infoY, { align: 'right' });
  
  // Reset Y position to continue after both sections
  y = Math.max(y, clientSectionY + infoBoxHeight) + 15;
  
  // Line items table
  pdf.setLineWidth(0.1);
  pdf.setDrawColor(229, 231, 235);
  
  // Table headers
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setFillColor(249, 250, 251);
  pdf.setTextColor(107, 114, 128);
  
  const colWidths = [
    contentWidth * 0.4, // Description
    contentWidth * 0.1, // Quantity
    contentWidth * 0.15, // Rate
    contentWidth * 0.15, // Tax
    contentWidth * 0.2  // Amount
  ];
  
  const headers = ['Description', 'Qty', `Rate (${data.currency})`, 'Tax (%)', `Amount (${data.currency})`];
  
  // Draw header background
  pdf.rect(margin, y - 5, contentWidth, 10, 'F');
  
  // Draw header text
  let xPos = margin;
  headers.forEach((header, i) => {
    if (i === 0) {
      pdf.text(header, xPos + 2, y);
    } else {
      pdf.text(header, xPos + colWidths[i] - 2, y, { align: 'right' });
    }
    xPos += colWidths[i];
  });
  
  y += 10;
  
  // Draw line items - this will automatically create a row for each line item in the input
  pdf.setTextColor(31, 41, 55);
  data.lineItems.forEach(item => {
    const descriptionLines = pdf.splitTextToSize(item.description, colWidths[0] - 4);
    const rowHeight = Math.max(descriptionLines.length * 5 + 5, 10);
    
    // Description (left-aligned)
    xPos = margin;
    pdf.text(descriptionLines, xPos + 2, y + 5);
    
    // Quantity (right-aligned)
    xPos += colWidths[0];
    pdf.text(item.quantity, xPos + colWidths[1] - 2, y + 5, { align: 'right' });
    
    // Rate (right-aligned)
    xPos += colWidths[1];
    pdf.text(item.rate.replace(data.currency, ''), xPos + colWidths[2] - 2, y + 5, { align: 'right' });
    
    // Tax (right-aligned)
    xPos += colWidths[2];
    pdf.text(item.tax, xPos + colWidths[3] - 2, y + 5, { align: 'right' });
    
    // Amount (right-aligned)
    xPos += colWidths[3];
    pdf.text(item.amount.replace(data.currency, ''), xPos + colWidths[4] - 2, y + 5, { align: 'right' });
    
    // Draw bottom border
    pdf.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);
    
    y += rowHeight;
  });
  
  // Totals section
  const totalsX = pageWidth - margin - 80;
  y += 10;
  
  // Subtotal
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(107, 114, 128);
  pdf.text('Subtotal:', totalsX, y);
  pdf.setTextColor(31, 41, 55);
  pdf.text(`${data.currency}${data.subtotal}`, pageWidth - margin, y, { align: 'right' });
  
  // Tax
  y += 8;
  pdf.setTextColor(107, 114, 128);
  pdf.text('Tax:', totalsX, y);
  pdf.setTextColor(31, 41, 55);
  pdf.text(`${data.currency}${data.tax}`, pageWidth - margin, y, { align: 'right' });
  
  // Separator line
  y += 4;
  pdf.line(totalsX, y, pageWidth - margin, y);
  
  // Total
  y += 8;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(31, 41, 55);
  pdf.text('Total:', totalsX, y);
  pdf.setTextColor(79, 70, 229);
  pdf.text(`${data.currency}${data.total}`, pageWidth - margin, y, { align: 'right' });
  
  // Notes section as plain text - always add before payment details
  y += 20;
  
  if (data.notes && data.notes !== 'No notes provided.') {
    // Notes title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(31, 41, 55);
    pdf.text('Notes:', margin, y);
    
    // Notes content as plain text lines
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128);
    
    // Split text into lines and render them
    const notesLines = pdf.splitTextToSize(data.notes, contentWidth - 10);
    pdf.text(notesLines, margin, y + 6);
    
    // Adjust position based on actual text height
    y += notesLines.length * 5 + 10;
  }
  
  // Payment details section with reduced spacing - comes after notes section
  if (data.includePayment) {
    // Title for payment details
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(31, 41, 55);
    pdf.text('Payment Details', margin, y);
    
    y += 8; // Reduced spacing
    
    // Create a 2x2 grid for payment details
    const halfWidth = contentWidth / 2 - 5;
    
    // Labels - small, light text
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128);
    
    // First row - labels
    pdf.text('Bank Name', margin, y);
    pdf.text('Account Holder', margin + halfWidth + 10, y);
    
    y += 4; // Reduced spacing
    
    // First row - values
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(31, 41, 55);
    pdf.text(data.bankName, margin, y);
    pdf.text(data.accountHolder, margin + halfWidth + 10, y);
    
    y += 8; // Reduced spacing
    
    // Second row - labels
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128);
    pdf.text('Account Number', margin, y);
    pdf.text('Routing/SWIFT/IBAN', margin + halfWidth + 10, y);
    
    y += 4; // Reduced spacing
    
    // Second row - values
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(31, 41, 55);
    pdf.text(data.accountNumber, margin, y);
    pdf.text(data.routingNumber, margin + halfWidth + 10, y);
    
    y += 10; // Reduced spacing
  }
  
  // Custom thank you message at the bottom - positioned 5mm above the margin
  const footerY = pageHeight - margin - 5; // Positioned 5mm above the bottom margin
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(107, 114, 128);
  pdf.text(data.footerMessage, pageWidth / 2, footerY, { align: 'center' });
}