/**
 * invoice-features.js
 * Advanced features for the Invoice Generator
 */

/**
 * Initializes advanced features for the invoice generator.
 * This includes QR code functionality, recurring invoices, 
 * invoice status tracking and any other advanced capabilities.
 */
export function initAdvancedFeatures() {
  document.addEventListener('DOMContentLoaded', function() {
    initRecurringInvoices();
    initAdvancedFormFields();
    initThemeToggle();
    initTaxCalculator();
    initDiscountFields();
    initDueDateCalculator();
    initCurrencyConverter();
    initInvoiceAnalytics();
  });
}

/**
 * Initialize recurring invoices functionality
 */
function initRecurringInvoices() {
  const recurringSection = document.getElementById('recurring-invoice-section');
  const recurringToggle = document.getElementById('recurring-toggle');
  
  if (recurringToggle && recurringSection) {
    recurringToggle.addEventListener('change', function() {
      if (this.checked) {
        recurringSection.classList.remove('hidden');
      } else {
        recurringSection.classList.add('hidden');
      }
    });
    
    // Setup frequency selector
    const frequencySelect = document.getElementById('recurring-frequency');
    if (frequencySelect) {
      frequencySelect.addEventListener('change', function() {
        updateNextInvoiceDates();
      });
    }
    
    // Setup start date
    const startDateInput = document.getElementById('recurring-start-date');
    if (startDateInput) {
      // Set default to today if not already set
      if (!startDateInput.value) {
        const today = new Date().toISOString().split('T')[0];
        startDateInput.value = today;
      }
      
      startDateInput.addEventListener('change', function() {
        updateNextInvoiceDates();
      });
    }
    
    updateNextInvoiceDates();
  }
}

/**
 * Update the next invoice dates based on frequency and start date
 */
function updateNextInvoiceDates() {
  const frequencySelect = document.getElementById('recurring-frequency');
  const startDateInput = document.getElementById('recurring-start-date');
  const nextDatesContainer = document.getElementById('next-invoice-dates');
  
  if (frequencySelect && startDateInput && nextDatesContainer) {
    const frequency = frequencySelect.value;
    const startDate = new Date(startDateInput.value);
    
    if (isNaN(startDate.getTime())) {
      nextDatesContainer.innerHTML = '<p class="text-red-500">Please enter a valid start date</p>';
      return;
    }
    
    // Calculate next 3 dates
    const dates = calculateNextDates(startDate, frequency, 3);
    
    // Display dates
    nextDatesContainer.innerHTML = '<p class="text-sm text-gray-500 mb-2">Next Invoice Dates:</p>';
    const dateList = document.createElement('ul');
    dateList.className = 'text-sm text-gray-700 dark:text-gray-300 space-y-1';
    
    dates.forEach(date => {
      const listItem = document.createElement('li');
      listItem.textContent = formatDate(date);
      dateList.appendChild(listItem);
    });
    
    nextDatesContainer.appendChild(dateList);
  }
}

/**
 * Calculate next dates based on frequency
 */
function calculateNextDates(startDate, frequency, count) {
  const dates = [];
  let currentDate = new Date(startDate);
  
  for (let i = 0; i < count; i++) {
    currentDate = new Date(currentDate);
    
    switch (frequency) {
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'biweekly':
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'quarterly':
        currentDate.setMonth(currentDate.getMonth() + 3);
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;
    }
    
    dates.push(new Date(currentDate));
  }
  
  return dates;
}

/**
 * Initialize advanced form fields
 */
function initAdvancedFormFields() {
  // Initialize any advanced form fields here
  const advancedToggle = document.getElementById('show-advanced-options');
  const advancedFields = document.getElementById('advanced-fields');
  
  if (advancedToggle && advancedFields) {
    advancedToggle.addEventListener('change', function() {
      if (this.checked) {
        advancedFields.classList.remove('hidden');
      } else {
        advancedFields.classList.add('hidden');
      }
    });
  }
}

/**
 * Initialize theme toggle
 */
function initThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  
  if (themeToggle) {
    // Check for saved theme preference or respect OS preference
    if (localStorage.getItem('color-theme') === 'dark' || 
        (!localStorage.getItem('color-theme') && 
         window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      themeToggle.checked = true;
    }
    
    // Add event listener for theme toggle
    themeToggle.addEventListener('change', function() {
      if (this.checked) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('color-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('color-theme', 'light');
      }
    });
  }
}

/**
 * Initialize tax calculator
 */
function initTaxCalculator() {
  const taxCalculatorBtn = document.getElementById('tax-calculator-btn');
  const taxCalculatorModal = document.getElementById('tax-calculator-modal');
  
  if (taxCalculatorBtn && taxCalculatorModal) {
    taxCalculatorBtn.addEventListener('click', function() {
      taxCalculatorModal.classList.remove('hidden');
    });
    
    // Close button
    const closeBtn = taxCalculatorModal.querySelector('.close-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        taxCalculatorModal.classList.add('hidden');
      });
    }
    
    // Calculate button
    const calculateBtn = document.getElementById('calculate-tax-btn');
    const amountInput = document.getElementById('tax-amount');
    const rateInput = document.getElementById('tax-rate');
    const resultElement = document.getElementById('tax-result');
    
    if (calculateBtn && amountInput && rateInput && resultElement) {
      calculateBtn.addEventListener('click', function() {
        const amount = parseFloat(amountInput.value);
        const rate = parseFloat(rateInput.value);
        
        if (isNaN(amount) || isNaN(rate)) {
          resultElement.textContent = 'Please enter valid numbers';
          return;
        }
        
        const taxAmount = amount * (rate / 100);
        const total = amount + taxAmount;
        
        resultElement.innerHTML = `
          <div class="mt-4">
            <p>Tax Amount: $${taxAmount.toFixed(2)}</p>
            <p>Total: $${total.toFixed(2)}</p>
          </div>
        `;
      });
    }
  }
}

/**
 * Initialize discount fields
 */
function initDiscountFields() {
  const discountToggle = document.getElementById('enable-discount');
  const discountFields = document.getElementById('discount-fields');
  
  if (discountToggle && discountFields) {
    discountToggle.addEventListener('change', function() {
      if (this.checked) {
        discountFields.classList.remove('hidden');
      } else {
        discountFields.classList.add('hidden');
      }
    });
    
    // Discount type select
    const discountType = document.getElementById('discount-type');
    const discountValue = document.getElementById('discount-value');
    
    if (discountType && discountValue) {
      discountType.addEventListener('change', function() {
        const type = this.value;
        if (type === 'percentage') {
          discountValue.setAttribute('max', '100');
          discountValue.nextElementSibling.textContent = '%';
        } else {
          discountValue.removeAttribute('max');
          discountValue.nextElementSibling.textContent = '$';
        }
      });
    }
  }
}

/**
 * Initialize due date calculator
 */
function initDueDateCalculator() {
  const invoiceDateInput = document.getElementById('invoice-date');
  const dueDateInput = document.getElementById('due-date');
  const dueDaysInput = document.getElementById('due-days');
  
  if (invoiceDateInput && dueDateInput && dueDaysInput) {
    // Set default due days if not set
    if (!dueDaysInput.value) {
      dueDaysInput.value = '30';
    }
    
    // Calculate due date when invoice date or days change
    const calculateDueDate = function() {
      const invoiceDate = new Date(invoiceDateInput.value);
      const dueDays = parseInt(dueDaysInput.value);
      
      if (isNaN(invoiceDate.getTime()) || isNaN(dueDays)) {
        return;
      }
      
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + dueDays);
      
      dueDateInput.value = dueDate.toISOString().split('T')[0];
    };
    
    invoiceDateInput.addEventListener('change', calculateDueDate);
    dueDaysInput.addEventListener('input', calculateDueDate);
    
    // If invoice date exists but due date doesn't, calculate it
    if (invoiceDateInput.value && !dueDateInput.value) {
      calculateDueDate();
    }
  }
}

/**
 * Initialize currency converter
 */
function initCurrencyConverter() {
  const currencyConverterBtn = document.getElementById('currency-converter-btn');
  const currencyConverterModal = document.getElementById('currency-converter-modal');
  
  if (currencyConverterBtn && currencyConverterModal) {
    currencyConverterBtn.addEventListener('click', function() {
      currencyConverterModal.classList.remove('hidden');
    });
    
    // Close button
    const closeBtn = currencyConverterModal.querySelector('.close-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        currencyConverterModal.classList.add('hidden');
      });
    }
    
    // Conversion functionality
    const convertBtn = document.getElementById('convert-currency-btn');
    if (convertBtn) {
      convertBtn.addEventListener('click', function() {
        const amount = document.getElementById('convert-amount').value;
        const fromCurrency = document.getElementById('from-currency').value;
        const toCurrency = document.getElementById('to-currency').value;
        const resultElement = document.getElementById('conversion-result');
        
        if (!amount || isNaN(amount) || amount <= 0) {
          resultElement.textContent = 'Please enter a valid amount';
          return;
        }
        
        // In a real app, we would call an API to get exchange rates
        // For this demo, we'll use simplified static rates
        const exchangeRates = {
          USD: 1,
          EUR: 0.85,
          GBP: 0.73,
          JPY: 110.22,
          CAD: 1.25,
          AUD: 1.35,
          INR: 74.5,
          CNY: 6.45
        };
        
        const fromRate = exchangeRates[fromCurrency];
        const toRate = exchangeRates[toCurrency];
        
        if (fromRate && toRate) {
          const result = (amount / fromRate) * toRate;
          resultElement.textContent = `${amount} ${fromCurrency} = ${result.toFixed(2)} ${toCurrency}`;
        } else {
          resultElement.textContent = 'Conversion rate not available';
        }
      });
    }
  }
}

/**
 * Initialize invoice analytics
 */
function initInvoiceAnalytics() {
  const analyticsBtn = document.getElementById('show-analytics-btn');
  const analyticsModal = document.getElementById('analytics-modal');
  
  if (analyticsBtn && analyticsModal) {
    analyticsBtn.addEventListener('click', function() {
      analyticsModal.classList.remove('hidden');
      
      // In a real app, we'd load actual data
      // For now, generate some sample data
      generateSampleAnalytics();
    });
    
    // Close button
    const closeBtn = analyticsModal.querySelector('.close-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        analyticsModal.classList.add('hidden');
      });
    }
  }
}

/**
 * Generate sample analytics data
 */
function generateSampleAnalytics() {
  const statsElement = document.getElementById('invoice-stats');
  
  if (statsElement) {
    // In a real app, this would come from a database or API
    const stats = {
      totalInvoices: 24,
      paid: 18,
      unpaid: 4,
      overdue: 2,
      totalRevenue: 15750.85,
      averageValue: 656.28,
      averageTime: 8.3
    };
    
    statsElement.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Invoices</h3>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">${stats.totalInvoices}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Revenue</h3>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">$${stats.totalRevenue.toFixed(2)}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">Average Invoice Value</h3>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">$${stats.averageValue.toFixed(2)}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">Paid Invoices</h3>
          <p class="text-2xl font-bold text-green-600 dark:text-green-400">${stats.paid}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">Unpaid Invoices</h3>
          <p class="text-2xl font-bold text-yellow-500">${stats.unpaid}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">Overdue Invoices</h3>
          <p class="text-2xl font-bold text-red-500">${stats.overdue}</p>
        </div>
      </div>
      <div class="mt-6">
        <p class="text-sm text-gray-500 dark:text-gray-400">Average payment time: ${stats.averageTime} days</p>
      </div>
    `;
  }
}

/**
 * Format date for display
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) return '';
  
  return date.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}