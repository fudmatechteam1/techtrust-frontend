// app.js - Final Working React App for CDN Environment (Day 22: Password Reset & Refactor)

// --- THEME CONFIGURATION ---
const THEME_CONFIG = {
  name: 'light',
  colors: {
    primary: '#1A237E', // Deep Navy Blue
    secondary: '#4FC3F7', // Electric Blue
    success: '#69F0AE', // Verified Green
    textOnPrimary: 'white',
    textOnSecondary: '#1A237E', 
    neutralBg: 'white',
    border: '#e5e7eb', // gray-200
  }
};

const DARK_THEME_CONFIG = {
  name: 'dark',
  colors: {
    primary: '#BBDEFB', // Light Blue for contrast
    secondary: '#00B0FF', // Sky Blue
    success: '#69F0AE',
    textOnPrimary: '#1A237E', 
    textOnSecondary: '#1A237E',
    neutralBg: '#212121', // Dark Gray background
    border: '#424242', // Darker border
  }
};

// --- Theme Context Setup ---
const ThemeContext = React.createContext(THEME_CONFIG.colors);
const useTheme = () => React.useContext(ThemeContext);


// ====================================================================
// --- SERVICE LAYER: AUTHENTICATION ---
// ====================================================================

// UPDATED: Points to your Render backend
const API_BASE_URL = 'https://techtrust-backend.onrender.com/api/auth';

const handleRequest = async (requestPromise) => {
    try {
        const response = await requestPromise;
        const data = await response.json();
        
        if (response.ok) {
            return { success: true, data };
        } else {
            return { success: false, error: data.message || response.statusText };
        }
    } catch (error) {
        console.error("API Request Error:", error);
        return { success: false, error: "Network error. Please check your connection." };
    }
};

const AuthService = {
    register: (name, email, password, userType) => {
        return handleRequest(fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, userType })
        }));
    },

    login: (email, password) => {
        return handleRequest(fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        }));
    },

    requestOtp: (email) => {
        return handleRequest(fetch(`${API_BASE_URL}/send-verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        }));
    },

    verifyOtp: (email, otp) => {
        return handleRequest(fetch(`${API_BASE_URL}/verify-account`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        }));
    },

    requestPasswordReset: (email) => {
        return handleRequest(fetch(`${API_BASE_URL}/send-reset-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        }));
    },

    resetPassword: (email, otp, newPassword) => {
        return handleRequest(fetch(`${API_BASE_URL}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, newPassword })
        }));
    },

    logout: () => {
        return handleRequest(fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        }));
    }
};

// ====================================================================
// --- UI COMPONENTS ---
// ====================================================================

const Header = ({ currentView, setView, toggleTheme, themeMode }) => {
  return (
    <header className="shadow-md p-4 flex justify-between items-center sticky top-0 z-50 bg-white dark:bg-gray-800">
      <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('login')}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 text-white font-bold">T</div>
        <h1 className="text-xl font-bold tracking-tight text-blue-900 dark:text-blue-100">TechTrust</h1>
      </div>
      <div className="flex items-center space-x-4">
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            {themeMode === 'light' ? '🌙' : '☀️'}
        </button>
        {currentView !== 'login' && (
          <button 
            onClick={async () => {
                await AuthService.logout();
                setView('login');
            }} 
            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

const AuthView = ({ setView }) => {
  const [mode, setMode] = React.useState('login'); 
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');

  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    otp: '',
    user_type: 'professional' // Default value matching enum
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await AuthService.login(formData.email, formData.password);
        if (result.success) {
            const role = result.data.user?.userType || 'professional';
            setView(role === 'recruiter' ? 'recruiter' : 'profile');
        } else {
            setError(result.error);
        }
      } else if (mode === 'register') {
        const result = await AuthService.register(formData.name, formData.email, formData.password, formData.user_type);
        if (result.success) {
            setMode('otp');
            setSuccessMsg("Registration successful! Check your email for OTP.");
        } else {
            setError(result.error);
        }
      } else if (mode === 'otp') {
        const result = await AuthService.verifyOtp(formData.email, formData.otp);
        if (result.success) {
            setSuccessMsg("Account verified! You can now login.");
            setTimeout(() => setMode('login'), 2000);
        } else {
            setError(result.error);
        }
      } else if (mode === 'forgot') {
        const result = await AuthService.requestPasswordReset(formData.email);
        if (result.success) {
            setMode('reset');
            setSuccessMsg("Reset OTP sent to your email.");
        } else {
            setError(result.error);
        }
      } else if (mode === 'reset') {
        const result = await AuthService.resetPassword(formData.email, formData.otp, formData.password);
        if (result.success) {
            setSuccessMsg("Password reset successful!");
            setTimeout(() => setMode('login'), 2000);
        } else {
            setError(result.error);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const renderRegisterForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <input type="text" name="name" required onChange={handleInputChange} className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" placeholder="John Doe" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input type="email" name="email" required onChange={handleInputChange} className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" placeholder="john@example.com" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input type="password" name="password" required onChange={handleInputChange} className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" placeholder="Minimum 8 characters" />
      </div>
      <div className="flex space-x-4 py-2">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input type="radio" name="user_type" value="professional" defaultChecked onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
          <span className="text-sm">Professional</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input type="radio" name="user_type" value="recruiter" onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
          <span className="text-sm">Recruiter</span>
        </label>
      </div>
      <button disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Processing...' : 'Create Account'}
      </button>
    </form>
  );

  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border dark:border-gray-700">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-blue-900 dark:text-blue-100 mb-2">
            {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Join TechTrust' : 'Verification'}
        </h2>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">{error}</div>}
      {successMsg && <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm">{successMsg}</div>}

      {mode === 'login' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" name="email" required onChange={handleInputChange} className="w-full p-3 border rounded-lg dark:bg-gray-700" placeholder="Email" />
          <input type="password" name="password" required onChange={handleInputChange} className="w-full p-3 border rounded-lg dark:bg-gray-700" placeholder="Password" />
          <button type="button" onClick={() => setMode('forgot')} className="text-sm text-blue-600 block text-right">Forgot Password?</button>
          <button disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold">Sign In</button>
        </form>
      ) : mode === 'register' ? renderRegisterForm() : null}

      <div className="mt-8 text-center text-sm">
        {mode === 'login' ? (
            <p>New? <button onClick={() => setMode('register')} className="text-blue-600 font-bold">Create Account</button></p>
        ) : (
            <p>Back to <button onClick={() => setMode('login')} className="text-blue-600 font-bold">Login</button></p>
        )}
      </div>
    </div>
  );
};

const ProfileView = () => <div className="text-center p-8"><h1 className="text-2xl font-bold">Professional Dashboard</h1><p>Skill verification system active.</p></div>;
const RecruiterView = () => <div className="text-center p-8"><h1 className="text-2xl font-bold">Recruiter Dashboard</h1><p>Find verified talent.</p></div>;

const App = () => {
  const [currentView, setCurrentView] = React.useState('login'); 
  const [themeMode, setThemeMode] = React.useState('light');
  const toggleTheme = () => setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  const activeTheme = themeMode === 'light' ? THEME_CONFIG : DARK_THEME_CONFIG;

  let content;
  switch (currentView) {
    case 'login': content = <AuthView setView={setCurrentView} />; break;
    case 'profile': content = <ProfileView />; break;
    case 'recruiter': content = <RecruiterView />; break;
    default: content = <AuthView setView={setCurrentView} />;
  }

  return (
    <ThemeContext.Provider value={activeTheme.colors}>
      <div className={`min-h-screen flex flex-col ${themeMode === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
        <Header currentView={currentView} setView={setCurrentView} toggleTheme={toggleTheme} themeMode={themeMode} />
        <main className="flex-grow flex items-center justify-center p-4">
            {content}
        </main>
        <footer className="bg-gray-800 text-white p-4 text-center text-sm">
            &copy; 2025 TechTrust.
        </footer>
      </div>
    </ThemeContext.Provider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);