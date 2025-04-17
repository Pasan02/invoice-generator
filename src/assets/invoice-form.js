/**
 * Invoice Form Handler
 * Manages form interactions, tab navigation, calculations, and validation
 */

// Add import at the top of the file
import { initProgressBar } from './invoice-progress.js';
import { initMobileExperience } from './mobile-experience.js';

// Initialize the invoice form when the document is ready
export function initInvoiceForm() {
  document.addEventListener('DOMContentLoaded', function() {
    initTabNavigation();
    initLogoUpload();
    initLineItems();
    initInvoiceNumberGenerator();
    initFormValidation();
    initDateDefaults();
    initSaveLoadDraft();
    initPreviewHandler();
    initProgressBar(); // Initialize progress bar functionality
    initMobileExperience(); // Add mobile-specific enhancements
    
    // Expose loadFormData globally for the preview functionality
    window.loadFormData = loadFormData;
  });
}

// Initialize tab navigation system
function initTabNavigation() {
  const tabLinks = document.querySelectorAll('.tab-link');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  // Change active tab
  function setActiveTab(tabId) {
    // Hide all tab panes
    tabPanes.forEach(pane => pane.classList.add('hidden'));
    
    // Remove active class from all tab links
    tabLinks.forEach(link => {
      link.classList.remove('active', 'border-indigo-500', 'dark:border-indigo-400', 'text-indigo-600', 'dark:text-indigo-400');
      link.classList.add('border-transparent', 'text-gray-500', 'dark:text-gray-400');
    });
    
    // Show the selected tab pane
    const activePane = document.getElementById(`${tabId}-tab`);
    if (activePane) {
      activePane.classList.remove('hidden');
      activePane.classList.add('animate-fade-in');
    }
    
    // Mark the tab link as active
    const activeLink = document.querySelector(`.tab-link[data-tab="${tabId}"]`);
    if (activeLink) {
      activeLink.classList.add('active', 'border-indigo-500', 'dark:border-indigo-400', 'text-indigo-600', 'dark:text-indigo-400');
      activeLink.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400');
    }
    
    // Dispatch event for progress bar update
    const progressEvent = new CustomEvent('set-active-tab', {
      detail: { tabId }
    });
    document.dispatchEvent(progressEvent);
  }
  
  // Set up tab navigation clicks
  tabLinks.forEach(link => {
    link.addEventListener('click', () => {
      setActiveTab(link.dataset.tab);
    });
  });
  
  // Set up next/prev tab buttons
  const nextButtons = document.querySelectorAll('.next-tab');
  const prevButtons = document.querySelectorAll('.prev-tab');
  
  nextButtons.forEach(button => {
    button.addEventListener('click', () => {
      setActiveTab(button.dataset.next);
    });
  });
  
  prevButtons.forEach(button => {
    button.addEventListener('click', () => {
      setActiveTab(button.dataset.prev);
    });
  });
  
  // Make setActiveTab available globally for form validation
  window.setActiveTab = setActiveTab;
}

// Initialize logo upload functionality
function initLogoUpload() {
  const logoUpload = document.getElementById('logo-upload');
  const logoPreview = document.getElementById('logo-preview');
  const logoPreviewWrapper = document.getElementById('logo-preview-wrapper');
  
  logoUpload?.addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (1MB limit)
      if (file.size > 1024 * 1024) {
        alert('File is too large. Please select an image under 1MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = function(event) {
        if (logoPreview && logoPreviewWrapper) {
          logoPreview.src = event.target.result;
          logoPreviewWrapper.classList.remove('hidden');
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

// Initialize line items functionality
function initLineItems() {
  const addItemButton = document.getElementById('add-item');
  const itemsTableBody = document.getElementById('items-table-body');
  
  if (addItemButton && itemsTableBody) {
    // Only add initial row if the table is empty
    if (itemsTableBody.querySelectorAll('tr').length === 0) {
      addItemRow(itemsTableBody);
    }
    
    addItemButton.addEventListener('click', function() {
      addItemRow(itemsTableBody);
    });
    
    // Delete item row (delegated)
    itemsTableBody.addEventListener('click', function(e) {
      if (e.target && e.target.classList.contains('delete-item') || e.target.closest('.delete-item')) {
        const row = e.target.closest('tr');
        if (row) {
          // Make sure we have at least one item row
          if (itemsTableBody.querySelectorAll('tr').length > 1) {
            row.remove();
            calculateTotals(itemsTableBody);
          } else {
            alert('You need at least one item row.');
          }
        }
      }
    });
    
    // Calculate amount when quantity, rate or tax changes
    itemsTableBody.addEventListener('input', function(e) {
      if (e.target && (e.target.classList.contains('item-quantity') || 
                     e.target.classList.contains('item-rate') || 
                     e.target.classList.contains('item-tax'))) {
        const row = e.target.closest('tr');
        if (row) {
          calculateItemAmount(row);
          calculateTotals(itemsTableBody);
        }
      }
    });
  }
}

// Add a new line item row
function addItemRow(itemsTableBody) {
  const newRow = document.createElement('tr');
  newRow.innerHTML = `
    <td class="px-6 py-4">
      <input type="text" class="form-input w-full p-2 item-description" placeholder="Item description">
    </td>
    <td class="px-6 py-4">
      <input type="number" class="form-input w-full p-2 text-right item-quantity" value="1" min="1" step="1">
    </td>
    <td class="px-6 py-4">
      <input type="number" class="form-input w-full p-2 text-right item-rate" value="0.00" min="0" step="0.01">
    </td>
    <td class="px-6 py-4">
      <input type="number" class="form-input w-full p-2 text-right item-tax" value="0" min="0" max="100" step="0.1">
    </td>
    <td class="px-6 py-4 text-right item-amount">0.00</td>
    <td class="px-6 py-4 text-right">
      <button type="button" class="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors delete-item">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </td>
  `;
  itemsTableBody.appendChild(newRow);
}

// Calculate item amount for a row
function calculateItemAmount(row) {
  const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
  const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
  const taxPercent = parseFloat(row.querySelector('.item-tax').value) || 0;
  
  const subtotal = quantity * rate;
  const taxAmount = subtotal * (taxPercent / 100);
  const total = subtotal + taxAmount;
  
  row.querySelector('.item-amount').textContent = total.toFixed(2);
}

// Calculate overall totals
function calculateTotals(itemsTableBody) {
  let subtotal = 0;
  let taxTotal = 0;
  
  // Loop through all rows
  const rows = itemsTableBody.querySelectorAll('tr');
  rows.forEach(row => {
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
    const taxPercent = parseFloat(row.querySelector('.item-tax').value) || 0;
    
    const rowSubtotal = quantity * rate;
    const rowTaxAmount = rowSubtotal * (taxPercent / 100);
    
    subtotal += rowSubtotal;
    taxTotal += rowTaxAmount;
  });
  
  const total = subtotal + taxTotal;
  
  // Update displays
  document.getElementById('subtotal-display').textContent = subtotal.toFixed(2);
  document.getElementById('tax-display').textContent = taxTotal.toFixed(2);
  document.getElementById('total-display').textContent = total.toFixed(2);
}

// Initialize invoice number generator
function initInvoiceNumberGenerator() {
  const generateInvoiceNumberBtn = document.getElementById('generate-invoice-number');
  generateInvoiceNumberBtn?.addEventListener('click', function() {
    const invoiceNumberInput = document.getElementById('invoice-number');
    if (invoiceNumberInput) {
      const now = new Date();
      const timestamp = now.getFullYear().toString() +
                      (now.getMonth() + 1).toString().padStart(2, '0') +
                      now.getDate().toString().padStart(2, '0');
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      invoiceNumberInput.value = `INV-${timestamp}-${randomDigits}`;
    }
  });
}

// Initialize form validation
function initFormValidation() {
  // Validate form before preview
  window.validateForm = function() {
    // Basic required fields
    const requiredFields = [
      { id: 'sender-name', message: 'Sender name is required' },
      { id: 'client-name', message: 'Client name is required' },
      { id: 'invoice-date', message: 'Invoice date is required' }
    ];
    
    for (const field of requiredFields) {
      const element = document.getElementById(field.id);
      if (!element || !element.value.trim()) {
        alert(field.message);
        element?.focus();
        
        // Switch to the appropriate tab
        if (field.id.includes('sender')) {
          window.setActiveTab('sender');
        } else if (field.id.includes('client')) {
          window.setActiveTab('client');
        } else if (field.id.includes('invoice')) {
          window.setActiveTab('invoice');
        }
        
        return false;
      }
    }
    
    // At least one line item with description and values
    const itemsTableBody = document.getElementById('items-table-body');
    const itemRows = itemsTableBody.querySelectorAll('tr');
    let hasValidItem = false;
    
    for (const row of itemRows) {
      const description = row.querySelector('.item-description').value.trim();
      const quantity = parseFloat(row.querySelector('.item-quantity').value);
      const rate = parseFloat(row.querySelector('.item-rate').value);
      
      if (description && !isNaN(quantity) && !isNaN(rate) && quantity > 0 && rate > 0) {
        hasValidItem = true;
        break;
      }
    }
    
    if (!hasValidItem) {
      alert('Please add at least one item with a description, quantity and rate.');
      window.setActiveTab('items');
      return false;
    }
    
    return true;
  }
  
  // Make setActiveTab available globally
  window.setActiveTab = function(tabId) {
    const tabEvent = new CustomEvent('set-active-tab', {
      detail: { tabId }
    });
    document.dispatchEvent(tabEvent);
  };
  
  // Listen for the custom event
  document.addEventListener('set-active-tab', function(e) {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    // Hide all tab panes
    tabPanes.forEach(pane => pane.classList.add('hidden'));
    
    // Remove active class from all tab links
    tabLinks.forEach(link => {
      link.classList.remove('active', 'border-indigo-500', 'dark:border-indigo-400', 'text-indigo-600', 'dark:text-indigo-400');
      link.classList.add('border-transparent', 'text-gray-500', 'dark:text-gray-400');
    });
    
    // Show the selected tab pane
    const activePane = document.getElementById(`${e.detail.tabId}-tab`);
    if (activePane) {
      activePane.classList.remove('hidden');
      activePane.classList.add('animate-fade-in');
    }
    
    // Mark the tab link as active
    const activeLink = document.querySelector(`.tab-link[data-tab="${e.detail.tabId}"]`);
    if (activeLink) {
      activeLink.classList.add('active', 'border-indigo-500', 'dark:border-indigo-400', 'text-indigo-600', 'dark:text-indigo-400');
      activeLink.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400');
    }
  });
}

// Initialize date defaults
function initDateDefaults() {
  const invoiceDateInput = document.getElementById('invoice-date');
  if (invoiceDateInput) {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
    invoiceDateInput.value = formattedDate;
  }
}

// Initialize save and load draft functionality
function initSaveLoadDraft() {
  const saveDraftBtn = document.getElementById('save-draft');
  const loadDraftBtn = document.getElementById('load-draft');
  const resetFormBtn = document.getElementById('reset-form');
  
  if (saveDraftBtn) {
    saveDraftBtn.addEventListener('click', function() {
      try {
        const formData = collectFormData();
        
        // Add timestamp to track when the draft was saved
        formData.meta = {
          savedAt: new Date().toISOString(),
          version: '1.0'
        };
        
        localStorage.setItem('invoice_draft', JSON.stringify(formData));
        
        // Use toast notification if available, otherwise fallback to alert
        if (window.showToast) {
          window.showToast('Invoice draft saved successfully', 'success');
        } else {
          alert('Invoice draft saved successfully');
        }
      } catch (error) {
        console.error('Error saving draft:', error);
        alert('Failed to save draft: ' + error.message);
      }
    });
  }
  
  if (loadDraftBtn) {
    loadDraftBtn.addEventListener('click', function() {
      try {
        const savedData = localStorage.getItem('invoice_draft');
        if (savedData) {
          const formData = JSON.parse(savedData);
          
          // Show confirmation if there's unsaved data
          const hasCurrentData = !!document.getElementById('sender-name')?.value || 
                                !!document.getElementById('client-name')?.value;
          
          if (hasCurrentData && 
              !confirm('Loading a draft will replace your current form data. Continue?')) {
            return;
          }
          
          loadFormData(formData);
          
          // Display when the draft was saved
          let message = 'Draft loaded successfully';
          if (formData.meta && formData.meta.savedAt) {
            const savedDate = new Date(formData.meta.savedAt);
            message += ' (saved ' + savedDate.toLocaleString() + ')';
          }
          
          if (window.showToast) {
            window.showToast(message, 'success');
          } else {
            alert(message);
          }
        } else {
          if (window.showToast) {
            window.showToast('No saved draft found', 'info');
          } else {
            alert('No saved draft found');
          }
        }
      } catch (error) {
        console.error('Error loading draft:', error);
        alert('Failed to load draft: ' + error.message);
      }
    });
  }
  
  if (resetFormBtn) {
    resetFormBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to clear the entire form? This cannot be undone.')) {
        resetForm();
        
        if (window.showToast) {
          window.showToast('Form reset successfully', 'info');
        }
      }
    });
  }
  
  // Auto-save draft every 2 minutes if there's content
  const autoSaveInterval = 2 * 60 * 1000; // 2 minutes
  setInterval(() => {
    // Only auto-save if there's actual content to save
    if (document.getElementById('sender-name')?.value || 
        document.getElementById('client-name')?.value) {
      try {
        const formData = collectFormData();
        formData.meta = {
          savedAt: new Date().toISOString(),
          version: '1.0',
          autoSaved: true
        };
        localStorage.setItem('invoice_draft_auto', JSON.stringify(formData));
        console.log('Invoice form auto-saved at', new Date().toLocaleString());
      } catch (error) {
        console.error('Error auto-saving draft:', error);
      }
    }
  }, autoSaveInterval);
  
  // Check for auto-saved draft on page load
  setTimeout(() => {
    const autoSavedData = localStorage.getItem('invoice_draft_auto');
    const normalSavedData = localStorage.getItem('invoice_draft');
    
    // Only offer to restore if there's no content in the form and there is auto-saved content
    const hasCurrentData = !!document.getElementById('sender-name')?.value || 
                          !!document.getElementById('client-name')?.value;
    
    if (!hasCurrentData && autoSavedData && (!normalSavedData || 
        (JSON.parse(autoSavedData).meta?.savedAt > JSON.parse(normalSavedData).meta?.savedAt))) {
      try {
        const formData = JSON.parse(autoSavedData);
        const savedDate = new Date(formData.meta.savedAt);
        
        if (confirm(`Unsaved work from ${savedDate.toLocaleString()} was found. Would you like to restore it?`)) {
          loadFormData(formData);
          if (window.showToast) {
            window.showToast('Auto-saved work restored', 'info');
          }
        }
      } catch (error) {
        console.error('Error handling auto-saved draft:', error);
      }
    }
  }, 1000);
}

// Initialize preview handler
function initPreviewHandler() {
  const previewButton = document.getElementById('preview-button');
  previewButton?.addEventListener('click', function() {
    // Validate the form first
    if (!window.validateForm()) {
      return;
    }
    
    // Hide the form and show the preview
    const invoiceForm = document.getElementById('invoice-form')?.closest('.mb-10');
    const invoicePreview = document.getElementById('invoice-preview');
    
    if (invoiceForm && invoicePreview) {
      invoiceForm.classList.add('hidden');
      invoicePreview.classList.remove('hidden');
      invoicePreview.classList.add('animate-fade-in');
      
      // Populate the preview with form data
      populatePreview();
    }
  });
  
  // Back to edit button handler
  document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'back-to-edit' || e.target.closest('#back-to-edit')) {
      const invoiceForm = document.getElementById('invoice-form')?.closest('.mb-10');
      const invoicePreview = document.getElementById('invoice-preview');
      
      if (invoiceForm && invoicePreview) {
        invoicePreview.classList.add('hidden');
        invoiceForm.classList.remove('hidden');
        invoiceForm.classList.add('animate-fade-in');
      }
    }
  });
}

// Collect form data into a structured object
function collectFormData() {
  const data = {
    sender: {
      name: document.getElementById('sender-name').value,
      email: document.getElementById('sender-email').value,
      phone: document.getElementById('sender-phone').value,
      address: document.getElementById('sender-address').value,
      saveSender: document.getElementById('save-sender').checked,
      logo: document.getElementById('logo-preview')?.src || ''
    },
    client: {
      name: document.getElementById('client-name').value,
      email: document.getElementById('client-email').value,
      phone: document.getElementById('client-phone').value,
      address: document.getElementById('client-address').value,
      saveClient: document.getElementById('save-client').checked
    },
    invoice: {
      number: document.getElementById('invoice-number').value,
      date: document.getElementById('invoice-date').value,
      dueDate: document.getElementById('due-date').value,
      currency: document.getElementById('currency').value,
      taxRate: document.getElementById('tax-rate').value,
      taxInclusive: document.getElementById('tax-inclusive').checked
    },
    items: [],
    notes: document.getElementById('notes').value,
    payment: {
      include: document.getElementById('include-payment').checked,
      bankName: document.getElementById('bank-name').value,
      accountHolder: document.getElementById('account-holder').value,
      accountNumber: document.getElementById('account-number').value,
      routingNumber: document.getElementById('routing-number').value
    }
  };
  
  // Collect items
  const itemsTableBody = document.getElementById('items-table-body');
  const rows = itemsTableBody.querySelectorAll('tr');
  rows.forEach(row => {
    data.items.push({
      description: row.querySelector('.item-description').value,
      quantity: row.querySelector('.item-quantity').value,
      rate: row.querySelector('.item-rate').value,
      tax: row.querySelector('.item-tax').value
    });
  });
  
  return data;
}

// Load form data from a structured object
function loadFormData(data) {
  // Handle case when no data is passed
  if (!data) {
    // Try to load from localStorage
    const savedData = localStorage.getItem('invoice_draft');
    if (savedData) {
      data = JSON.parse(savedData);
    } else {
      // No data available, nothing to load
      return;
    }
  }

  // Select elements
  const logoPreview = document.getElementById('logo-preview');
  const logoPreviewWrapper = document.getElementById('logo-preview-wrapper');
  const itemsTableBody = document.getElementById('items-table-body');
  
  // Load sender info
  document.getElementById('sender-name').value = data.sender?.name || '';
  document.getElementById('sender-email').value = data.sender?.email || '';
  document.getElementById('sender-phone').value = data.sender?.phone || '';
  document.getElementById('sender-address').value = data.sender?.address || '';
  document.getElementById('save-sender').checked = data.sender?.saveSender || false;
  
  // Load logo if it exists
  if (data.sender?.logo && logoPreview && logoPreviewWrapper) {
    logoPreview.src = data.sender.logo;
    logoPreviewWrapper.classList.remove('hidden');
  }
  
  // Load client info
  document.getElementById('client-name').value = data.client?.name || '';
  document.getElementById('client-email').value = data.client?.email || '';
  document.getElementById('client-phone').value = data.client?.phone || '';
  document.getElementById('client-address').value = data.client?.address || '';
  document.getElementById('save-client').checked = data.client?.saveClient || false;
  
  // Load invoice info
  document.getElementById('invoice-number').value = data.invoice?.number || '';
  document.getElementById('invoice-date').value = data.invoice?.date || '';
  document.getElementById('due-date').value = data.invoice?.dueDate || '';
  document.getElementById('currency').value = data.invoice?.currency || 'USD';
  document.getElementById('tax-rate').value = data.invoice?.taxRate || '';
  document.getElementById('tax-inclusive').checked = data.invoice?.taxInclusive || false;
  
  // Load items - clear ALL existing items
  if (itemsTableBody) {
    itemsTableBody.innerHTML = '';
  
    // Then add saved items
    if (data.items && data.items.length > 0) {
      data.items.forEach(item => {
        if (item.description || parseFloat(item.rate) > 0 || parseFloat(item.quantity) > 0) {
          // Only add non-empty rows
          const newRow = document.createElement('tr');
          newRow.innerHTML = `
            <td class="px-6 py-4">
              <input type="text" class="form-input w-full p-2 item-description" placeholder="Item description" value="${item.description || ''}">
            </td>
            <td class="px-6 py-4">
              <input type="number" class="form-input w-full p-2 text-right item-quantity" value="${item.quantity || '1'}" min="1" step="1">
            </td>
            <td class="px-6 py-4">
              <input type="number" class="form-input w-full p-2 text-right item-rate" value="${item.rate || '0.00'}" min="0" step="0.01">
            </td>
            <td class="px-6 py-4">
              <input type="number" class="form-input w-full p-2 text-right item-tax" value="${item.tax || '0'}" min="0" max="100" step="0.1">
            </td>
            <td class="px-6 py-4 text-right item-amount">0.00</td>
            <td class="px-6 py-4 text-right">
              <button type="button" class="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors delete-item">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </td>
          `;
          itemsTableBody.appendChild(newRow);
          
          // Calculate amount for this row
          calculateItemAmount(newRow);
        }
      });
    } else {
      // Add one empty row if no items
      addItemRow(itemsTableBody);
    }
  }
  
  // Load notes (without terms)
  document.getElementById('notes').value = data.notes || '';
  
  // Load payment details
  document.getElementById('include-payment').checked = data.payment?.include || false;
  document.getElementById('bank-name').value = data.payment?.bankName || '';
  document.getElementById('account-holder').value = data.payment?.accountHolder || '';
  document.getElementById('account-number').value = data.payment?.accountNumber || '';
  document.getElementById('routing-number').value = data.payment?.routingNumber || '';
  
  // Recalculate totals
  calculateTotals(itemsTableBody);
}

// Reset form to its initial state
function resetForm() {
  // Reset form fields
  document.getElementById('invoice-form').reset();
  
  const itemsTableBody = document.getElementById('items-table-body');
  if (!itemsTableBody) return;
  
  // Clear ALL item rows 
  itemsTableBody.innerHTML = '';
    
  // Add just one empty row
  addItemRow(itemsTableBody);
  
  // Reset logo preview
  const logoPreviewWrapper = document.getElementById('logo-preview-wrapper');
  const logoPreview = document.getElementById('logo-preview');
  
  if (logoPreviewWrapper && logoPreview) {
    logoPreviewWrapper.classList.add('hidden');
    logoPreview.src = '';
  }
  
  // Reset totals
  calculateTotals(itemsTableBody);
  
  // Set today's date
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
  document.getElementById('invoice-date').value = formattedDate;
}

// Populate preview with current form data
function populatePreview() {
  // Get currency symbol based on selected currency
  const currencySelect = document.getElementById('currency');
  let currencySymbol = '$'; // default to $
  
  if (currencySelect) {
    const currency = currencySelect.value;
    switch (currency) {
      case 'USD': currencySymbol = '$'; break;
      case 'EUR': currencySymbol = '€'; break;
      case 'GBP': currencySymbol = '£'; break;
      case 'CAD': currencySymbol = 'C$'; break;
      case 'AUD': currencySymbol = 'A$'; break;
      case 'JPY': currencySymbol = '¥'; break;
      case 'INR': currencySymbol = '₹'; break;
      case 'CNY': currencySymbol = '¥'; break;
      case 'BRL': currencySymbol = 'R$'; break;
      case 'ZAR': currencySymbol = 'R'; break;
    }
  }
  
  // Populate sender information
  const previewSenderName = document.getElementById('preview-sender-name');
  if (previewSenderName) {
    previewSenderName.textContent = document.getElementById('sender-name')?.value || '';
  }
  
  const senderAddress = document.getElementById('sender-address')?.value || '';
  const previewSenderAddress = document.getElementById('preview-sender-address');
  if (previewSenderAddress) {
    previewSenderAddress.textContent = senderAddress;
  }
  
  const senderEmail = document.getElementById('sender-email')?.value || '';
  const senderPhone = document.getElementById('sender-phone')?.value || '';
  const senderContact = [];
  if (senderEmail) senderContact.push(senderEmail);
  if (senderPhone) senderContact.push(senderPhone);
  const previewSenderContact = document.getElementById('preview-sender-contact');
  if (previewSenderContact) {
    previewSenderContact.textContent = senderContact.join(' | ');
  }
  
  // Populate client information
  const previewClientName = document.getElementById('preview-client-name');
  if (previewClientName) {
    previewClientName.textContent = document.getElementById('client-name')?.value || '';
  }
  
  const clientAddress = document.getElementById('client-address')?.value || '';
  const previewClientAddress = document.getElementById('preview-client-address');
  if (previewClientAddress) {
    previewClientAddress.textContent = clientAddress;
  }
  
  const clientEmail = document.getElementById('client-email')?.value || '';
  const clientPhone = document.getElementById('client-phone')?.value || '';
  const clientContact = [];
  if (clientEmail) clientContact.push(clientEmail);
  if (clientPhone) clientContact.push(clientPhone);
  const previewClientContact = document.getElementById('preview-client-contact');
  if (previewClientContact) {
    previewClientContact.textContent = clientContact.join(' | ');
  }
  
  // Populate invoice information
  const invoiceNumber = document.getElementById('invoice-number')?.value || 'Not specified';
  const previewInvoiceNumber = document.getElementById('preview-invoice-number');
  if (previewInvoiceNumber) {
    previewInvoiceNumber.textContent = invoiceNumber;
  }
  
  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const previewInvoiceDate = document.getElementById('preview-invoice-date');
  if (previewInvoiceDate) {
    previewInvoiceDate.textContent = formatDate(document.getElementById('invoice-date')?.value);
  }
  
  const previewDueDate = document.getElementById('preview-due-date');
  if (previewDueDate) {
    previewDueDate.textContent = formatDate(document.getElementById('due-date')?.value);
  }
  
  // Populate line items
  const previewLineItems = document.getElementById('preview-line-items');
  if (!previewLineItems) return; // Exit if preview elements don't exist
  
  previewLineItems.innerHTML = '';
  
  let subtotal = 0;
  let taxTotal = 0;
  
  const itemsTableBody = document.getElementById('items-table-body');
  if (itemsTableBody) {
    const lineItems = itemsTableBody.querySelectorAll('tr');
    lineItems.forEach(row => {
      const description = row.querySelector('.item-description')?.value || '';
      const quantity = parseFloat(row.querySelector('.item-quantity')?.value) || 0;
      const rate = parseFloat(row.querySelector('.item-rate')?.value) || 0;
      const taxPercent = parseFloat(row.querySelector('.item-tax')?.value) || 0;
      
      const rowSubtotal = quantity * rate;
      const rowTaxAmount = rowSubtotal * (taxPercent / 100);
      const rowTotal = rowSubtotal + rowTaxAmount;
      
      subtotal += rowSubtotal;
      taxTotal += rowTaxAmount;
      
      // Skip empty rows - make sure to check ALL criteria
      if (!description && quantity === 0 && rate === 0) return;
      
      const newRow = document.createElement('tr');
      newRow.innerHTML = `
        <td class="px-6 py-4 whitespace-normal">
          <div class="text-gray-900 dark:text-white">${description}</div>
        </td>
        <td class="px-6 py-4 text-right text-gray-900 dark:text-white">${quantity}</td>
        <td class="px-6 py-4 text-right text-gray-900 dark:text-white">${currencySymbol}${rate.toFixed(2)}</td>
        <td class="px-6 py-4 text-right text-gray-900 dark:text-white">${taxPercent}%</td>
        <td class="px-6 py-4 text-right text-gray-900 dark:text-white font-medium">${currencySymbol}${rowTotal.toFixed(2)}</td>
      `;
      previewLineItems.appendChild(newRow);
    });
  }
  
  const total = subtotal + taxTotal;
  
  // Set currency symbols - Add null checks to prevent "Cannot set properties of null" error
  const previewCurrencySymbol = document.getElementById('preview-currency-symbol');
  if (previewCurrencySymbol) {
    previewCurrencySymbol.textContent = currencySymbol;
  }
  
  const previewCurrencySymbolTax = document.getElementById('preview-currency-symbol-tax');
  if (previewCurrencySymbolTax) {
    previewCurrencySymbolTax.textContent = currencySymbol;
  }
  
  const previewCurrencySymbolTotal = document.getElementById('preview-currency-symbol-total');
  if (previewCurrencySymbolTotal) {
    previewCurrencySymbolTotal.textContent = currencySymbol;
  }
  
  // Update totals
  const previewSubtotal = document.getElementById('preview-subtotal');
  if (previewSubtotal) {
    previewSubtotal.textContent = subtotal.toFixed(2);
  }
  
  const previewTaxTotal = document.getElementById('preview-tax-total');
  if (previewTaxTotal) {
    previewTaxTotal.textContent = taxTotal.toFixed(2);
  }
  
  const previewInvoiceTotal = document.getElementById('preview-invoice-total');
  if (previewInvoiceTotal) {
    previewInvoiceTotal.textContent = total.toFixed(2);
  }
  
  // Notes and terms
  const notes = document.getElementById('notes')?.value || '';
  const previewNotes = document.getElementById('preview-notes');
  const notesSection = document.getElementById('notes-section');

  if (previewNotes) {
    if (notes && notes.trim() !== '') {
      // Only show notes section if there are actual notes
      previewNotes.textContent = notes;
      if (notesSection) {
        notesSection.style.display = 'block';
      }
    } else {
      previewNotes.textContent = '';
      if (notesSection) {
        notesSection.style.display = 'none';
      }
    }
  }
  
  // Payment details with proper styling and spacing
  const bankName = document.getElementById('bank-name')?.value || '';
  const accountHolder = document.getElementById('account-holder')?.value || '';
  const accountNumber = document.getElementById('account-number')?.value || '';
  const routingNumber = document.getElementById('routing-number')?.value || '';

  // Update hidden elements used for data extraction
  const previewBankName = document.getElementById('preview-bank-name');
  if (previewBankName) {
    previewBankName.textContent = bankName || 'Not specified';
  }
  
  const previewAccountHolder = document.getElementById('preview-account-holder');
  if (previewAccountHolder) {
    previewAccountHolder.textContent = accountHolder || 'Not specified';
  }
  
  const previewAccountNumber = document.getElementById('preview-account-number');
  if (previewAccountNumber) {
    previewAccountNumber.textContent = accountNumber || 'Not specified';
  }
  
  const previewRoutingNumber = document.getElementById('preview-routing-number');
  if (previewRoutingNumber) {
    previewRoutingNumber.textContent = routingNumber || 'Not specified';
  }

  // Show/hide and format payment details based on toggle
  const includePayment = document.getElementById('include-payment')?.checked || false;
  const bankDetailsSection = document.getElementById('bank-details-section');
  
  if (bankDetailsSection) {
    bankDetailsSection.style.display = includePayment ? 'block' : 'none';

    // Format the displayed payment details with proper spacing and styling
    if (includePayment) {
      bankDetailsSection.innerHTML = `
        <h3 class="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Payment Details</h3>
        <div class="space-y-2">
          <p><span class="font-medium">Bank Name:</span>         <span class="payment-value">${bankName || 'Not specified'}</span></p>
          <p><span class="font-medium">Account Holder:</span>    <span class="payment-value">${accountHolder || 'Not specified'}</span></p>
          <p><span class="font-medium">Account Number:</span>    <span class="payment-value">${accountNumber || 'Not specified'}</span></p>
          <p><span class="font-medium">Routing/SWIFT/IBAN:</span> <span class="payment-value">${routingNumber || 'Not specified'}</span></p>
        </div>
      `;
    }
  }

  // Logo 
  const previewLogo = document.getElementById('preview-logo');
  if (!previewLogo) return;
  
  previewLogo.innerHTML = '';
  
  const logoPreview = document.getElementById('logo-preview');
  if (logoPreview && logoPreview.src && logoPreview.src !== window.location.href) {
    const img = document.createElement('img');
    img.src = logoPreview.src;
    img.alt = 'Company Logo';
    img.classList.add('max-h-20');
    previewLogo.appendChild(img);
  } else {
    // If no logo, display the company name in a stylish way
    const companyName = document.getElementById('sender-name')?.value || '';
    if (companyName) {
      const nameEl = document.createElement('div');
      nameEl.textContent = companyName;
      nameEl.classList.add('text-2xl', 'font-bold', 'text-gray-900', 'dark:text-white');
      previewLogo.appendChild(nameEl);
    }
  }
}