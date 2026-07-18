import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { WalletProvider } from '@/context/WalletContext';
import { ThemeProvider } from '@/context/ThemeContext';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import ScrollToTop from '@/components/shared/ScrollToTop';
import ProcessingOverlay from '@/components/shared/ProcessingOverlay';
import AppRoutes from '@/routes/AppRoutes';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <WalletProvider>
              <ScrollToTop />
              <AppRoutes />
              <ProcessingOverlay />
              <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
            </WalletProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
