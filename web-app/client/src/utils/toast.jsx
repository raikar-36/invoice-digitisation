import toast from 'react-hot-toast';

// Centralized toast notification utilities
export const showToast = {
  success: (message) => {
    toast.success(message, {
      duration: 3000,
      position: 'bottom-center',
      style: {
        background: '#10B981',
        color: '#fff',
        padding: '14px 20px',
        borderRadius: '10px',
        fontWeight: '500',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        marginBottom: '80px',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10B981',
      },
    });
  },

  error: (message) => {
    toast.error(message, {
      duration: 4000,
      position: 'bottom-center',
      style: {
        background: '#EF4444',
        color: '#fff',
        padding: '14px 20px',
        borderRadius: '10px',
        fontWeight: '500',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        marginBottom: '80px',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#EF4444',
      },
    });
  },

  warning: (message) => {
    toast(message, {
      duration: 3000,
      position: 'bottom-center',
      icon: '⚠️',
      style: {
        background: '#F59E0B',
        color: '#fff',
        padding: '14px 20px',
        borderRadius: '10px',
        fontWeight: '500',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        marginBottom: '80px',
      },
    });
  },

  info: (message) => {
    toast(message, {
      duration: 3000,
      position: 'bottom-center',
      icon: 'ℹ️',
      style: {
        background: '#3B82F6',
        color: '#fff',
        padding: '14px 20px',
        borderRadius: '10px',
        fontWeight: '500',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        marginBottom: '80px',
      },
    });
  },

  loading: (message) => {
    return toast.loading(message, {
      position: 'bottom-center',
      style: {
        background: '#6366F1',
        color: '#fff',
        padding: '14px 20px',
        borderRadius: '10px',
        fontWeight: '500',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        marginBottom: '80px',
      },
    });
  },

  promise: (promise, messages) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Processing...',
        success: messages.success || 'Success!',
        error: messages.error || 'Something went wrong',
      },
      {
        position: 'bottom-center',
        style: {
          padding: '14px 20px',
          borderRadius: '10px',
          fontWeight: '500',
          fontSize: '14px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          marginBottom: '80px',
        },
      }
    );
  },
};

// Confirmation dialog with toast
export const confirmAction = (message, onConfirm) => {
  const toastId = toast(
    (t) => (
      <div>
        <p className="mb-3 font-medium">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              onConfirm();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            Confirm
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    ),
    {
      duration: Infinity,
      position: 'top-center',
      style: {
        padding: '20px',
        borderRadius: '12px',
        maxWidth: '500px',
      },
    }
  );
  return toastId;
};

export default showToast;
