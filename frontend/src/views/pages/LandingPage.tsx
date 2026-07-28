import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store';
import ictuLogo from '../../assets/ictu-logo.png';

const LandingPage: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-background-dark flex flex-col font-inter selection:bg-primary-500/30 overflow-x-hidden">
      {/* Navbar */}
      <nav className="w-full px-6 py-4 flex justify-between items-center bg-white/70 dark:bg-surface-dark/70 backdrop-blur-xl sticky top-0 z-50 border-b border-surface-200 dark:border-gray-800 transition-all">
        <div className="flex items-center gap-3">
          <img src={ictuLogo} alt="ICTU Logo" className="h-10 w-auto object-contain drop-shadow-sm" />
          <span className="text-2xl font-bold text-primary-700 dark:text-primary-400 tracking-tight">
            ICTU <span className="text-content-primary dark:text-content-dark-primary">AI JUDGE</span>
          </span>
        </div>
        <div>
          {isAuthenticated ? (
            <Link to="/challenges" className="px-6 py-2.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-medium text-sm transition-all shadow-md hover:shadow-lg">
              Vào Bảng Điều Khiển
            </Link>
          ) : (
            <Link to="/login" className="px-6 py-2.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-medium text-sm transition-all shadow-md hover:shadow-lg">
              Đăng Nhập
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex items-center justify-center relative pt-20 pb-32 px-6">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-primary-400/20 dark:bg-primary-600/10 blur-[120px] mix-blend-multiply dark:mix-blend-lighten animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent-400/20 dark:bg-accent-600/10 blur-[120px] mix-blend-multiply dark:mix-blend-lighten" />
          {/* Grid Pattern overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLCAwLCAwLCAwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] z-[-1]" />
        </div>

        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Text */}
          <div className="flex flex-col items-start text-left animate-fade-in-up z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-surface-dark border border-surface-200 dark:border-gray-700 shadow-sm mb-6">
              <span className="flex h-2 w-2 rounded-full bg-success animate-pulse"></span>
              <span className="text-xs font-bold text-content-secondary dark:text-content-dark-secondary uppercase tracking-wider">Hệ thống Đang hoạt động</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-content-primary dark:text-content-dark-primary tracking-tight mb-6 leading-[1.15]">
              Nền tảng thi đấu AI <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500 dark:from-primary-400 dark:to-accent-400">
                Đỉnh cao cho Sinh viên
              </span>
            </h1>
            <p className="text-lg md:text-xl text-content-secondary dark:text-content-dark-secondary mb-10 leading-relaxed max-w-xl font-light">
              Nâng tầm kỹ năng Học máy của bạn với nền tảng đánh giá mô hình tự động độc quyền của Đại học CNTT & Truyền thông (ICTU).
            </p>
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              {isAuthenticated ? (
                <Link to="/challenges" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold text-lg shadow-[0_0_20px_rgba(0,172,193,0.3)] hover:shadow-[0_0_30px_rgba(0,172,193,0.5)] transition-all duration-300 transform hover:-translate-y-1 text-center">
                  Vào Cuộc Thi Ngay
                </Link>
              ) : (
                <Link to="/login" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold text-lg shadow-[0_0_20px_rgba(0,172,193,0.3)] hover:shadow-[0_0_30px_rgba(0,172,193,0.5)] transition-all duration-300 transform hover:-translate-y-1 text-center">
                  Đăng Nhập Để Bắt Đầu
                </Link>
              )}
              <a href="#features" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-surface-dark-hover text-content-primary dark:text-content-dark-primary font-bold text-lg border border-surface-200 dark:border-gray-700 hover:bg-surface-100 dark:hover:bg-gray-800 transition-all duration-300 text-center shadow-sm">
                Tìm Hiểu Thêm
              </a>
            </div>
          </div>
          
          {/* Right Visual / Mockup */}
          <div className="relative animate-fade-in-up hidden md:block" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500 to-accent-400 rounded-2xl transform rotate-3 scale-105 opacity-20 blur-xl dark:opacity-30"></div>
            <div className="relative bg-white dark:bg-surface-dark rounded-2xl border border-surface-200 dark:border-gray-700 shadow-elevated overflow-hidden">
              {/* Window Header */}
              <div className="h-10 border-b border-surface-200 dark:border-gray-800 bg-surface-50 dark:bg-[#1f2937] flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-danger"></div>
                <div className="w-3 h-3 rounded-full bg-warning"></div>
                <div className="w-3 h-3 rounded-full bg-success"></div>
                <div className="ml-4 text-xs font-mono text-content-tertiary">worker_logs.sh</div>
              </div>
              {/* Fake Leaderboard/Code Content */}
              <div className="p-6 font-mono text-sm">
                <div className="flex justify-between items-center pb-4 border-b border-surface-100 dark:border-gray-800 mb-4">
                  <span className="text-content-secondary dark:text-content-dark-secondary">Đang chấm bài...</span>
                  <span className="px-2 py-1 rounded bg-info-light text-info-dark dark:bg-info-dark/30 dark:text-info-light text-xs animate-pulse">Running</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <span className="text-primary-500">➜</span>
                    <span className="text-content-primary dark:text-content-dark-primary">Khởi tạo Docker Sandbox...</span>
                    <span className="text-success ml-auto">OK</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-primary-500">➜</span>
                    <span className="text-content-primary dark:text-content-dark-primary">Kiểm tra định dạng file...</span>
                    <span className="text-success ml-auto">OK</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-primary-500">➜</span>
                    <span className="text-content-primary dark:text-content-dark-primary">Tính toán RMSE Score...</span>
                    <span className="text-content-tertiary ml-auto animate-pulse">Wait</span>
                  </div>
                </div>
                
                <div className="mt-8 pt-4 border-t border-surface-100 dark:border-gray-800">
                  <div className="flex justify-between items-center p-4 rounded-xl bg-success-light/30 dark:bg-success-dark/20 border border-success-light dark:border-success-dark/50">
                    <span className="font-bold text-success-dark dark:text-success-light text-base">✨ Điểm số Private:</span>
                    <span className="font-extrabold text-3xl text-success-dark dark:text-success-light">0.8942</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white dark:bg-surface-dark relative z-10 border-t border-surface-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 animate-fade-in-up">
            <h2 className="text-3xl md:text-5xl font-extrabold text-content-primary dark:text-content-dark-primary mb-6">Tại sao chọn ICTU AI Judge?</h2>
            <p className="text-content-secondary dark:text-content-dark-secondary max-w-3xl mx-auto text-lg leading-relaxed">Được thiết kế với kiến trúc hiện đại, đảm bảo tính công bằng, bảo mật cao và hiệu năng tuyệt đối cho các cuộc thi học thuật quy mô lớn.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-surface-50 dark:bg-background-dark border border-surface-200 dark:border-gray-800 hover:shadow-elevated transition-all duration-300 hover:-translate-y-2 group">
              <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-content-primary dark:text-content-dark-primary mb-4">Chấm Điểm Tức Thì</h3>
              <p className="text-content-secondary dark:text-content-dark-secondary leading-relaxed font-light">
                Nộp kết quả dự đoán và nhận điểm số ngay lập tức. Hệ thống Background Worker xử lý hàng đợi phân tán (Redis + Celery), đảm bảo không bị treo khi có hàng trăm lượt nộp cùng lúc.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-surface-50 dark:bg-background-dark border border-surface-200 dark:border-gray-800 hover:shadow-elevated transition-all duration-300 hover:-translate-y-2 group">
              <div className="w-16 h-16 rounded-2xl bg-accent-100 dark:bg-accent-900/40 text-accent-600 dark:text-accent-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-content-primary dark:text-content-dark-primary mb-4">Sandbox Cách Ly an Toàn</h3>
              <p className="text-content-secondary dark:text-content-dark-secondary leading-relaxed font-light">
                Bảo mật đặt lên hàng đầu. Mọi đoạn mã tính điểm (Custom Metrics) đều được chạy hoàn toàn độc lập trong các Docker Container dùng một lần, loại bỏ hoàn toàn rủi ro.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-surface-50 dark:bg-background-dark border border-surface-200 dark:border-gray-800 hover:shadow-elevated transition-all duration-300 hover:-translate-y-2 group">
              <div className="w-16 h-16 rounded-2xl bg-success-light dark:bg-success-dark/40 text-success-dark dark:text-success-light flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-success group-hover:text-white transition-all duration-300 shadow-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-content-primary dark:text-content-dark-primary mb-4">Bảng Xếp Hạng Thời Gian Thực</h3>
              <p className="text-content-secondary dark:text-content-dark-secondary leading-relaxed font-light">
                Theo dõi điểm số thay đổi một cách gay cấn. Cơ chế chống quá tải và Pessimistic Locking trong cơ sở dữ liệu đảm bảo cập nhật thứ hạng chính xác ở những giây cuối.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-10 text-center bg-white dark:bg-surface-dark text-content-tertiary dark:text-content-dark-secondary border-t border-surface-200 dark:border-gray-800">
        <p className="text-base font-semibold">© {new Date().getFullYear()} Nền tảng ICTU AI JUDGE.</p>
        <p className="text-sm mt-2 font-light">Thiết kế bởi Đội ngũ Q-Tech dành riêng cho sinh viên ICTU.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
