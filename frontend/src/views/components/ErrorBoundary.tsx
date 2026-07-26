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

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // console.error intentionally removed as requested
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg-dark text-white p-4 text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Đã có lỗi xảy ra</h2>
          <p className="text-slate-400 max-w-md">
            Ứng dụng không thể tải được một số thành phần (có thể do kết nối mạng hoặc trình chặn quảng cáo chặn script của Google). Vui lòng tải lại trang.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90"
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
