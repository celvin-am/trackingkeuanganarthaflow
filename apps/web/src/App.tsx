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
import { MobileTopBar } from './components/layout/MobileTopBar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { GlobalFAB } from './components/GlobalFAB';

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <LanguageProvider>
          <QueryClientProvider client={queryClient}>
            <Routes>
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />

              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen bg-surface flex">
                      {/* Desktop Sidebar */}
                      <div className="hidden lg:block">
                        <Sidebar />
                      </div>

                      {/* Main content */}
                      <main className="flex min-h-screen flex-1 flex-col lg:ml-[260px]">
                        {/* Desktop Header */}
                        <div className="hidden lg:block">
                          <Header />
                        </div>

                        {/* Mobile Header */}
                        <MobileTopBar />

                        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 md:px-6 lg:p-10 lg:pb-10">
                          <Routes>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/transactions" element={<Transactions />} />
                            <Route path="/wallets" element={<Wallets />} />
                            <Route path="/budgets" element={<Budgets />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/scan" element={<Scan />} />
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                          </Routes>

                          {/* FAB only for desktop */}
                          <div className="hidden lg:block">
                            <GlobalFAB />
                          </div>
                        </div>
                      </main>

                      {/* Mobile Bottom Navigation */}
                      <MobileBottomNav />
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