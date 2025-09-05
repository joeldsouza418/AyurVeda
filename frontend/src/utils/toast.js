import toast from 'react-hot-toast';

// Success toast notification
export const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-center',
    style: {
      background: '#10B981',
      color: '#fff',
      padding: '16px',
      borderRadius: '10px',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10B981',
    },
  });
};

// Error toast notification
export const showError = (message) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-center',
    style: {
      background: '#EF4444',
      color: '#fff',
      padding: '16px',
      borderRadius: '10px',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#EF4444',
    },
  });
};

// Info toast notification
export const showInfo = (message) => {
  toast(message, {
    duration: 3000,
    position: 'top-center',
    style: {
      background: '#3B82F6',
      color: '#fff',
      padding: '16px',
      borderRadius: '10px',
    },
    icon: 'ℹ️',
  });
};

// Loading toast notification
export const showLoading = (message) => {
  return toast.loading(message, {
    position: 'top-center',
    style: {
      background: '#6B7280',
      color: '#fff',
      padding: '16px',
      borderRadius: '10px',
    },
  });
};

// Dismiss a specific toast by its ID
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

// Dismiss all toasts
export const dismissAllToasts = () => {
  toast.dismiss();
};