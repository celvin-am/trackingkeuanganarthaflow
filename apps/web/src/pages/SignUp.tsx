import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authClient } from '../lib/auth';

export function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error: authError } = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (authError) {
        setError(authError.message || 'Failed to sign up');
      } else if (data) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-[480px] bg-neutral-950 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-container/20 to-transparent" />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight italic">ArthaFlow</h1>
          <p className="text-[10px] text-orange-500 uppercase tracking-widest font-bold mt-1">Finance</p>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-white leading-tight">
            Start your journey<br />to financial<br />
            <span className="text-primary-container">freedom today.</span>
          </h2>
          <p className="text-sm text-neutral-400 mt-4 max-w-sm">
            Join thousands of users who manage their money smarter with ArthaFlow.
          </p>
        </div>
        <div className="relative z-10">
          <p className="text-xs text-neutral-500">© {new Date().getFullYear()} ArthaFlow Finance. All rights reserved.</p>
          <p className="text-[10px] text-neutral-600 mt-1">Developed by Celvin Andra Maulana</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <h1 className="text-2xl font-extrabold text-on-surface italic">ArthaFlow</h1>
            <p className="text-[10px] text-primary-container uppercase tracking-widest font-bold mt-1">Finance</p>
          </div>

          <h2 className="text-2xl font-extrabold text-on-surface">Create your account</h2>
          <p className="text-sm text-secondary mt-1 mb-8">Get started with ArthaFlow in just a few steps.</p>

          {/* Google Login */}
          <button 
            type="button"
            onClick={async () => {
              await authClient.signIn.social({
                provider: 'google',
                callbackURL: `${window.location.origin}/dashboard`,
              });
            }}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-neutral-200 rounded-xl text-sm font-semibold text-on-surface hover:bg-neutral-50 transition-colors mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-neutral-200 flex-1" />
            <span className="text-xs text-secondary font-medium">or</span>
            <div className="h-px bg-neutral-200 flex-1" />
          </div>

          {/* Registration Form */}
          <form className="space-y-4" onSubmit={handleSignUp}>
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1.5">Full Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe" 
                className="w-full px-4 py-3 bg-surface-container-low border border-neutral-200 rounded-xl text-sm text-on-surface placeholder:text-neutral-400 focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-colors" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1.5">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" 
                className="w-full px-4 py-3 bg-surface-container-low border border-neutral-200 rounded-xl text-sm text-on-surface placeholder:text-neutral-400 focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-colors" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1.5">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full px-4 py-3 bg-surface-container-low border border-neutral-200 rounded-xl text-sm text-on-surface placeholder:text-neutral-400 focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-colors" 
              />
              <p className="text-[10px] text-secondary mt-1">Minimum 8 characters</p>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input required type="checkbox" className="w-4 h-4 rounded border-neutral-300 text-primary-container focus:ring-primary-container" />
                <span className="text-xs text-secondary">
                  I agree to the <a href="#" className="text-primary-container font-semibold hover:underline">Terms of Service</a> and <a href="#" className="text-primary-container font-semibold hover:underline">Privacy Policy</a>
                </span>
              </label>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 bg-primary-container disabled:opacity-50 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-xs text-secondary text-center mt-6">
            Already have an account?{' '}
            <Link to="/sign-in" className="font-semibold text-primary-container hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
