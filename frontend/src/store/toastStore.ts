import { create } from 'zustand';

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  visible: boolean;
}

interface ToastState {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  closeToast: (id: number) => void;
}

let _counter = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  showToast: (message: string, type: ToastType = "info", duration = 4000) => {
    const id = ++_counter;
    
    // Add toast initially hidden
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, visible: false }]
    }));
    
    // Trigger animation in next frame
    requestAnimationFrame(() => {
      set((state) => ({
        toasts: state.toasts.map(t => t.id === id ? { ...t, visible: true } : t)
      }));
    });

    // Auto close
    setTimeout(() => {
      get().closeToast(id);
    }, duration);
  },

  closeToast: (id: number) => {
    // Start hide animation
    set((state) => ({
      toasts: state.toasts.map(t => t.id === id ? { ...t, visible: false } : t)
    }));
    
    // Remove from array after animation completes
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }));
    }, 300);
  }
}));
