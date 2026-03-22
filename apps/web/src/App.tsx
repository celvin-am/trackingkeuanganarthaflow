import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Wallets } from './pages/Wallets';
import { Budgets } from './pages/Budgets';
import { Settings } from './pages/Settings';
import { Scan } from './pages/Scan';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { SettingsProvider } from './lib/SettingsContext';
import { LanguageProvider } from './lib/LanguageContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { GlobalFAB } from './components/GlobalFAB';

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <LanguageProvider>
          <QueryClientProvider client={queryClient}>
            <Routes>
              {/* Public Routes */}
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />
              
              {/* Protected Apps Routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen bg-surface flex">
                      <Sidebar />
                      <main className="flex-1 ml-[260px] flex flex-col min-h-screen">
                        <Header />
                        <div className="flex-1 p-10 overflow-y-auto">
                          <Routes>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/transactions" element={<Transactions />} />
                            <Route path="/wallets" element={<Wallets />} />
                            <Route path="/budgets" element={<Budgets />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/scan" element={<Scan />} />
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                          </Routes>
                          <GlobalFAB />
                        </div>
                      </main>
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </QueryClientProvider>
        </LanguageProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}

export default App;
