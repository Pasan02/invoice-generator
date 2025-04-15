/**
 * Invoice form progress bar handler
 * Tracks and updates the progress bar as users navigate through tabs
 */

// Progress tracking configuration
const progressConfig = {
  tabs: ['sender', 'client', 'invoice', 'items', 'notes', 'payment'],
  tabLabels: {
    'sender': 'Step 1 of 6: Sender Details',
    'client': 'Step 2 of 6: Client Details',
    'invoice': 'Step 3 of 6: Invoice Details',
    'items': 'Step 4 of 6: Line Items',
    'notes': 'Step 5 of 6: Notes',
    'payment': 'Step 6 of 6: Payment Details'
  },
  // Percentage completed at each step
  percentages: {
    'sender': 16,
    'client': 33,
    'invoice': 50,
    'items': 67,
    'notes': 84,
    'payment': 100
  }
};

/**
 * Initialize progress bar functionality
 */
export function initProgressBar() {
  // Listen for tab changes to update progress
  document.addEventListener('set-active-tab', function(e) {
    updateProgress(e.detail.tabId);
  });
  
  // Update based on tab link clicks
  const tabLinks = document.querySelectorAll('.tab-link');
  tabLinks.forEach(link => {
    link.addEventListener('click', function() {
      updateProgress(this.getAttribute('data-tab'));
    });
  });
  
  // Set initial progress state
  const activeTab = document.querySelector('.tab-link.active');
  if (activeTab) {
    updateProgress(activeTab.getAttribute('data-tab'));
  } else {
    // Default to first tab
    updateProgress('sender');
  }
}

/**
 * Update progress bar based on current tab
 * @param {string} tabId - The ID of the active tab
 */
function updateProgress(tabId) {
  const progressBar = document.getElementById('progress-bar');
  const progressLabel = document.getElementById('progress-label');
  const progressPercentage = document.getElementById('progress-percentage');
  
  if (!progressBar || !progressLabel || !progressPercentage) return;
  
  // Get percentage for current tab
  const percentage = progressConfig.percentages[tabId] || 0;
  
  // Animate the progress bar
  animateProgressBar(progressBar, percentage);
  
  // Update the label and percentage text
  progressLabel.textContent = progressConfig.tabLabels[tabId] || '';
  progressPercentage.textContent = `${percentage}%`;
}

/**
 * Animate progress bar to target percentage
 * @param {HTMLElement} progressBar - The progress bar element
 * @param {number} targetPercentage - The target percentage
 */
function animateProgressBar(progressBar, targetPercentage) {
  // Get current width
  const currentWidth = parseInt(progressBar.style.width) || 0;
  
  // Calculate step size for smooth animation (smaller = smoother but slower)
  const step = currentWidth < targetPercentage ? 1 : -1;
  
  // Perform the animation
  let currentStep = currentWidth;
  
  const animate = () => {
    if ((step > 0 && currentStep < targetPercentage) || 
        (step < 0 && currentStep > targetPercentage)) {
      currentStep += step;
      progressBar.style.width = `${currentStep}%`;
      requestAnimationFrame(animate);
    } else {
      // Ensure final percentage is exact
      progressBar.style.width = `${targetPercentage}%`;
    }
  };
  
  requestAnimationFrame(animate);
}