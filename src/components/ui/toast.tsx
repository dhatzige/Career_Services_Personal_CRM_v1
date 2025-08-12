interface ToastOptions {
  duration?: number;
}

class Toast {
  private showToast(message: string, type: 'success' | 'error' | 'info' | 'warning', options?: ToastOptions) {
    const duration = options?.duration || 3000;
    
    // Create toast element
    const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
    const toast = document.createElement('div');
    
    const typeClasses = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500',
      warning: 'bg-yellow-500',
    };
    
    toast.className = `${typeClasses[type]} text-white px-6 py-3 rounded-lg shadow-lg mb-4 transform transition-all duration-300 translate-x-full`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
      toast.classList.add('translate-x-0');
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
      toast.classList.remove('translate-x-0');
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  }
  
  private createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-4 right-4 z-50';
    document.body.appendChild(container);
    return container;
  }
  
  success(message: string, options?: ToastOptions) {
    this.showToast(message, 'success', options);
  }
  
  error(message: string, options?: ToastOptions) {
    this.showToast(message, 'error', options);
  }
  
  info(message: string, options?: ToastOptions) {
    this.showToast(message, 'info', options);
  }
  
  warning(message: string, options?: ToastOptions) {
    this.showToast(message, 'warning', options);
  }
}

export const toast = new Toast();