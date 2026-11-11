import toast from 'react-hot-toast';

export const showToast = {
  success: (message) => {
    toast.success(message);
  },
  error: (message) => {
    toast.error(message);
  },
  loading: (message) => {
    return toast.loading(message);
  },
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },
  custom: (message, options) => {
    toast(message, options);
  },
};

export default showToast;
