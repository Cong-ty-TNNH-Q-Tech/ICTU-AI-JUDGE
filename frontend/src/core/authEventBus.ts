/**
 * Auth Event Bus — Pub/Sub pattern cho auth-related events.
 * Tách rời apiClient (module cấp thấp) khỏi store (module cấp cao),
 * tránh circular dependency trong tương lai.
 */
type AuthEventHandler = () => void;

const listeners = new Set<AuthEventHandler>();

export const authEventBus = {
  /** Đăng ký listener — trả về hàm unsubscribe */
  on(handler: AuthEventHandler): () => void {
    listeners.add(handler);
    return () => listeners.delete(handler);
  },

  /** Emit sự kiện unauthorized cho tất cả listeners */
  emit() {
    listeners.forEach((fn) => fn());
  },
};
