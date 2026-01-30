import { useState } from 'react';
import { Lock } from 'lucide-react';
import { verifySecurity } from './api';
import { useLanguage } from './LanguageContext';

const LockScreen = ({ onUnlock }) => {
    const { t } = useLanguage();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            await verifySecurity(password);
            onUnlock();
        } catch {
            setError(t('auth_required')); // Reusing auth_required or similar, or just generic error
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-[100]">
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-sm text-center">
                <div className="mx-auto bg-violet-600/20 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                    <Lock className="w-8 h-8 text-violet-500" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">{t('app_locked')}</h2>
                <p className="text-slate-400 mb-6">{t('enter_password')}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-center tracking-widest text-lg"
                        placeholder="••••••••"
                        autoFocus
                    />
                    
                    {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !password}
                        className="w-full py-3 rounded-lg font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '...' : t('unlock')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LockScreen;
