/**
 * Mobile Experience Enhancements
 * Improves the invoice form experience on mobile devices
 */

export function initMobileExperience() {
  const mobileWidth = 768; // Match your md: breakpoint
  
  // Create a form stepper for mobile
  function createMobileFormStepper() {
    const formSections = document.querySelectorAll('.tab-pane');
    const currentTab = document.querySelector('.tab-link.active')?.dataset.tab;
    
    // Show back/next floating buttons on mobile
    const navButtonContainer = document.createElement('div');
    navButtonContainer.className = 'md:hidden fixed bottom-4 left-0 right-0 flex justify-between px-4 z-30';
    navButtonContainer.id = 'mobile-form-nav';
    
    const backButton = document.createElement('button');
    backButton.className = 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white px-6 py-3 rounded-lg shadow-lg';
    backButton.innerHTML = '<span class="flex items-center"><svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg> Back</span>';
    
    const nextButton = document.createElement('button');
    nextButton.className = 'bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg shadow-lg';
    nextButton.innerHTML = '<span class="flex items-center">Next <svg class="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></span>';
    
    navButtonContainer.appendChild(backButton);
    navButtonContainer.appendChild(nextButton);
    
    document.body.appendChild(navButtonContainer);
    
    // Handle back/next logic
    backButton.addEventListener('click', function() {
      const tabLinks = document.querySelectorAll('.tab-link');
      const currentIndex = Array.from(tabLinks).findIndex(link => link.classList.contains('active'));
      
      if (currentIndex > 0) {
        window.setActiveTab(tabLinks[currentIndex - 1].dataset.tab);
      }
    });
    
    nextButton.addEventListener('click', function() {
      const tabLinks = document.querySelectorAll('.tab-link');
      const currentIndex = Array.from(tabLinks).findIndex(link => link.classList.contains('active'));
      
      if (currentIndex < tabLinks.length - 1) {
        window.setActiveTab(tabLinks[currentIndex + 1].dataset.tab);
      } else {
        // On last tab, trigger preview
        document.getElementById('preview-button')?.click();
      }
    });
  }

  // Call on load and resize
  function toggleMobileExperience() {
    const isMobile = window.innerWidth < mobileWidth;
    
    // Remove existing mobile nav if present
    document.getElementById('mobile-form-nav')?.remove();
    
    if (isMobile) {
      createMobileFormStepper();
    }
  }

  // Initialize
  toggleMobileExperience();
  window.addEventListener('resize', toggleMobileExperience);
}

/**
 * Check if we're on a mobile device
 */
function isMobileDevice() {
  return window.innerWidth <= 768 || 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Update UI elements based on orientation
 */
function updateOrientation() {
  const isLandscape = window.matchMedia("(orientation: landscape)").matches;
  const formElements = document.querySelectorAll('.form-container');
  
  formElements.forEach(el => {
    if (isLandscape) {
      el.classList.add('landscape-mode');
    } else {
      el.classList.remove('landscape-mode');
    }
  });
  
  // Adjust footer position in landscape
  const footers = document.querySelectorAll('.sticky-footer');
  footers.forEach(footer => {
    if (isLandscape && window.innerHeight < 500) {
      footer.style.position = 'static';
    } else {
      footer.style.position = 'fixed';
    }
  });
}

/**
 * Handle safe areas for notched devices
 */
function handleSafeAreas() {
  const safeAreaElements = document.querySelectorAll('.safe-area-inset-bottom');
  safeAreaElements.forEach(el => {
    // Add padding for bottom safe area (home indicator area)
    el.style.paddingBottom = 'env(safe-area-inset-bottom, 0.5rem)';
  });
  
  const topElements = document.querySelectorAll('.safe-area-inset-top');
  topElements.forEach(el => {
    // Add padding for top safe area (notch area)
    el.style.paddingTop = 'env(safe-area-inset-top, 0.5rem)';
  });
}

/**
 * Initialize mobile-optimized layout
 */
function initMobileLayout() {
  // Adjust form paddings and margins
  const formElements = document.querySelectorAll('.form-input, .form-textarea, .form-select');
  formElements.forEach(el => {
    el.classList.add('p-3'); // Larger touch targets
  });
  
  // Make mobile buttons more touchable
  const buttons = document.querySelectorAll('button:not(.tab-link)');
  buttons.forEach(btn => {
    btn.classList.add('touch-action-manipulation', 'min-h-[44px]');
  });
  
  // Add momentum scrolling to all scrollable containers
  const scrollContainers = document.querySelectorAll('.tab-content, .scrollable');
  scrollContainers.forEach(container => {
    container.classList.add('momentum-scroll');
  });
}

/**
 * Prevent double-tap zoom on mobile
 */
function preventDoubleTapZoom() {
  // Add to all interactive elements that shouldn't zoom
  const noZoomElements = document.querySelectorAll('button, a, .interactive');
  noZoomElements.forEach(el => {
    el.addEventListener('touchend', (e) => {
      e.preventDefault();
      // Still trigger the click for the element
      el.click();
    }, { passive: false });
  });
}

/**
 * Enable swipe navigation between tabs
 */
function initSwipeNavigation() {
  const tabContent = document.querySelector('.tab-content');
  let touchstartX = 0;
  let touchendX = 0;
  const minSwipeDistance = 100; // Minimum swipe distance to trigger navigation
  
  if (!tabContent) return;
  
  tabContent.addEventListener('touchstart', e => {
    touchstartX = e.changedTouches[0].screenX;
  }, { passive: true });
  
  tabContent.addEventListener('touchend', e => {
    touchendX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });
  
  function handleSwipe() {
    const swipeDistance = touchendX - touchstartX;
    
    if (Math.abs(swipeDistance) < minSwipeDistance) return; // Too short swipe
    
    const activeTab = document.querySelector('.tab-pane:not(.hidden)');
    if (!activeTab) return;
    
    const activeTabId = activeTab.id.replace('-tab', '');
    const tabs = ['sender', 'client', 'invoice', 'items', 'notes', 'payment'];
    const currentIndex = tabs.indexOf(activeTabId);
    
    if (swipeDistance > 0) {
      // Swipe right - go to previous tab
      if (currentIndex > 0) {
        const prevTab = tabs[currentIndex - 1];
        document.querySelector(`.prev-tab[data-prev="${prevTab}"]`)?.click();
        // Add haptic feedback on iOS if available
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(50);
        }
      }
    } else {
      // Swipe left - go to next tab
      if (currentIndex < tabs.length - 1) {
        const nextTab = tabs[currentIndex + 1];
        document.querySelector(`.next-tab[data-next="${nextTab}"]`)?.click();
        // Add haptic feedback on iOS if available
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(50);
        }
      }
    }
  }
  
  // Update step dots when tab changes
  document.addEventListener('set-active-tab', function(e) {
    updateStepDots(e.detail.tabId);
  });
}

/**
 * Add pinch-to-zoom for invoice preview and other gesture support
 */
function detectGestures() {
  const previewContainer = document.querySelector('.invoice-preview');
  if (!previewContainer) return;
  
  let initialDistance = 0;
  let currentScale = 1;
  
  previewContainer.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      initialDistance = getDistance(e.touches[0], e.touches[1]);
    }
  }, { passive: true });
  
  previewContainer.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const newScale = currentScale * (currentDistance / initialDistance);
      
      // Limit scaling between 0.5 and 3
      if (newScale >= 0.5 && newScale <= 3) {
        previewContainer.style.transform = `scale(${newScale})`;
        previewContainer.style.transformOrigin = 'center center';
      }
    }
  }, { passive: true });
  
  previewContainer.addEventListener('touchend', () => {
    // Reset zoom gradually using CSS transitions
    if (currentScale !== 1) {
      previewContainer.style.transition = 'transform 0.3s ease-out';
      previewContainer.style.transform = 'scale(1)';
      setTimeout(() => {
        previewContainer.style.transition = '';
        currentScale = 1;
      }, 300);
    }
  });
  
  function getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

/**
 * Update step indicator dots 
 */
function updateStepDots(activeTabId) {
  const stepDots = document.querySelectorAll('.step-dot');
  const tabs = ['sender', 'client', 'invoice', 'items', 'notes', 'payment'];
  const activeIndex = tabs.indexOf(activeTabId);
  
  stepDots.forEach((dot, index) => {
    if (index <= activeIndex) {
      dot.classList.remove('bg-gray-300', 'dark:bg-gray-600');
      dot.classList.add('bg-indigo-600');
    } else {
      dot.classList.add('bg-gray-300', 'dark:bg-gray-600');
      dot.classList.remove('bg-indigo-600');
    }
  });
}

/**
 * Make form inputs more touch-friendly and optimize mobile interactions
 */
function initMobileInteractions() {
  // Add focus/blur handlers for form elements
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      // When user focuses on a field, temporarily hide the fixed footer
      const footers = document.querySelectorAll('.sticky-footer');
      footers.forEach(footer => {
        footer.classList.add('hidden');
      });
    });
    
    input.addEventListener('blur', () => {
      // When user blurs a field, show the footer again
      setTimeout(() => {
        const footers = document.querySelectorAll('.sticky-footer');
        footers.forEach(footer => {
          footer.classList.remove('hidden');
        });
      }, 100);
    });
  });
}

/**
 * Make form inputs more touch-friendly
 */
function initTouchFriendlyInputs() {
  // Increase size of checkboxes and radio toggles
  const toggles = document.querySelectorAll('.relative.w-11');
  toggles.forEach(toggle => {
    toggle.classList.add('w-12', 'h-7');
  });
  
  // Add full-screen numeric keyboard for mobile
  const numericInputs = document.querySelectorAll('input[type="number"]');
  numericInputs.forEach(input => {
    input.setAttribute('inputmode', 'numeric');
    input.setAttribute('pattern', '[0-9]*');
  });
  
  // Add full-screen telephone keyboard
  const phoneInputs = document.querySelectorAll('input[type="tel"]');
  phoneInputs.forEach(input => {
    input.setAttribute('inputmode', 'tel');
  });
  
  // Add email keyboard
  const emailInputs = document.querySelectorAll('input[type="email"]');
  emailInputs.forEach(input => {
    input.setAttribute('inputmode', 'email');
    input.setAttribute('autocapitalize', 'off');
  });
}

/**
 * Handle fixed positioning for action buttons 
 */
function updateFixedButtonsPosition() {
  const footerActions = document.querySelectorAll('.tab-pane:not(.hidden) .flex.justify-between, .tab-pane:not(.hidden) .flex.justify-end');
  
  footerActions.forEach(actionRow => {
    actionRow.classList.add('sticky-footer', 'bg-white', 'dark:bg-slate-900', 'py-3', 'px-4', 'shadow-md', 'safe-area-inset-bottom');
    
    // Only apply if not already modified
    if (!actionRow.style.bottom) {
      actionRow.style.position = 'fixed';
      actionRow.style.bottom = '0';
      actionRow.style.left = '0';
      actionRow.style.right = '0';
      actionRow.style.zIndex = '50';
      
      // Add padding to parent to prevent content from being hidden under fixed footer
      const parentTab = actionRow.closest('.tab-pane');
      if (parentTab) {
        parentTab.style.paddingBottom = '70px';
      }
    }
  });
}

// Utility function to debounce resize events
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}