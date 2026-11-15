import { Component } from 'react';
import { BrowserRouter } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppRoutes } from './routes/AppRoutes';

class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="fatal-error"><h1>Không thể hiển thị trang</h1><p>Vui lòng tải lại để mở lại không gian học tập.</p><button className="btn btn-primary" onClick={() => window.location.reload()}>Tải lại trang</button></main>;
    return this.props.children;
  }
}
export default function App() {
  return <ErrorBoundary><BrowserRouter><AuthProvider><ToastProvider><AppRoutes /></ToastProvider></AuthProvider></BrowserRouter></ErrorBoundary>;
}
