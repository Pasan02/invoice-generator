// Import our new features
import { initAdvancedFeatures } from './invoice-features.js';
import { initInvoiceForm } from './invoice-form.js';
import { initPDFFunctionality } from './invoice-pdf.js';

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
  initPDFFunctionality();
  
  // Initialize print functionality
  initPrintFunctionality();
  
  // Initialize our advanced features
  initAdvancedFeatures();
});