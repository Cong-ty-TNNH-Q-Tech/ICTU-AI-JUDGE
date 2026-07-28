import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // console.error intentionally removed as requested
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="w-full flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface dark:bg-surface-dark rounded-xl border border-surface-200 dark:border-gray-800 shadow-sm min-h-[50vh]">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-content-primary dark:text-content-dark-primary mb-2">Đã có lỗi xảy ra</h2>
          <p className="text-[14px] text-content-secondary dark:text-content-dark-secondary max-w-md mb-6">
            Không thể tải được nội dung (có thể do kết nối mạng hoặc lỗi dữ liệu). Vui lòng tải lại trang.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary px-6 py-2"
          >
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
