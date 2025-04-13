/**
 * Invoice Preview Handler
 * Manages interactions with the invoice preview page (buttons, dropdown, etc.)
 */

// Initialize the preview functionality
export function initInvoicePreview() {
  document.addEventListener('DOMContentLoaded', function() {
    initDropdownMenu();
    initBackToEditButton();
    initPDFExport();
    initPrintFunctionality();
    initQRCodeGeneration();
    initShareInvoice();
    initImageExport();
    initCopyToNewInvoice();
    initStatusChange();
  });
}

// Initialize dropdown menu functionality
function initDropdownMenu() {
  const moreActionsBtn = document.getElementById('more-actions-btn');
  const dropdownMenu = document.getElementById('dropdown-menu');
  
  if (moreActionsBtn && dropdownMenu) {
    moreActionsBtn.addEventListener('click', function() {
      dropdownMenu.classList.toggle('hidden');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!moreActionsBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.add('hidden');
      }
    });
  }
}

// Initialize back to edit button
function initBackToEditButton() {
  const backToEditBtn = document.getElementById('back-to-edit');
  
  if (backToEditBtn) {
    backToEditBtn.addEventListener('click', function() {
      const invoiceForm = document.getElementById('invoice-form')?.closest('.mb-10');
      const invoicePreview = document.getElementById('invoice-preview');
      
      if (invoiceForm && invoicePreview) {
        invoicePreview.classList.add('hidden');
        invoiceForm.classList.remove('hidden');
        invoiceForm.classList.add('animate-fade-in');
      }
    });
  }
}

// Initialize PDF export functionality
function initPDFExport() {
  const previewPdfBtn = document.getElementById('preview-pdf-btn');
  
  if (previewPdfBtn) {
    previewPdfBtn.addEventListener('click', async function() {
      // Show loading overlay
      showLoadingOverlay();
      
      try {
        // Make sure necessary libraries are loaded
        if (!window.jsPDF) {
          await loadPDFLibraries();
        }
        
        // Generate the PDF
        await generatePDF();
        
        // Hide loading overlay
        hideLoadingOverlay();
      } catch (err) {
        console.error('Error generating PDF:', err);
        hideLoadingOverlay();
        alert('Failed to generate PDF. Please try again.');
      }
    });
  }
}

// Generate PDF from the invoice preview
async function generatePDF() {
  // Show loading overlay
  showLoadingOverlay('Generating PDF...');
  
  try {
    // Get invoice data from the preview
    const invoiceNumber = document.getElementById('preview-invoice-number').textContent;
    const invoiceDate = document.getElementById('preview-invoice-date').textContent;
    const dueDate = document.getElementById('preview-due-date').textContent;
    const senderName = document.getElementById('preview-sender-name').textContent;
    const senderAddress = document.getElementById('preview-sender-address').textContent;
    const senderContact = document.getElementById('preview-sender-contact').textContent;
    const clientName = document.getElementById('preview-client-name').textContent;
    const clientAddress = document.getElementById('preview-client-address').textContent;
    const clientContact = document.getElementById('preview-client-contact').textContent;
    const subtotal = document.getElementById('preview-subtotal').textContent;
    const tax = document.getElementById('preview-tax-total').textContent;
    const total = document.getElementById('preview-invoice-total').textContent;
    const currencySymbol = document.getElementById('preview-currency-symbol').textContent;
    const notes = document.getElementById('preview-notes').textContent;
    
    // Check if logo exists
    const logoElement = document.querySelector('#preview-logo img');
    let logoDataUrl = null;
    if (logoElement) {
      try {
        // Convert logo to data URL
        const canvas = document.createElement('canvas');
        canvas.width = logoElement.width;
        canvas.height = logoElement.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(logoElement, 0, 0, logoElement.width, logoElement.height);
        logoDataUrl = canvas.toDataURL('image/png');
      } catch (e) {
        console.error('Failed to load logo:', e);
      }
    }
    
    // Create new PDF document with proper dimensions to match preview
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
    });
    
    // Document constants - adjusted for better margins
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20; // Increased margin for better layout
    const contentWidth = pageWidth - margin * 2;
    
    // Set starting Y position
    let currentY = margin;
    
    // HEADER SECTION - LOGO AND TITLE
    // Add logo and title section in a flex-like layout
    
    // Add logo if available (left side)
    if (logoDataUrl) {
      // Calculate logo dimensions to maintain aspect ratio while limiting size
      const maxLogoWidth = 50;
      const maxLogoHeight = 25;
      
      let logoWidth = logoElement.width;
      let logoHeight = logoElement.height;
      
      // Scale down if needed
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
      
      pdf.addImage(logoDataUrl, 'PNG', margin, currentY, logoWidth, logoHeight);
    } else if (senderName) {
      // If no logo, use company name as logo
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(31, 41, 55); // Gray-800
      pdf.text(senderName, margin, currentY + 10);
    }
    
    // Add INVOICE title on the right (matching the preview styling)
    pdf.setFillColor(249, 250, 251); // Gray-50
    pdf.setDrawColor(229, 231, 235); // Gray-200
    pdf.roundedRect(pageWidth - margin - 50, currentY, 50, 25, 2, 2, 'FD');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(79, 70, 229); // Indigo-600 - matching the preview
    pdf.text('INVOICE', pageWidth - margin - 25, currentY + 15, { align: 'center' });
    
    // Advance Y position
    currentY += 35;
    
    // SENDER INFORMATION
    // Add sender information under the logo
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128); // Gray-500
    
    // Add sender address with text wrapping
    const senderAddressLines = pdf.splitTextToSize(senderAddress, 80);
    pdf.text(senderAddressLines, margin, currentY);
    
    // Calculate position for sender contact
    const senderAddressHeight = senderAddressLines.length * 5;
    currentY += senderAddressHeight + 5;
    
    // Add sender contact info
    pdf.text(senderContact, margin, currentY);
    
    // Move down for client and invoice info
    currentY += 20;
    
    // CLIENT AND INVOICE INFO SECTION (SIDE BY SIDE)
    // Left side: Bill To section
    const billToStartY = currentY;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128); // Gray-500
    pdf.text('BILL TO', margin, billToStartY);
    
    currentY += 6;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(31, 41, 55); // Gray-800
    pdf.text(clientName, margin, currentY);
    
    currentY += 6;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128); // Gray-500
    
    // Add client address with text wrapping
    const clientAddressLines = pdf.splitTextToSize(clientAddress, 80);
    pdf.text(clientAddressLines, margin, currentY);
    
    // Calculate position for client contact
    const clientAddressHeight = clientAddressLines.length * 5;
    currentY += clientAddressHeight + 5;
    
    // Add client contact info
    pdf.text(clientContact, margin, currentY);
    
    // Right side: Invoice Info in a box
    // Position the info box at the same Y level as the "Bill To" section
    const infoBoxWidth = 75;
    const infoBoxHeight = 40;
    const infoBoxX = pageWidth - margin - infoBoxWidth;
    
    // Create a box with rounded corners
    pdf.setFillColor(249, 250, 251); // Gray-50
    pdf.setDrawColor(229, 231, 235); // Gray-200
    pdf.roundedRect(infoBoxX, billToStartY - 2, infoBoxWidth, infoBoxHeight, 2, 2, 'FD');
    
    // Add invoice info labels and values in the box
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128); // Gray-500
    
    let infoY = billToStartY + 10;
    
    // Invoice number
    pdf.text('Invoice #:', infoBoxX + 5, infoY);
    pdf.setTextColor(31, 41, 55); // Gray-800
    pdf.setFont('helvetica', 'normal');
    pdf.text(invoiceNumber, infoBoxX + infoBoxWidth - 5, infoY, { align: 'right' });
    
    infoY += 10;
    
    // Invoice date
    pdf.setTextColor(107, 114, 128); // Gray-500
    pdf.setFont('helvetica', 'normal');
    pdf.text('Date:', infoBoxX + 5, infoY);
    pdf.setTextColor(31, 41, 55); // Gray-800
    pdf.setFont('helvetica', 'normal');
    pdf.text(invoiceDate, infoBoxX + infoBoxWidth - 5, infoY, { align: 'right' });
    
    infoY += 10;
    
    // Due date
    pdf.setTextColor(107, 114, 128); // Gray-500
    pdf.setFont('helvetica', 'normal');
    pdf.text('Due Date:', infoBoxX + 5, infoY);
    pdf.setTextColor(31, 41, 55); // Gray-800
    pdf.setFont('helvetica', 'normal');
    pdf.text(dueDate, infoBoxX + infoBoxWidth - 5, infoY, { align: 'right' });
    
    // LINE ITEMS SECTION
    // Reset Y position to continue after both client info and invoice info
    currentY = Math.max(currentY, billToStartY + infoBoxHeight) + 15;
    
    // Get table data from the DOM
    const tableRows = [];
    const lineItems = document.querySelectorAll('#preview-line-items tr');
    lineItems.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length) {
        tableRows.push([
          cells[0].textContent.trim(), // Description
          cells[1].textContent.trim(), // Qty
          cells[2].textContent.trim().replace(currencySymbol, ''), // Rate (remove currency symbol)
          cells[3].textContent.trim(), // Tax %
          cells[4].textContent.trim().replace(currencySymbol, '') // Amount (remove currency symbol)
        ]);
      }
    });
    
    // Add table headers and data with currency symbol in header
    pdf.autoTable({
      startY: currentY,
      head: [[
        'Description', 
        'Qty', 
        `Rate (${currencySymbol})`, 
        'Tax (%)', 
        `Amount (${currencySymbol})`
      ]],
      body: tableRows,
      theme: 'plain',
      headStyles: {
        fillColor: [249, 250, 251], // Gray-50
        textColor: [107, 114, 128], // Gray-500
        fontStyle: 'normal',
        fontSize: 9,
        cellPadding: 6,
      },
      styles: {
        lineColor: [229, 231, 235], // Gray-200
        lineWidth: 0.1,
        fontSize: 10,
        cellPadding: 6,
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'right', cellWidth: 20 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 35 },
      },
      margin: { left: margin, right: margin },
    });
    
    // TOTALS SECTION
    // Get the Y position after the table
    currentY = pdf.previousAutoTable.finalY + 15;
    
    // Add totals section (right-aligned)
    const totalsWidth = 75;
    const totalsX = pageWidth - margin - totalsWidth;
    
    // Subtotal
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128); // Gray-500
    pdf.text('Subtotal:', totalsX, currentY);
    
    pdf.setTextColor(31, 41, 55); // Gray-800
    pdf.text(`${currencySymbol}${subtotal}`, pageWidth - margin, currentY, { align: 'right' });
    
    // Tax amount
    currentY += 8;
    pdf.setTextColor(107, 114, 128); // Gray-500
    pdf.text('Tax:', totalsX, currentY);
    
    pdf.setTextColor(31, 41, 55); // Gray-800
    pdf.text(`${currencySymbol}${tax}`, pageWidth - margin, currentY, { align: 'right' });
    
    // Separator line
    currentY += 4;
    pdf.setDrawColor(229, 231, 235); // Gray-200
    pdf.setLineWidth(0.1);
    pdf.line(totalsX, currentY, pageWidth - margin, currentY);
    
    // Total
    currentY += 8;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(31, 41, 55); // Gray-800
    pdf.text('Total:', totalsX, currentY);
    
    pdf.setTextColor(79, 70, 229); // Indigo-600 - matches the preview
    pdf.text(`${currencySymbol}${total}`, pageWidth - margin, currentY, { align: 'right' });
    
    // NOTES SECTION
    currentY += 25;
    
    // Add notes if they exist
    if (notes && notes !== 'No notes provided.') {
      pdf.setFillColor(249, 250, 251); // Gray-50 - matches the preview background
      pdf.setDrawColor(229, 231, 235); // Gray-200
      
      // Calculate notes height based on content
      const notesLines = pdf.splitTextToSize(notes, contentWidth - 20);
      const notesHeight = Math.min(Math.max(notesLines.length * 5 + 20, 40), 60);
      
      // Draw notes box with proper positioning
      pdf.roundedRect(margin, currentY, contentWidth, notesHeight, 2, 2, 'FD');
      
      // Notes title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(31, 41, 55); // Gray-800
      pdf.text('Notes', margin + 8, currentY + 12);
      
      // Notes content
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128); // Gray-500
      pdf.text(notesLines, margin + 8, currentY + 20);
      
      // Advance position
      currentY += notesHeight + 15;
    }
    
    // PAYMENT DETAILS SECTION
    const bankDetailsSection = document.getElementById('bank-details-section');
    if (bankDetailsSection && bankDetailsSection.style.display !== 'none') {
      const bankName = document.getElementById('preview-bank-name').textContent;
      const accountHolder = document.getElementById('preview-account-holder').textContent;
      const accountNumber = document.getElementById('preview-account-number').textContent;
      const routingNumber = document.getElementById('preview-routing-number').textContent;
      
      // Title for payment details
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(31, 41, 55); // Gray-800
      pdf.text('Payment Details', margin, currentY);
      
      currentY += 10;
      
      // Create a 2x2 grid for payment details
      const halfWidth = contentWidth / 2 - 5;
      
      // Labels - small, light text
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128); // Gray-500
      
      // First row - labels
      pdf.text('Bank Name', margin, currentY);
      pdf.text('Account Holder', margin + halfWidth + 10, currentY);
      
      currentY += 5;
      
      // First row - values
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(31, 41, 55); // Gray-800
      pdf.text(bankName, margin, currentY);
      pdf.text(accountHolder, margin + halfWidth + 10, currentY);
      
      currentY += 12;
      
      // Second row - labels
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128); // Gray-500
      pdf.text('Account Number', margin, currentY);
      pdf.text('Routing/SWIFT/IBAN', margin + halfWidth + 10, currentY);
      
      currentY += 5;
      
      // Second row - values
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(31, 41, 55); // Gray-800
      pdf.text(accountNumber, margin, currentY);
      pdf.text(routingNumber, margin + halfWidth + 10, currentY);
      
      currentY += 15;
    }
    
    // THANK YOU MESSAGE
    // Position at the bottom of the page
    const bottomY = pageHeight - margin;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128); // Gray-500
    pdf.text('Thank you for your business!', pageWidth / 2, bottomY - 10, { align: 'center' });
    
    pdf.setFontSize(8);
    pdf.text('Generated with InvoiceCloud', pageWidth / 2, bottomY - 5, { align: 'center' });
    
    // Save the PDF
    const sanitizedInvoiceNumber = invoiceNumber.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    pdf.save(`invoice-${sanitizedInvoiceNumber}.pdf`);
    
  } catch (err) {
    console.error('Error generating PDF:', err);
    alert('Failed to generate PDF. Please try again.');
  } finally {
    // Hide loading overlay
    hideLoadingOverlay();
  }
}

// Load PDF libraries if they're not already loaded
async function loadPDFLibraries() {
  // Check if libraries are loaded
  if (!window.jspdf) {
    window.jspdf = await import('jspdf');
    await import('jspdf-autotable');
  }
}

// Initialize print functionality
function initPrintFunctionality() {
  const previewPrintBtn = document.getElementById('preview-print-btn');
  
  if (previewPrintBtn) {
    previewPrintBtn.addEventListener('click', function() {
      window.print();
    });
  }
}

// Initialize QR code generation
function initQRCodeGeneration() {
  const generateQrBtn = document.getElementById('generate-qr-btn');
  const qrCodeContainer = document.getElementById('qr-code-container');
  const closeQrCodeBtn = document.getElementById('close-qr-code');
  
  if (generateQrBtn && qrCodeContainer && closeQrCodeBtn) {
    generateQrBtn.addEventListener('click', async function() {
      // Close dropdown
      document.getElementById('dropdown-menu')?.classList.add('hidden');
      
      // Display the QR code modal
      qrCodeContainer.classList.remove('hidden');
      
      // Set invoice number in QR modal
      const invoiceNumber = document.getElementById('preview-invoice-number').textContent;
      document.getElementById('qr-invoice-number').textContent = invoiceNumber;
      
      try {
        // Load QR code library if not already loaded
        if (!window.QRCode) {
          window.QRCode = await import('qrcode');
        }
        
        // Generate QR code with payment information
        const currency = document.getElementById('preview-currency-symbol').textContent;
        const amount = document.getElementById('preview-invoice-total').textContent;
        const companyName = document.getElementById('preview-sender-name').textContent;
        
        const qrData = {
          invoiceNumber,
          amount: `${amount} ${currency}`,
          issuer: companyName,
          date: document.getElementById('preview-invoice-date').textContent,
          client: document.getElementById('preview-client-name').textContent
        };
        
        const qrDataString = JSON.stringify(qrData);
        const qrCodeEl = document.getElementById('qr-code');
        qrCodeEl.innerHTML = '';
        
        // Generate the QR code
        const canvas = document.createElement('canvas');
        await QRCode.toCanvas(
          canvas, 
          qrDataString, 
          { 
            width: 256, 
            margin: 1, 
            color: { 
              dark: '#000', 
              light: '#fff' 
            } 
          }
        );
        qrCodeEl.appendChild(canvas);
      } catch (err) {
        console.error('Error generating QR code:', err);
        document.getElementById('qr-code').innerHTML = `
          <div class="w-64 h-64 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <p class="text-gray-500 dark:text-gray-400">QR Code Generation Failed</p>
          </div>
        `;
      }
    });
    
    closeQrCodeBtn.addEventListener('click', function() {
      qrCodeContainer.classList.add('hidden');
    });
  }
}

// Initialize share invoice functionality
function initShareInvoice() {
  const shareInvoiceBtn = document.getElementById('share-invoice-btn');
  const shareInvoiceModal = document.getElementById('share-invoice-modal');
  const closeShareModalBtn = document.getElementById('close-share-modal');
  
  if (shareInvoiceBtn && shareInvoiceModal && closeShareModalBtn) {
    shareInvoiceBtn.addEventListener('click', function() {
      shareInvoiceModal.classList.remove('hidden');
      
      // Set a shareable link
      const invoiceNumber = document.getElementById('preview-invoice-number').textContent;
      const shareLink = `https://invoice-cloud.example.com/i/${invoiceNumber.replace(/\s/g, '')}`;
      document.getElementById('share-link').value = shareLink;
      
      // If Web Share API is available, enable sharing through that
      if (navigator.share) {
        const shareNativeBtn = document.createElement('button');
        shareNativeBtn.textContent = 'Share using device';
        shareNativeBtn.className = 'w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg';
        shareNativeBtn.addEventListener('click', async () => {
          try {
            await navigator.share({
              title: `Invoice ${invoiceNumber}`,
              text: `Invoice ${invoiceNumber} for ${document.getElementById('preview-client-name').textContent}`,
              url: shareLink
            });
          } catch (err) {
            console.error('Error sharing:', err);
          }
        });
        
        // Add to modal
        const actionsDiv = document.querySelector('#share-invoice-modal > div');
        if (!document.getElementById('native-share-btn') && actionsDiv) {
          shareNativeBtn.id = 'native-share-btn';
          actionsDiv.appendChild(shareNativeBtn);
        }
      }
    });
    
    closeShareModalBtn.addEventListener('click', function() {
      shareInvoiceModal.classList.add('hidden');
    });
    
    // Copy link button
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const shareLinkInput = document.getElementById('share-link');
    
    if (copyLinkBtn && shareLinkInput) {
      copyLinkBtn.addEventListener('click', function() {
        shareLinkInput.select();
        
        // Use modern clipboard API if available
        if (navigator.clipboard) {
          navigator.clipboard.writeText(shareLinkInput.value)
            .then(() => {
              copyLinkBtn.textContent = 'Copied!';
              setTimeout(() => {
                copyLinkBtn.textContent = 'Copy';
              }, 2000);
            })
            .catch(err => {
              console.error('Failed to copy:', err);
              // Fallback
              document.execCommand('copy');
              copyLinkBtn.textContent = 'Copied!';
              setTimeout(() => {
                copyLinkBtn.textContent = 'Copy';
              }, 2000);
            });
        } else {
          // Fallback for older browsers
          document.execCommand('copy');
          copyLinkBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyLinkBtn.textContent = 'Copy';
          }, 2000);
        }
      });
    }
    
    // Send email button
    const sendEmailBtn = document.getElementById('send-email-btn');
    
    if (sendEmailBtn) {
      sendEmailBtn.addEventListener('click', function() {
        const email = document.getElementById('share-email').value;
        if (!email) {
          alert('Please enter an email address');
          return;
        }
        
        const invoiceNumber = document.getElementById('preview-invoice-number').textContent;
        const senderName = document.getElementById('preview-sender-name').textContent;
        const clientName = document.getElementById('preview-client-name').textContent;
        const amount = document.getElementById('preview-invoice-total').textContent;
        const currency = document.getElementById('preview-currency-symbol').textContent;
        
        // Create mailto link
        const subject = encodeURIComponent(`Invoice ${invoiceNumber} from ${senderName}`);
        const body = encodeURIComponent(`Dear ${clientName},\n\nPlease find your invoice ${invoiceNumber} for ${currency}${amount} at the following link:\n\n${shareLinkInput.value}\n\nThank you for your business.\n\nBest regards,\n${senderName}`);
        
        // Open default email client with prefilled information
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
        
        // Close modal after attempting to send
        shareInvoiceModal.classList.add('hidden');
      });
    }
  }
}

// Initialize image export functionality
function initImageExport() {
  const downloadImageBtn = document.getElementById('download-image-btn');
  
  if (downloadImageBtn) {
    downloadImageBtn.addEventListener('click', async function() {
      try {
        // Close dropdown
        document.getElementById('dropdown-menu')?.classList.add('hidden');
        
        // Show loading indicator
        showLoadingOverlay('Generating image...');
        
        // Load html2canvas library if not already loaded
        if (!window.html2canvas) {
          window.html2canvas = (await import('html2canvas')).default;
        }
        
        // Capture the invoice
        const invoiceElement = document.querySelector('.invoice-container');
        if (!invoiceElement) {
          throw new Error('Invoice element not found');
        }
        
        const canvas = await html2canvas(invoiceElement, {
          scale: 2, // Better quality
          useCORS: true, // Enable CORS for images
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        // Convert to image and download
        const invoiceNumber = document.getElementById('preview-invoice-number').textContent;
        const sanitizedInvoiceNumber = invoiceNumber.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        const link = document.createElement('a');
        link.download = `invoice-${sanitizedInvoiceNumber}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        // Hide loading indicator
        hideLoadingOverlay();
      } catch (error) {
        console.error('Error generating image:', error);
        hideLoadingOverlay();
        alert('Failed to generate image. Please try again.');
      }
    });
  }
}

// Initialize copy to new invoice functionality
function initCopyToNewInvoice() {
  const copyInvoiceBtn = document.getElementById('copy-invoice-btn');
  
  if (copyInvoiceBtn) {
    copyInvoiceBtn.addEventListener('click', function() {
      // Get current form data from local storage
      const savedData = localStorage.getItem('invoice_draft');
      if (!savedData) {
        alert('No invoice data found to copy.');
        return;
      }
      
      try {
        // Close the dropdown menu
        document.getElementById('dropdown-menu')?.classList.add('hidden');
        
        // Parse the current data
        const currentData = JSON.parse(savedData);
        
        // Modify the copy to make it a new invoice
        currentData.invoice.number = '';
        
        // Update the date to today
        const today = new Date();
        currentData.invoice.date = today.toISOString().split('T')[0];
        
        // Calculate new due date (e.g., today + 30 days)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        currentData.invoice.dueDate = dueDate.toISOString().split('T')[0];
        
        // Save the modified data
        localStorage.setItem('invoice_draft', JSON.stringify(currentData));
        
        // Go back to edit mode
        const invoiceForm = document.getElementById('invoice-form')?.closest('.mb-10');
        const invoicePreview = document.getElementById('invoice-preview');
        
        if (invoiceForm && invoicePreview) {
          invoicePreview.classList.add('hidden');
          invoiceForm.classList.remove('hidden');
          
          // Load the draft data
          window.loadFormData?.(currentData);
          
          // Show confirmation
          alert('Invoice copied. You can now edit the new invoice.');
        }
      } catch (error) {
        console.error('Error copying invoice:', error);
        alert('Failed to copy invoice. Please try again.');
      }
    });
  }
}

// Initialize status change functionality
function initStatusChange() {
  const invoiceStatus = document.getElementById('invoice-status');
  
  if (invoiceStatus) {
    invoiceStatus.addEventListener('change', function() {
      const status = this.value;
      this.className = 'appearance-none pl-3 pr-10 py-1.5 rounded-full text-sm font-medium border-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer invoice-status-' + status;
      
      // Update mobile status badge
      const mobileStatusBadge = document.querySelector('#mobile-status-badge span');
      if (mobileStatusBadge) {
        mobileStatusBadge.className = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium status-badge-' + status;
        mobileStatusBadge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
      }
    });
  }
}

// Helper function to show loading overlay
function showLoadingOverlay(message = 'Processing...') {
  // Remove any existing overlay
  hideLoadingOverlay();
  
  // Create overlay
  const loaderDiv = document.createElement('div');
  loaderDiv.id = 'loading-overlay';
  loaderDiv.className = 'fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-50';
  loaderDiv.innerHTML = `
    <div class="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-xs">
      <p class="text-center text-gray-700 dark:text-gray-300">${message}</p>
      <div class="mt-4 w-full bg-gray-200 rounded-full h-2.5">
        <div class="bg-indigo-600 h-2.5 rounded-full w-3/4 animate-pulse"></div>
      </div>
    </div>
  `;
  document.body.appendChild(loaderDiv);
}

// Helper function to hide loading overlay
function hideLoadingOverlay() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.remove();
  }
}