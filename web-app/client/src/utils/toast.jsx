import { toast } from 'sonner';

// Modern toast notification utilities using Sonner with shadcn/ui
export const showToast = {
  success: (message) => {
    toast.success(message);
  },

  error: (message) => {
    toast.error(message);
  },

  warning: (message) => {
    toast.warning(message);
  },

  info: (message) => {
    toast.info(message);
  },

  loading: (message) => {
    return toast.loading(message);
  },

  promise: (promise, messages) => {
    return toast.promise(promise, {
      loading: messages.loading || 'Processing...',
      success: messages.success || 'Success!',
      error: messages.error || 'Something went wrong',
    });
  },
};

// Confirmation dialog - Note: For confirmation dialogs, use AlertDialog component from shadcn instead
export const confirmAction = (message, onConfirm) => {
  // This is deprecated - use AlertDialog component for confirmations
  console.warn('confirmAction is deprecated. Please use AlertDialog component from shadcn/ui');
  const confirmed = window.confirm(message);
  if (confirmed) {
    onConfirm();
  }
};

export default showToast;
