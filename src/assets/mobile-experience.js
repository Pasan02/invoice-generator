/**
 * Mobile Experience Enhancements
 * Improves the invoice form experience on mobile devices
 */

export function initMobileExperience() {
  // Only run mobile optimizations if on a mobile device
  if (isMobileDevice()) {
    handleSafeAreas();
    initMobileLayout();
    preventDoubleTapZoom();
    initSwipeNavigation();
    detectGestures();
    initTouchFriendlyInputs();
    initInvoiceActionButtons();
    
    // Update mobile experience on orientation change
    window.addEventListener('orientationchange', function() {
      setTimeout(updateOrientation, 100);
      setTimeout(updateFixedButtonsPosition, 100);
    });
    
    // Initial orientation setup
    updateOrientation();
    updateFixedButtonsPosition();
  }
}

/**
 * Check if we're on a mobile device
 */
function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.matchMedia && window.matchMedia('(max-width: 768px)').matches)
  );
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
 * Initialize invoice action buttons for mobile 
 */
function initInvoiceActionButtons() {
  // Handle action buttons on invoice preview for mobile
  document.addEventListener('DOMContentLoaded', function() {
    const invoicePreview = document.getElementById('invoice-preview');
    if (invoicePreview) {
      // Make sure action buttons stack properly on mobile
      const actionButtons = invoicePreview.querySelectorAll('.flex.flex-wrap > button, .flex.flex-wrap > div');
      
      // Apply full-width styling to the action buttons on small screens
      if (window.innerWidth < 640) {
        actionButtons.forEach(button => {
          button.style.width = '100%';
          button.style.marginBottom = '0.5rem';
          button.style.justifyContent = 'center';
        });
      }
      
      // Update button styling when preview becomes visible
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class' && 
              !invoicePreview.classList.contains('hidden')) {
            // Slight delay to allow the DOM to settle
            setTimeout(() => {
              if (window.innerWidth < 640) {
                actionButtons.forEach(button => {
                  button.style.width = '100%';
                  button.style.marginBottom = '0.5rem';
                  button.style.justifyContent = 'center';
                });
              }
            }, 50);
          }
        });
      });
      
      observer.observe(invoicePreview, { attributes: true });
    }
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
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}