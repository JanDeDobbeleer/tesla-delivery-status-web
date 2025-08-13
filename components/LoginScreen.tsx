
import React, { useState } from 'react';
import { handleTeslaLogin } from '../services/tesla';
import { TeslaLogo } from './icons';

interface LoginScreenProps {
  error?: string | null;
  onUrlSubmit: (url: string) => Promise<void>;
  isSubmitting: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ error, onUrlSubmit, isSubmitting }) => {
  const [loginStep, setLoginStep] = useState<'initial' | 'paste_url'>('initial');
  const [pastedUrl, setPastedUrl] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [manualLoginUrl, setManualLoginUrl] = useState<string | null>(null);

  const onLoginClick = async () => {
    setLocalError(null);
    setManualLoginUrl(null);
    const { success, url } = await handleTeslaLogin();

    if (success) {
      setLoginStep('paste_url');
    } else {
      setManualLoginUrl(url);
    }
  };

  const proceedAfterManualLogin = () => {
    setManualLoginUrl(null);
    setLoginStep('paste_url');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!pastedUrl.trim()) {
      setLocalError('Please paste the URL from the Tesla login page.');
      return;
    }
    try {
      const url = new URL(pastedUrl);
      if (!url.searchParams.has('code')) {
        setLocalError('The pasted URL does not contain a valid authentication code.');
        return;
      }
    } catch (_) {
      setLocalError('The pasted text is not a valid URL.');
      return;
    }
    await onUrlSubmit(pastedUrl);
  };
  
  const commonButtonClasses = "w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50 disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:dark:bg-tesla-gray-600 disabled:dark:hover:bg-tesla-gray-600 disabled:opacity-70 disabled:cursor-not-allowed";

  if (loginStep === 'paste_url') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-lg w-full bg-white/60 dark:bg-tesla-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-tesla-gray-700 p-8 rounded-2xl shadow-xl">
          <TeslaLogo className="w-24 h-24 mx-auto text-gray-900 dark:text-white mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Complete Sign-In</h2>
          <p className="text-gray-600 dark:text-tesla-gray-300 mb-6">
            A new tab was opened for you to sign in. After logging in, you'll see a blank page. <strong>Copy the full URL</strong> from that page's address bar and paste it below.
          </p>
          
          <form onSubmit={handleSubmit} noValidate>
            <div className="relative">
              <input
                id="url-input"
                type="text"
                value={pastedUrl}
                onChange={(e) => setPastedUrl(e.target.value)}
                placeholder="https://auth.tesla.com/void/callback?code=..."
                className="w-full bg-gray-50 dark:bg-tesla-gray-900 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-tesla-gray-600 rounded-lg py-3 px-4 mb-4 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition"
                aria-label="Pasted URL from Tesla"
                required
                disabled={isSubmitting}
              />
            </div>
            
            {(error || localError) && (
              <div className="bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-tesla-red text-red-800 dark:text-white text-sm rounded-lg p-3 mb-4 text-left" role="alert">
                <p className="font-bold">Authentication Error</p>
                <p>{error || localError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !pastedUrl}
              className={commonButtonClasses}
            >
              {isSubmitting ? 'Verifying...' : 'Submit & Check Status'}
            </button>
          </form>
           <p className="text-xs text-gray-500 dark:text-tesla-gray-500 mt-6">
            This manual copy-paste step is required by Tesla's authentication flow for third-party apps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center max-w-md w-full bg-white/60 dark:bg-tesla-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-tesla-gray-700 p-8 rounded-2xl shadow-xl">
        <div className="mx-auto mb-6">
          <TeslaLogo className="w-24 h-24 mx-auto text-gray-900 dark:text-white"/>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Delivery Status
        </h1>
        <p className="text-gray-600 dark:text-tesla-gray-300 mb-6">
          Log in with your Tesla account to track your vehicle order.
        </p>
        
        {!manualLoginUrl ? (
          <div className="text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-blue-200 rounded-lg p-3 mb-6 text-left">
            <p className="font-semibold">Important Login Steps:</p>
            <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Clicking "Sign In" opens Tesla's official site in a <strong>new tab</strong>.</li>
                <li>After logging in, you'll see a blank page. <strong>Copy that page's URL</strong> and paste it on the next screen here.</li>
            </ol>
          </div>
        ) : (
          <div className="text-sm bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-500/40 text-yellow-800 dark:text-yellow-100 rounded-lg p-3 mb-6 text-left space-y-2">
            <p className="font-bold">Pop-up Blocked</p>
            <p>Your browser may have blocked the login window. Please copy the URL below and open it in a new tab manually.</p>
            <div className="relative flex items-center">
              <input 
                type="text" 
                readOnly 
                value={manualLoginUrl} 
                className="w-full bg-yellow-200/50 dark:bg-tesla-gray-900/50 p-2 rounded text-xs truncate border border-yellow-400/50" 
                onClick={e => (e.target as HTMLInputElement).select()}
              />
              <button 
                onClick={() => navigator.clipboard.writeText(manualLoginUrl)} 
                className="ml-2 px-3 py-1 text-xs bg-yellow-400/50 hover:bg-yellow-400/80 text-yellow-900 dark:text-yellow-100 rounded-md font-semibold"
              >
                Copy
              </button>
            </div>
            <button 
              onClick={proceedAfterManualLogin} 
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
            >
              I have logged in, proceed to paste URL
            </button>
          </div>
        )}

        {error && (
            <div className="bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-tesla-red text-red-800 dark:text-white text-sm rounded-lg p-3 mb-6" role="alert">
                {error}
            </div>
        )}

        <button
          onClick={onLoginClick}
          className={commonButtonClasses}
          disabled={!!manualLoginUrl}
        >
          Sign In with Tesla
        </button>
        <p className="text-xs text-gray-500 dark:text-tesla-gray-500 mt-6">
          This is a third-party application and is not affiliated with Tesla, Inc. Your credentials are handled securely by Tesla's official login page.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
