// Import our new features
import { initAdvancedFeatures } from './invoice-features.js';
import { initInvoiceForm } from './invoice-form.js';

/**
 * invoice-main.js
 * Main functionality for the Invoice Generator
 */

// Initialize the invoice form early to expose its functions
initInvoiceForm();

// Make utility functions available globally
window.showLoadingOverlay = showLoadingOverlay;
window.hideLoadingOverlay = hideLoadingOverlay;
window.showToast = showToast;

// Functions and variables for invoice generator
let logoData = null;

// Initialize checkboxes and toggle functionality
function initCheckboxes() {
  // Find all checkboxes that might need special handling
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  
  checkboxes.forEach(checkbox => {
    // Restore any saved state from localStorage if applicable
    const checkboxId = checkbox.id;
    if (checkboxId) {
      const savedState = localStorage.getItem(`checkbox-${checkboxId}`);
      if (savedState !== null) {
        checkbox.checked = savedState === 'true';
      }
      
      // Save state on change
      checkbox.addEventListener('change', function() {
        localStorage.setItem(`checkbox-${checkboxId}`, this.checked);
        
        // Handle specific checkbox functionality
        if (checkboxId === 'include-payment') {
          const paymentDetailsSection = document.querySelector('.payment-details-section');
          if (paymentDetailsSection) {
            paymentDetailsSection.style.display = this.checked ? 'block' : 'none';
          }
        }
      });
      
      // Trigger change event to apply initial state for visibility toggles
      if (checkboxId === 'include-payment') {
        const event = new Event('change');
        checkbox.dispatchEvent(event);
      }
    }
  });
}

// Initialize line items functionality
function initLineItems() {
  // Add Line Item button
  const addLineItemBtn = document.getElementById('add-line-item');
  if (addLineItemBtn) {
    addLineItemBtn.addEventListener('click', function() {
      addLineItem();
    });
  }
  
  // Initialize first line item (if needed)
  const lineItemsContainer = document.getElementById('line-items');
  if (lineItemsContainer && lineItemsContainer.querySelectorAll('tr.line-item').length === 0) {
    addLineItem();
  }
  
  // Add event delegation for remove buttons and line item calculations
  const lineItemsTable = document.getElementById('line-items-table');
  if (lineItemsTable) {
    lineItemsTable.addEventListener('click', function(e) {
      // Handle remove button click
      if (e.target && e.target.classList.contains('remove-item')) {
        const row = e.target.closest('tr');
        if (row) {
          // Don't remove if it's the only row
          const allRows = document.querySelectorAll('#line-items tr.line-item');
          if (allRows.length > 1) {
            row.remove();
            updateTotals();
          } else {
            // If it's the only row, just clear the values
            const inputs = row.querySelectorAll('input');
            inputs.forEach(input => {
              input.value = input.name === 'item-quantity[]' ? '1' : input.name === 'item-tax[]' ? '0' : '';
            });
            row.querySelector('.item-total').textContent = '0.00';
            updateTotals();
          }
        }
      }
    });
    
    // Add event listener for input changes
    lineItemsTable.addEventListener('input', function(e) {
      if (e.target && (e.target.name === 'item-quantity[]' || e.target.name === 'item-price[]' || e.target.name === 'item-tax[]')) {
        const row = e.target.closest('tr');
        if (row) {
          updateLineItemTotal(row);
          updateTotals();
        }
      }
    });
  }
}

// Add a new line item row to the table
function addLineItem(description = '', quantity = 1, price = '', tax = 0) {
  const lineItemsContainer = document.getElementById('line-items');
  if (!lineItemsContainer) return;
  
  const newRow = document.createElement('tr');
  newRow.className = 'line-item bg-white dark:bg-gray-800 border-b dark:border-gray-700';
  
  // Create cell contents with input fields
  newRow.innerHTML = `
    <td class="py-4 px-3">
      <input type="text" name="item-description[]" class="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm px-2 py-1" value="${description}" required>
    </td>
    <td class="py-4 px-3">
      <input type="number" name="item-quantity[]" class="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm px-2 py-1 text-right" min="1" value="${quantity}" required>
    </td>
    <td class="py-4 px-3">
      <input type="number" name="item-price[]" class="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm px-2 py-1 text-right" step="0.01" min="0" value="${price}" required>
    </td>
    <td class="py-4 px-3">
      <input type="number" name="item-tax[]" class="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm px-2 py-1 text-right" min="0" max="100" step="0.1" value="${tax}">
    </td>
    <td class="py-4 px-3 text-right">
      <span class="item-total">0.00</span>
    </td>
    <td class="py-4 px-3">
      <button type="button" class="remove-item text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 focus:outline-none">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </td>
  `;
  
  lineItemsContainer.appendChild(newRow);
  updateLineItemTotal(newRow);
  updateTotals();
}

// Update a single line item total
function updateLineItemTotal(row) {
  const quantity = parseFloat(row.querySelector('[name="item-quantity[]"]').value) || 0;
  const price = parseFloat(row.querySelector('[name="item-price[]"]').value) || 0;
  const total = quantity * price;
  
  row.querySelector('.item-total').textContent = total.toFixed(2);
}

// Update the subtotal, tax, and total
function updateTotals() {
  let subtotal = 0;
  let totalTax = 0;
  
  // Calculate from each line item
  document.querySelectorAll('#line-items tr.line-item').forEach(row => {
    const quantity = parseFloat(row.querySelector('[name="item-quantity[]"]').value) || 0;
    const price = parseFloat(row.querySelector('[name="item-price[]"]').value) || 0;
    const taxRate = parseFloat(row.querySelector('[name="item-tax[]"]').value) || 0;
    
    const lineTotal = quantity * price;
    const lineTax = lineTotal * (taxRate / 100);
    
    subtotal += lineTotal;
    totalTax += lineTax;
  });
  
  // Update displayed totals
  const total = subtotal + totalTax;
  
  // Get currency symbol
  const currencySelect = document.getElementById('currency');
  const currencySymbol = currencySelect ? getCurrencySymbol(currencySelect.value) : '$';
  
  // Update the displayed totals
  const subtotalElement = document.getElementById('subtotal');
  const taxTotalElement = document.getElementById('tax-total');
  const invoiceTotalElement = document.getElementById('invoice-total');
  
  if (subtotalElement) subtotalElement.textContent = subtotal.toFixed(2);
  if (taxTotalElement) taxTotalElement.textContent = totalTax.toFixed(2);
  if (invoiceTotalElement) invoiceTotalElement.textContent = total.toFixed(2);
  
  // Update currency symbols
  document.querySelectorAll('.currency-symbol').forEach(el => {
    el.textContent = currencySymbol;
  });
}

// Initialize form handlers
function initFormHandlers() {
  const invoiceForm = document.getElementById('invoiceForm');
  const previewInvoiceBtn = document.getElementById('preview-invoice');
  const backToEditBtn = document.getElementById('back-to-edit');
  const resetFormBtn = document.getElementById('reset-form');
  
  if (previewInvoiceBtn) {
    previewInvoiceBtn.addEventListener('click', function() {
      if (validateForm()) {
        saveFormData();
        renderInvoicePreview();
        document.getElementById('invoice-preview').classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
  
  if (backToEditBtn) {
    backToEditBtn.addEventListener('click', function() {
      document.getElementById('invoice-preview').classList.add('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  
  if (resetFormBtn) {
    resetFormBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to clear all form data? This cannot be undone.')) {
        clearFormData();
        showToast('Form has been reset', 'info');
      }
    });
  }
  
  // Auto-save form data on input changes
  if (invoiceForm) {
    invoiceForm.addEventListener('input', debounce(function() {
      saveFormData();
    }, 1000));
  }
  
  // Initialize save/load functionality
  initSaveLoadFunctionality();
}

// Initialize functionality to save/load invoices
function initSaveLoadFunctionality() {
  const saveInvoiceBtn = document.getElementById('save-invoice');
  const loadInvoiceBtn = document.getElementById('load-invoice');
  const loadInvoiceFile = document.getElementById('load-invoice-file');
  
  if (saveInvoiceBtn) {
    saveInvoiceBtn.addEventListener('click', function() {
      saveInvoiceToFile();
    });
  }
  
  if (loadInvoiceBtn && loadInvoiceFile) {
    loadInvoiceBtn.addEventListener('click', function() {
      loadInvoiceFile.click();
    });
    
    loadInvoiceFile.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        loadInvoiceFromFile(file);
      }
    });
  }
}

// Loading/toast utility functions
function showLoadingOverlay(message = 'Loading...') {
  const overlay = document.getElementById('loading-overlay');
  const messageElement = document.getElementById('loading-message');
  
  if (messageElement) {
    messageElement.textContent = message;
  }
  
  if (overlay) {
    overlay.classList.remove('hidden');
  }
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  
  if (!toast || !toastMessage) return;
  
  // Set message and type
  toastMessage.textContent = message;
  
  // Remove previous classes
  toast.className = 'fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300 ease-out z-50';
  
  // Add class based on type
  switch (type) {
    case 'error':
      toast.classList.add('bg-red-500', 'text-white');
      break;
    case 'warning':
      toast.classList.add('bg-yellow-500', 'text-white');
      break;
    case 'info':
      toast.classList.add('bg-blue-500', 'text-white');
      break;
    default: // success
      toast.classList.add('bg-green-500', 'text-white');
  }
  
  // Show the toast
  toast.classList.remove('translate-y-20', 'opacity-0');
  
  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3000);
}

// Debounce helper function
function debounce(func, delay) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

// Helper function to get currency symbol from code
function getCurrencySymbol(currencyCode) {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'INR': '₹',
    'CAD': 'C$',
    'AUD': 'A$',
    'BRL': 'R$',
    'ZAR': 'R',
    'RUB': '₽'
  };
  
  return symbols[currencyCode] || '$';
}

// Initialize logo upload functionality
function initLogoUpload() {
  const logoUploadInput = document.getElementById('logo-upload');
  const logoPreview = document.getElementById('logo-preview');
  const removeLogo = document.getElementById('remove-logo');
  
  if (logoUploadInput && logoPreview) {
    // Load saved logo from localStorage if available
    const savedLogo = localStorage.getItem('invoice-logo');
    if (savedLogo) {
      logoData = savedLogo;
      logoPreview.src = savedLogo;
      logoPreview.classList.remove('hidden');
      if (removeLogo) removeLogo.classList.remove('hidden');
    }
    
    // Handle new logo uploads
    logoUploadInput.addEventListener('change', function(e) {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
          logoData = e.target.result;
          logoPreview.src = e.target.result;
          logoPreview.classList.remove('hidden');
          if (removeLogo) removeLogo.classList.remove('hidden');
          
          // Save logo to localStorage
          localStorage.setItem('invoice-logo', logoData);
        };
        
        reader.readAsDataURL(this.files[0]);
      }
    });
    
    // Handle logo removal
    if (removeLogo) {
      removeLogo.addEventListener('click', function() {
        logoData = null;
        logoPreview.src = '';
        logoPreview.classList.add('hidden');
        removeLogo.classList.add('hidden');
        logoUploadInput.value = '';
        
        // Remove from localStorage
        localStorage.removeItem('invoice-logo');
      });
    }
  }
}

// Initialize PDF generation functionality
function initPDFGeneration() {
  const downloadPdfBtn = document.getElementById('preview-pdf-btn');
  
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', function() {
      generatePDF();
    });
  }
}

// Generate PDF from invoice data
function generatePDF() {
  showLoadingOverlay('Generating PDF...');
  
  try {
    // Get the invoice preview element
    const invoiceElement = document.querySelector('#invoice-preview .invoice-container');
    if (!invoiceElement) {
      throw new Error('Invoice preview element not found');
    }
    
    // Clone the element to avoid modifying the original
    const clonedInvoice = invoiceElement.cloneNode(true);
    
    // Remove any interactive elements or elements that shouldn't appear in PDF
    const elementsToRemove = clonedInvoice.querySelectorAll('.remove-in-pdf, button');
    elementsToRemove.forEach(el => el.remove());
    
    // Apply print-specific styles to ensure proper rendering
    const pageStyle = `
      @page {
        size: A4;
        margin: 0;
      }
      html, body {
        width: 210mm;
        height: 297mm;
        margin: 0;
        padding: 0;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        font-size: 12pt;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .invoice-container {
        width: 210mm;
        padding: 15mm;
        box-sizing: border-box;
        page-break-after: always;
        background-color: white;
        color: black;
      }
      
      /* Improved text colors - exactly matching preview */
      .text-gray-900, .text-white, .dark\\:text-white {
        color: #111827 !important;
      }
      .text-gray-800, .dark\\:text-gray-200 {
        color: #1F2937 !important;
      }
      .text-gray-700, .dark\\:text-gray-300 {
        color: #374151 !important;
      }
      .text-gray-600, .dark\\:text-gray-400, .text-gray-500, .dark\\:text-gray-500 {
        color: #4B5563 !important;
      }
      .text-indigo-600, .dark\\:text-indigo-400 {
        color: #4F46E5 !important;
      }
      .text-indigo-700 {
        color: #4338CA !important;
      }
      .text-indigo-800 {
        color: #3730A3 !important;
      }
      
      /* Background colors - exactly matching preview */
      .bg-white, .dark\\:bg-slate-800 {
        background-color: white !important;
      }
      .bg-gray-50, .dark\\:bg-slate-700 {
        background-color: #F9FAFB !important;
      }
      .bg-gradient-to-r {
        background: white !important;
      }
      
      /* Table styles - improved to match preview */
      table {
        width: 100% !important;
        border-collapse: collapse !important;
        margin-bottom: 2rem !important;
      }
      th {
        background-color: #F9FAFB !important;
        font-weight: 600 !important;
        text-transform: uppercase !important;
        font-size: 0.75rem !important;
        color: #6B7280 !important;
        text-align: left !important;
        padding: 0.75rem 1.5rem !important;
        border-bottom: 1px solid #E5E7EB !important;
      }
      th:not(:first-child) {
        text-align: right !important;
      }
      td {
        padding: 1rem 1.5rem !important;
        border-bottom: 1px solid #E5E7EB !important;
      }
      td:not(:first-child) {
        text-align: right !important;
      }
      
      /* Heading styles matching the preview */
      h1.text-2xl {
        font-size: 1.5rem !important;
        line-height: 2rem !important;
        margin-bottom: 0.5rem !important;
        font-weight: 700 !important;
      }
      h3, h4 {
        margin-bottom: 0.5rem !important;
        font-weight: 600 !important;
      }
      
      /* Layout fixes to match preview exactly */
      .flex {
        display: flex !important;
      }
      .flex-col {
        flex-direction: column !important;
      }
      .md\\:flex-row, .flex-col.md\\:flex-row {
        flex-direction: row !important;
      }
      .items-start {
        align-items: flex-start !important;
      }
      .items-end {
        align-items: flex-end !important;
      }
      .items-center {
        align-items: center !important;
      }
      .justify-between {
        justify-content: space-between !important;
      }
      .justify-end {
        justify-content: flex-end !important;
      }
      .w-full {
        width: 100% !important;
      }
      .md\\:w-1\\/2, .w-full.md\\:w-1\\/2 {
        width: 50% !important;
      }
      .md\\:w-1\\/3, .w-full.md\\:w-1\\/3 {
        width: 33.333333% !important;
      }
      .md\\:w-64, .w-full.md\\:w-64 {
        width: 16rem !important;
      }
      .mb-8 {
        margin-bottom: 2rem !important;
      }
      .mb-4, .print\\:mb-4 {
        margin-bottom: 1rem !important;
      }
      .mt-2, .mt-3, .mt-4, .mt-6, .mt-8 {
        margin-top: 0.5rem !important;
      }
      .mb-1, .mb-2, .mb-3, .mb-6 {
        margin-bottom: 0.5rem !important;
      }
      .font-semibold {
        font-weight: 600 !important;
      }
      .font-medium {
        font-weight: 500 !important;
      }
      .text-lg {
        font-size: 1.125rem !important;
      }
      .text-sm {
        font-size: 0.875rem !important;
      }
      .text-xs {
        font-size: 0.75rem !important;
      }
      .uppercase {
        text-transform: uppercase !important;
      }
      .whitespace-pre-line {
        white-space: pre-line !important;
      }
      
      /* Grid and other layout styling to match preview */
      .grid {
        display: grid !important;
      }
      .grid-cols-1 {
        grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
      }
      .md\\:grid-cols-2, .grid-cols-1.md\\:grid-cols-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
      .gap-4, .gap-6 {
        gap: 1rem !important;
      }
      .p-4 {
        padding: 1rem !important;
      }
      .p-6, .print\\:p-2 {
        padding: 1.5rem !important;
      }
      .py-2 {
        padding-top: 0.5rem !important;
        padding-bottom: 0.5rem !important;
      }
      .py-3 {
        padding-top: 0.75rem !important;
        padding-bottom: 0.75rem !important;
      }
      .rounded-lg {
        border-radius: 0.5rem !important;
      }
      .border-t {
        border-top: 1px solid #E5E7EB !important;
      }
      
      /* Box styling for payment details and other sections */
      .bg-gray-50, .dark\\:bg-slate-700 {
        background-color: #F9FAFB !important;
        border: 1px solid #E5E7EB !important;
        border-radius: 0.5rem !important;
      }
      
      /* Handle bank details section exactly like preview */
      #bank-details-section {
        margin-bottom: 2rem !important;
      }
      #bank-details-section > div {
        padding: 1rem !important;
        background-color: #F9FAFB !important;
        border: 1px solid #E5E7EB !important;
        border-radius: 0.5rem !important;
      }
      
      /* Logo styling */
      #preview-logo {
        margin-bottom: 1rem !important;
      }
      #preview-logo img {
        max-width: 200px !important;
        max-height: 80px !important;
        object-fit: contain !important;
      }
      
      /* "INVOICE" title styling to match preview */
      .bg-gradient-to-r h1.text-2xl {
        color: #4F46E5 !important; /* indigo-600 */
        font-size: 1.5rem !important;
        font-weight: 700 !important;
      }
      
      /* Special text colors for consistent print */
      .text-center {
        text-align: center !important;
      }
      
      /* Footer Thank You text */
      .text-center.text-gray-600 {
        margin-top: 2rem !important;
      }
    `;
    
    // Configuration for html2pdf with improved settings
    const options = {
      margin: 0,
      filename: `invoice-${document.getElementById('preview-invoice-number')?.textContent || 'new'}.pdf`,
      image: { 
        type: 'jpeg', 
        quality: 1.0 
      },
      html2canvas: { 
        scale: 2, // Higher scale for better quality
        useCORS: true,
        letterRendering: true,
        allowTaint: true,
        logging: false,
        width: 794, // A4 width in pixels at 96 DPI
        height: undefined, // Let it calculate height automatically
        windowWidth: 1280, // Larger window width to avoid content wrapping
        onclone: function(clonedDoc) {
          // Properly handle dark mode and other classes
          const elements = clonedDoc.querySelectorAll('*');
          elements.forEach(el => {
            // Remove dark mode classes but maintain structure
            if (el.className && typeof el.className === 'string') {
              el.className = el.className
                .replace(/dark\:bg-slate-[7-9]00/g, '')
                .replace(/dark\:text-white/g, '')
                .replace(/dark\:text-gray-[2-4]00/g, '')
                .replace(/dark\:text-indigo-400/g, '')
                .replace(/dark\:border-gray-700/g, '')
                .replace(/dark\:border-slate-[6-7]00/g, '')
                .replace(/dark\:divide-gray-700/g, '')
                .replace(/print\:p-[0-9]+/g, '');
            }
          });
          
          // Handle bank details visibility - hide if not included
          const includePayment = document.getElementById('include-payment')?.checked;
          const bankDetailsSection = clonedDoc.getElementById('bank-details-section');
          if (bankDetailsSection && !includePayment) {
            bankDetailsSection.style.display = 'none';
          }
          
          // Make sure invoice header is properly styled
          const invoiceHeader = clonedDoc.querySelector('.bg-gradient-to-r');
          if (invoiceHeader) {
            invoiceHeader.style.backgroundColor = '#EEF2FF'; // indigo-50
            invoiceHeader.style.padding = '1rem';
            invoiceHeader.style.borderRadius = '0.5rem';
          }
        }
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true,
        precision: 16,
        putTotalPages: true
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.page-break-before',
        after: '.page-break-after'
      },
      enableLinks: true,
      style: pageStyle
    };
    
    // Create a temporary container for the cloned element
    const tempContainer = document.createElement('div');
    tempContainer.className = 'pdf-container';
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0px';
    tempContainer.style.width = '210mm';
    tempContainer.appendChild(clonedInvoice);
    document.body.appendChild(tempContainer);
    
    // Apply additional direct styling to match preview exactly
    const rowItems = tempContainer.querySelectorAll('.flex-col.md\\:flex-row');
    rowItems.forEach(el => {
      el.style.display = 'flex';
      el.style.flexDirection = 'row';
      el.style.justifyContent = 'space-between';
      el.style.width = '100%';
    });
    
    // Fix table column widths to match preview
    const tableHeaders = tempContainer.querySelectorAll('table th');
    if (tableHeaders.length > 0) {
      tableHeaders[0].style.width = '50%'; // Description column
      if (tableHeaders[1]) tableHeaders[1].style.width = '10%'; // Quantity column
      if (tableHeaders[2]) tableHeaders[2].style.width = '15%'; // Rate column
      if (tableHeaders[3]) tableHeaders[3].style.width = '10%'; // Tax column
      if (tableHeaders[4]) tableHeaders[4].style.width = '15%'; // Amount column
    }
    
    // Generate PDF using improved approach
    html2pdf()
      .from(clonedInvoice)
      .set(options)
      .toPdf() // Convert to PDF first without saving
      .get('pdf')
      .then(function(pdf) {
        // Add page numbers if needed
        const totalPages = pdf.internal.getNumberOfPages();
        if (totalPages > 1) {
          for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(9);
            pdf.setTextColor(128, 128, 128);
            pdf.text(`Page ${i} of ${totalPages}`, pdf.internal.pageSize.getWidth() - 25, pdf.internal.pageSize.getHeight() - 10);
          }
        }
        // Return to the modified PDF object
        return pdf;
      })
      .save() // Now save the modified PDF
      .then(() => {
        // Clean up the temporary element
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }
        hideLoadingOverlay();
        showToast('PDF downloaded successfully!', 'success');
      })
      .catch(err => {
        // Clean up even on error
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }
        console.error('PDF generation error:', err);
        hideLoadingOverlay();
        showToast('Error generating PDF', 'error');
      });
  } catch (error) {
    console.error('PDF generation error:', error);
    hideLoadingOverlay();
    showToast('Error generating PDF: ' + error.message, 'error');
  }
}

// Initialize print functionality
function initPrintFunctionality() {
  const printInvoiceBtn = document.getElementById('print-invoice');
  
  if (printInvoiceBtn) {
    printInvoiceBtn.addEventListener('click', function() {
      // Open print dialog for the current page
      window.print();
    });
  }
}

// Now that all functions are defined, we can add the event listener
document.addEventListener('DOMContentLoaded', function() {
  // Initialize form handlers
  initFormHandlers();
  
  // Initialize line item functionality
  initLineItems();
  
  // Load saved form data (if available)
  loadFormData();
  
  // Initialize checkbox and radio inputs
  initCheckboxes();
  
  // Initialize logo upload
  initLogoUpload();
  
  // Initialize the download PDF functionality
  initPDFGeneration();
  
  // Initialize print functionality
  initPrintFunctionality();
  
  // Initialize our advanced features
  initAdvancedFeatures();
});