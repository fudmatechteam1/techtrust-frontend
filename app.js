// app.js - Final Working React App for CDN Environment (Day 23: UI Polish - Custom Image Integration)

// --- THEME CONFIGURATION ---
const THEME_CONFIG = {
  name: 'light',
  colors: {
    primary: '#002B5C', // Huawei Deep Navy (Official)
    secondary: '#E60012', // Huawei Red (Accent)
    success: '#69F0AE', 
    textOnPrimary: 'white',
    textOnSecondary: 'white', 
    neutralBg: '#f8fafc', // Light slate background
    border: '#e2e8f0', 
  }
};

const DARK_THEME_CONFIG = {
  name: 'dark',
  colors: {
    primary: '#BBDEFB', 
    secondary: '#ff5252', 
    success: '#69F0AE',
    textOnPrimary: '#002B5C', 
    textOnSecondary: 'white',
    neutralBg: '#0f172a', // Slate 900
    border: '#334155', 
  }
};

const ThemeContext = React.createContext(THEME_CONFIG.colors);
const useTheme = () => React.useContext(ThemeContext);

// ====================================================================
// --- SERVICE LAYER ---
// ====================================================================
const API_BASE_URL = 'https://techtrust-backend.onrender.com/api/auth';

const AuthService = {
    async request(endpoint, data) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Server error');
            return { success: true, data: result };
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            return { success: false, message: error.message };
        }
    },

    login: (data) => AuthService.request('/login', data),
    register: (data) => AuthService.request('/register', data),
    sendOtp: (email) => AuthService.request('/sendVerifyOtp', { email }),
    // FIXED: Correct endpoint for verification
    verifyOtp: (data) => AuthService.request('/verifyAccount', data),
    
    // FIXED: Password Reset Routes (camelCase)
    requestPasswordReset: (email) => AuthService.request('/sendResetOtp', { email }),
    resetPassword: (data) => AuthService.request('/resetPassword', data)
};

// ====================================================================
// --- AUTH VIEW (Original Design + Wake Logic) ---
// ====================================================================

const AuthView = ({ setView }) => {
  const [mode, setMode] = React.useState('login'); 
  const [loading, setLoading] = React.useState(false);
  const [isWaking, setIsWaking] = React.useState(false); // LOGIC WAKE: Feedback for delay
  const [error, setError] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');

  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    otp: '',
    user_type: 'professional'
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    setIsWaking(false);

    // LOGIC WAKE: Start timer for slow Render start
    const wakingTimer = setTimeout(() => setIsWaking(true), 3000);

    try {
      let result;
      if (mode === 'login') {
        result = await AuthService.login({ email: formData.email, password: formData.password });
        if (result.success) {
            const role = result.data.user?.userType || 'professional';
            setView(role === 'recruiter' ? 'recruiter' : 'profile');
        } else { setError(result.message); }
      } else if (mode === 'register') {
        result = await AuthService.register({ name: formData.name, email: formData.email, password: formData.password, userType: formData.user_type });
        if (result.success) {
            setMode('otp');
            setSuccessMsg("Account created! Check email for OTP.");
        } else { setError(result.message); }
      } else if (mode === 'otp') {
        // FIXED: Calls correct verifyAccount endpoint
        result = await AuthService.verifyOtp({ email: formData.email, otp: formData.otp });
        if (result.success) {
            setSuccessMsg("Verified! Redirecting to login...");
            setTimeout(() => setMode('login'), 1500);
        } else { setError(result.message); }
      } else if (mode === 'forgot') {
        // FIXED: Calls sendResetOtp
        result = await AuthService.requestPasswordReset(formData.email);
        if (result.success) {
            setMode('reset');
            setSuccessMsg("OTP sent to your email.");
        } else { setError(result.message); }
      } else if (mode === 'reset') {
        // FIXED: Calls resetPassword
        result = await AuthService.resetPassword({ email: formData.email, otp: formData.otp, newPassword: formData.password });
        if (result.success) {
            setSuccessMsg("Password reset! Login now.");
            setTimeout(() => setMode('login'), 2000);
        } else { setError(result.message); }
      }
    } catch (err) { 
        setError("Connection error. Try again."); 
    } finally { 
        clearTimeout(wakingTimer);
        setLoading(false); 
        setIsWaking(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#E60012] transition-all outline-none";
  const btnClasses = "w-full py-3 rounded-lg font-bold text-white shadow-lg bg-[#002B5C] hover:bg-[#001f42] transition-all disabled:opacity-50";

  // Using the image from your uploaded file
  const bgImage = "https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

  return (
    <div className="flex w-full h-screen bg-gray-100 overflow-hidden">
        {/* LEFT PANEL - BRANDING (Static) */}
        <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden bg-cover bg-center" style={{backgroundImage: `url(${bgImage})`}}>
            <div className="absolute inset-0 bg-[#002B5C] opacity-85"></div>
            <div className="relative z-10 text-center px-12 text-white">
                <div className="mb-8 inline-block p-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                </div>
                <h1 className="text-6xl font-bold mb-4 tracking-tight">TechTrust</h1>
                <p className="text-xl font-light text-gray-200 mb-8 italic">"Immutable Trust. Intelligent Talent."</p>
                
                <div className="mt-12 pt-8 border-t border-white/20 w-3/4 mx-auto">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-300 mb-3">Powered By</p>
                    <div className="flex justify-center items-center space-x-4">
                        <span className="font-bold text-lg text-white">HUAWEI CLOUD</span>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT PANEL - FORM */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative">
            <div className="w-full max-w-md">
                
                <div className="lg:hidden text-center mb-8">
                    <h1 className="text-3xl font-bold text-[#002B5C]">TechTrust</h1>
                </div>

                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">
                        {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create ID' : mode === 'otp' ? 'Verify Identity' : mode === 'forgot' ? 'Reset Password' : 'New Password'}
                    </h2>
                </div>

                {/* LOGIC WAKE FEEDBACK */}
                {isWaking && (
                    <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-xs rounded animate-pulse border border-blue-100 font-medium">
                        Server is waking up... this can take up to 30 seconds.
                    </div>
                )}

                {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-[#E60012] text-red-700 rounded-r-lg text-sm flex items-center"><span className="mr-2">⚠️</span>{error}</div>}
                {successMsg && <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg text-sm flex items-center"><span className="mr-2">✅</span>{successMsg}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* INPUT FIELDS */}
                    {mode === 'register' && (
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700">Full Name</label>
                            <input type="text" name="name" required onChange={handleInputChange} className={inputClasses} placeholder="e.g. Aminu Kano" />
                        </div>
                    )}

                    {(mode === 'login' || mode === 'register' || mode === 'forgot' || mode === 'otp' || mode === 'reset') && mode !== 'otp' && (
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700">Email Address</label>
                            <input type="email" name="email" required onChange={handleInputChange} className={inputClasses} placeholder="student@fudma.edu.ng" />
                        </div>
                    )}

                    {(mode === 'login' || mode === 'register' || mode === 'reset') && (
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <label className="text-sm font-semibold text-gray-700">
                                    {mode === 'reset' ? 'New Password' : 'Password'}
                                </label>
                                {mode === 'login' && <button type="button" onClick={() => setMode('forgot')} className="text-sm text-[#E60012] hover:underline font-medium">Forgot?</button>}
                            </div>
                            <input type="password" name="password" required onChange={handleInputChange} className={inputClasses} placeholder="••••••••" />
                        </div>
                    )}

                    {(mode === 'otp' || mode === 'reset') && (
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700">OTP Code</label>
                            <input type="text" name="otp" required maxLength="6" onChange={handleInputChange} className={`${inputClasses} text-center tracking-[0.5em] text-xl`} placeholder="000000" />
                        </div>
                    )}

                    {/* ROLE SELECTION (Register Only) */}
                    {mode === 'register' && (
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <label className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center transition-all ${formData.user_type === 'professional' ? 'border-[#002B5C] bg-blue-50 ring-1 ring-[#002B5C]' : 'border-gray-200 hover:border-gray-300'}`}>
                                <input type="radio" name="user_type" value="professional" className="hidden" checked={formData.user_type === 'professional'} onChange={handleInputChange} />
                                <span className="text-lg mb-1">👨‍💻</span>
                                <span className={`text-sm font-medium ${formData.user_type === 'professional' ? 'text-[#002B5C]' : 'text-gray-500'}`}>Professional</span>
                            </label>
                            <label className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center transition-all ${formData.user_type === 'recruiter' ? 'border-[#002B5C] bg-blue-50 ring-1 ring-[#002B5C]' : 'border-gray-200 hover:border-gray-300'}`}>
                                <input type="radio" name="user_type" value="recruiter" className="hidden" checked={formData.user_type === 'recruiter'} onChange={handleInputChange} />
                                <span className="text-lg mb-1">🔍</span>
                                <span className={`text-sm font-medium ${formData.user_type === 'recruiter' ? 'text-[#002B5C]' : 'text-gray-500'}`}>Recruiter</span>
                            </label>
                        </div>
                    )}

                    {/* ACTION BUTTON */}
                    <button disabled={loading} className={btnClasses}>
                        {loading ? 'Processing...' : mode === 'login' ? 'Access Portal' : mode === 'register' ? 'Register Identity' : mode === 'otp' ? 'Verify & Login' : mode === 'forgot' ? 'Send Reset OTP' : 'Reset Password'}
                    </button>
                </form>

                {/* FOOTER LINKS */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    {mode === 'login' ? (
                        <p>No digital ID yet? <button onClick={() => setMode('register')} className="text-[#002B5C] font-bold hover:underline">Create Account</button></p>
                    ) : (
                        <p>Back to <button onClick={() => setMode('login')} className="text-[#002B5C] font-bold hover:underline">Login</button></p>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

// ====================================================================
// --- APP CONTAINER & ROUTING ---
// ====================================================================

const Header = ({ currentView, setView, toggleTheme, themeMode }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('profile')}>
                <div className="w-8 h-8 rounded bg-[#002B5C] flex items-center justify-center text-white font-bold">T</div>
                <h1 className="text-xl font-bold text-[#002B5C] dark:text-white">TechTrust</h1>
            </div>
            <button 
                onClick={async () => { await AuthService.logout(); setView('login'); }} 
                className="text-sm font-medium text-gray-500 hover:text-[#E60012]"
            >
                Sign Out
            </button>
        </div>
    </header>
  );
};

// Placeholder Dashboards
const ProfileView = () => <div className="p-10 text-center"><h2 className="text-2xl font-bold mb-4">Professional Dashboard</h2><p>Welcome to the verification portal.</p></div>;
const RecruiterView = () => <div className="p-10 text-center"><h2 className="text-2xl font-bold mb-4">Recruiter Portal</h2><p>Search for verified talent.</p></div>;

const App = () => {
  const [currentView, setCurrentView] = React.useState('login'); 
  const [themeMode, setThemeMode] = React.useState('light');
  
  // Simple Router
  let content;
  if (currentView === 'login') return <AuthView setView={setCurrentView} />;
  
  if (currentView === 'profile') content = <ProfileView />;
  else if (currentView === 'recruiter') content = <RecruiterView />;
  else content = <ProfileView />;

  return (
    <ThemeContext.Provider value={THEME_CONFIG.colors}>
      <div className={`min-h-screen flex flex-col ${themeMode === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <Header currentView={currentView} setView={setCurrentView} toggleTheme={() => setThemeMode(m => m === 'light' ? 'dark' : 'light')} themeMode={themeMode} />
        <main className="flex-grow">{content}</main>
      </div>
    </ThemeContext.Provider>
  );
};

// FIX: Direct Render Call
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);