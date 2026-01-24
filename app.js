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
// --- SERVICE LAYER (Huawei Cloud Backend) ---
// ====================================================================
// Backend URL - Can be set via environment variable or use default
const BACKEND_BASE_URL = window.BACKEND_URL || 'https://fudmatechteam1.github.io/techtrust-frontend/';
const API_BASE_URL = `${BACKEND_BASE_URL}/api/auth`;
const TRUST_SCORE_API_URL = `${BACKEND_BASE_URL}/api/trust-score`;

const AuthService = {
  async request(endpoint, data, method = 'POST') {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        // Handle new backend error format (supports both old and new formats)
        const errorMsg = result.error || result.message || 'Server error';
        throw new Error(errorMsg);
      }
      // Handle both old format (direct data) and new format (wrapped in data property)
      return {
        success: true,
        data: result.data || result,
        user: result.user || result.data?.user // Support both formats for login
      };
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      return { success: false, message: error.message };
    }
  },

  login: (data) => AuthService.request('/login', data),
  register: (data) => AuthService.request('/register', data),

  // FIXED: Updated to match authRoute.js "/sendOtp"
  requestOtp: (email) => AuthService.request('/sendOtp', { email }),

  // FIXED: Updated to match authRoute.js "/verify"
  verifyOtp: (data) => AuthService.request('/verify', data),

  // FIXED: Updated to match authRoute.js "/sendResetOtp"
  requestPasswordReset: (email) => AuthService.request('/sendResetOtp', { email }),

  // FIXED: Updated to match authRoute.js "/resetPassword"
  resetPassword: (data) => AuthService.request('/resetPassword', data),

  logout: () => AuthService.request('/logout', {})
};

// Trust Score Service - Connects to Python AI service via Node.js backend
const TrustScoreService = {
  async request(endpoint, data, method = 'POST') {
    try {
      const response = await fetch(`${TRUST_SCORE_API_URL}${endpoint}`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: data ? JSON.stringify(data) : undefined,
      });
      const result = await response.json();
      if (!response.ok) {
        const errorMsg = result.error || result.message || 'Server error';
        throw new Error(errorMsg);
      }
      return { success: true, data: result.data || result };
    } catch (error) {
      console.error(`Trust Score API Error (${endpoint}):`, error);
      return { success: false, message: error.message };
    }
  },

  predictTrustScore: (profileData) => TrustScoreService.request('/predict', profileData),

  predictBatch: (developers) => TrustScoreService.request('/predict/batch', { developers }),

  getCredentials: () => TrustScoreService.request('/credentials', null, 'GET'),

  getHealth: () => TrustScoreService.request('/health', null, 'GET'),

  getMetrics: () => TrustScoreService.request('/metrics', null, 'GET')
};

// Profile Service - Manages user profiles
const ProfileService = {
  async request(endpoint, data, method = 'POST') {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/profile${endpoint}`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: data ? JSON.stringify(data) : undefined,
      });
      const result = await response.json();
      if (!response.ok) {
        const errorMsg = result.error || result.message || 'Server error';
        throw new Error(errorMsg);
      }
      return { success: true, data: result.message || result.data || result };
    } catch (error) {
      console.error(`Profile API Error (${endpoint}):`, error);
      return { success: false, message: error.message };
    }
  },

  addExperience: (data) => ProfileService.request('/expr', data),
  fetchAll: (userId) => ProfileService.request(`/fetch1/${userId}`, null, 'GET'),
  fetchUserById: (userId) => ProfileService.request(`/fetch-user/${userId}`, null, 'GET'),
  fetchById: (profileId) => ProfileService.request(`/fetch-profile/${profileId}`, null, 'GET'),
  updateProfile: (data) => ProfileService.request('/Edit-profile', data, 'PUT')
};

// Claims Service - Manages professional claims
const ClaimsService = {
  async request(endpoint, data, method = 'POST') {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/claims${endpoint}`, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          // Added Authorization if your backend requires it
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || result.message || 'Server error');

      return { success: true, data: result.data || result.message || result };
    } catch (error) {
      console.error(`Claims API Error (${endpoint}):`, error);
      return { success: false, message: error.message };
    }
  },

  // FIX: Using 'this' avoids the initialization error
  // FIX: Sending 'claim' directly instead of nesting it in another object
  submitClaim(claim) {
    return this.request('/claim', claim); 
  },

  deleteClaim(claimId) {
    return this.request(`/remove/${claimId}`, null, 'DELETE');
  },

  fetchAllClaims() {
    return this.request('/fetch', null, 'GET');
  }
};

// ====================================================================
// --- AUTH VIEW (Static Design + Wake Logic) ---
// ====================================================================

const AuthView = ({ setView }) => {
  const [mode, setMode] = React.useState('login');
  const [loading, setLoading] = React.useState(false);
  const [isWaking, setIsWaking] = React.useState(false); // LOGIC WAKE: Feedback for delay
  const [error, setError] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');

  const [formData, setFormData] = React.useState({
    name: '',
    email: '', // Ensure this is bound correctly
    password: '',
    otp: '',
    user_type: 'professional'
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  // ====================================================================
  // FRONTEND FIX: Updated handleSubmit in AuthView component
  // Replace the handleSubmit function in your app.js with this corrected version
  // ====================================================================

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
          // Handle successful login for verified users
          const userData = result.user || result.data?.user || result.data;
          const role = userData?.userType || userData?.user_type || 'professional';
          setView(role === 'recruiter' ? 'recruiter' : 'profile');
        } else {
          // FIXED: Check if user needs verification (403 response from backend)
          if (result.message && result.message.includes('not verified')) {
            // Unverified user - redirect to OTP screen
            setMode('otp');
            setSuccessMsg("Account not verified. Please enter the OTP sent to your email.");
          } else {
            setError(result.message);
          }
        }

      } else if (mode === 'register') {
        result = await AuthService.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          userType: formData.user_type
        });

        if (result.success) {
          // FIXED: Always redirect to OTP after successful registration
          // Backend now sends OTP automatically during registration
          setMode('otp');
          setSuccessMsg("Account created! An OTP has been sent to your email. Please verify to continue.");
        } else {
          setError(result.message);
        }

      } else if (mode === 'otp') {
        // Verify OTP
        result = await AuthService.verifyOtp({ email: formData.email, otp: formData.otp });

        if (result.success) {
          setSuccessMsg("Email verified successfully! Redirecting to login...");
          setTimeout(() => {
            setMode('login');
            setFormData(prev => ({ ...prev, otp: '' })); // Clear OTP field
          }, 1500);
        } else {
          setError(result.message);
        }

      } else if (mode === 'forgot') {
        if (!formData.email) {
          setError("Please enter your email address.");
          setLoading(false);
          clearTimeout(wakingTimer);
          return;
        }
        result = await AuthService.requestPasswordReset(formData.email);
        if (result.success) {
          setMode('reset');
          setSuccessMsg("OTP sent to your email.");
        } else {
          setError(result.message);
        }

      } else if (mode === 'reset') {
        result = await AuthService.resetPassword({
          email: formData.email,
          otp: formData.otp,
          newPassword: formData.password
        });
        if (result.success) {
          setSuccessMsg("Password reset successful! Redirecting to login...");
          setTimeout(() => setMode('login'), 2000);
        } else {
          setError(result.message);
        }
      }

    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      clearTimeout(wakingTimer);
      setIsWaking(false);
      setLoading(false);
    }
  };

  // ====================================================================
  // ADDITIONAL FIX: Update AuthService.request to handle 403 responses properly
  // ====================================================================

  const AuthService = {
    async request(endpoint, data, method = 'POST') {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data),
        });
        const result = await response.json();

        // FIXED: Handle 403 for unverified users specially
        if (response.status === 403 && result.requiresVerification) {
          return {
            success: false,
            message: result.message,
            requiresVerification: true,
            email: result.email
          };
        }

        if (!response.ok) {
          const errorMsg = result.error || result.message || 'Server error';
          throw new Error(errorMsg);
        }

        return {
          success: true,
          data: result.data || result,
          user: result.user || result.data?.user,
          requiresVerification: result.requiresVerification || false
        };
      } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        return { success: false, message: error.message };
      }
    },

    login: (data) => AuthService.request('/login', data),
    register: (data) => AuthService.request('/register', data),
    requestOtp: (email) => AuthService.request('/sendOtp', { email }),
    verifyOtp: (data) => AuthService.request('/verify', data),
    requestPasswordReset: (email) => AuthService.request('/sendResetOtp', { email }),
    resetPassword: (data) => AuthService.request('/resetPassword', data),
    logout: () => AuthService.request('/logout', {})
  };


  const inputClasses = "w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#E60012] transition-all outline-none hover:border-gray-400";
  const btnClasses = "w-full py-3 rounded-lg font-bold text-white shadow-lg bg-[#002B5C] hover:bg-[#001f42] hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

  // Using the image from your uploaded file
  const bgImage = "https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

  return (
    <div className="flex w-full h-screen bg-gray-100 overflow-hidden">
      {/* LEFT PANEL - BRANDING (Static) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden bg-cover bg-center transition-transform duration-300 hover:scale-[1.02]" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="absolute inset-0 bg-[#002B5C] opacity-85 transition-opacity duration-300 hover:opacity-80"></div>
        <div className="relative z-10 text-center px-12 text-white">
          <div className="mb-8 inline-block p-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl transform transition-transform duration-300 hover:scale-110 hover:rotate-6">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          </div>
          <h1 className="text-6xl font-bold mb-4 tracking-tight transition-transform duration-300 hover:scale-105">TechTrust</h1>
          <p className="text-xl font-light text-gray-200 mb-8 italic">"Immutable Trust. Intelligent Talent."</p>

          <div className="mt-12 pt-8 border-t border-white/20 w-3/4 mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-300 mb-3">Powered By</p>
            <div className="flex justify-center items-center space-x-4">
              <span className="font-bold text-lg text-white transition-transform duration-300 hover:scale-110">HUAWEI CLOUD</span>
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
                <input type="text" name="name" required onChange={handleInputChange} value={formData.name} className={inputClasses} placeholder="e.g. Aminu Kano" />
              </div>
            )}

            {/* FIXED: Explicit Input for Email to ensure value binding */}
            {(mode === 'login' || mode === 'register' || mode === 'forgot' || mode === 'otp' || mode === 'reset') && mode !== 'otp' && (
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  onChange={handleInputChange}
                  value={formData.email} // Bind to state
                  className={inputClasses}
                  placeholder="student@fudma.edu.ng"
                />
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'reset') && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-sm font-semibold text-gray-700">
                    {mode === 'reset' ? 'New Password' : 'Password'}
                  </label>
                  {mode === 'login' && <button type="button" onClick={() => setMode('forgot')} className="text-sm text-[#E60012] hover:text-[#cc0010] hover:underline font-medium transition-colors duration-200">Forgot?</button>}
                </div>
                <input type="password" name="password" required onChange={handleInputChange} value={formData.password} className={inputClasses} placeholder="••••••••" />
              </div>
            )}

            {(mode === 'otp' || mode === 'reset') && (
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">OTP Code</label>
                <input type="text" name="otp" required maxLength="6" onChange={handleInputChange} value={formData.otp} className={`${inputClasses} text-center tracking-[0.5em] text-xl`} placeholder="000000" />
              </div>
            )}

            {/* ROLE SELECTION (Register Only) */}
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <label className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center transition-all duration-200 transform hover:scale-105 hover:shadow-md ${formData.user_type === 'professional' ? 'border-[#002B5C] bg-blue-50 ring-2 ring-[#002B5C] shadow-sm' : 'border-gray-200 hover:border-[#002B5C] hover:bg-blue-50/50'}`}>
                  <input type="radio" name="user_type" value="professional" className="hidden" checked={formData.user_type === 'professional'} onChange={handleInputChange} />
                  <span className="text-lg mb-1">👨‍💻</span>
                  <span className={`text-sm font-medium transition-colors ${formData.user_type === 'professional' ? 'text-[#002B5C]' : 'text-gray-500'}`}>Professional</span>
                </label>
                <label className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center transition-all duration-200 transform hover:scale-105 hover:shadow-md ${formData.user_type === 'recruiter' ? 'border-[#002B5C] bg-blue-50 ring-2 ring-[#002B5C] shadow-sm' : 'border-gray-200 hover:border-[#002B5C] hover:bg-blue-50/50'}`}>
                  <input type="radio" name="user_type" value="recruiter" className="hidden" checked={formData.user_type === 'recruiter'} onChange={handleInputChange} />
                  <span className="text-lg mb-1">🔍</span>
                  <span className={`text-sm font-medium transition-colors ${formData.user_type === 'recruiter' ? 'text-[#002B5C]' : 'text-gray-500'}`}>Recruiter</span>
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
              <p>No digital ID yet? <button onClick={() => setMode('register')} className="text-[#002B5C] font-bold hover:text-[#001f42] hover:underline transition-colors duration-200">Create Account</button></p>
            ) : (
              <p>Back to <button onClick={() => setMode('login')} className="text-[#002B5C] font-bold hover:text-[#001f42] hover:underline transition-colors duration-200">Login</button></p>
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
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div
          className="flex items-center space-x-2 cursor-pointer group transition-all duration-200"
          onClick={() => setView('profile')}
        >
          <div className="w-8 h-8 rounded bg-[#002B5C] flex items-center justify-center text-white font-bold group-hover:bg-[#001f42] transition-colors duration-200 shadow-md group-hover:shadow-lg transform group-hover:scale-105">
            T
          </div>
          <h1 className="text-xl font-bold text-[#002B5C] dark:text-white group-hover:text-[#001f42] transition-colors duration-200">
            TechTrust
          </h1>
        </div>
        <button
          onClick={async () => { await AuthService.logout(); setView('login'); }}
          className="text-sm font-medium text-gray-500 hover:text-[#E60012] transition-colors duration-200 px-3 py-1 rounded-md hover:bg-red-50"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
};

// Trust Score Visualization Component
const TrustScoreGauge = ({ score, maxScore = 10 }) => {
  const percentage = Math.min((score / maxScore) * 100, 100);
  const getColor = () => {
    if (score >= 7) return '#69F0AE'; // Success green
    if (score >= 4) return '#FFD700'; // Warning yellow
    return '#E60012'; // Huawei Red
  };
  const getLabel = () => {
    if (score >= 7) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative">
        {/* Circular Progress Ring */}
        <div className="relative w-48 h-48 mx-auto">
          <svg className="transform -rotate-90 w-48 h-48">
            {/* Background Circle */}
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="#e2e8f0"
              strokeWidth="16"
              fill="none"
            />
            {/* Progress Circle */}
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke={getColor()}
              strokeWidth="16"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - percentage / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold" style={{ color: getColor() }}>
              {score.toFixed(1)}
            </div>
            <div className="text-sm text-gray-500 mt-1">/ {maxScore}</div>
            <div className="text-xs font-semibold mt-2 px-3 py-1 rounded-full" style={{ backgroundColor: `${getColor()}20`, color: getColor() }}>
              {getLabel()} Trust
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Full-Featured Professional Dashboard
const ProfileView = () => {
  const [activeTab, setActiveTab] = React.useState('trust-score');
  const [trustScoreData, setTrustScoreData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');
  const [claims, setClaims] = React.useState([]);
  const [profileForm, setProfileForm] = React.useState({
    username: '',
    totalStars: '',
    totalForks: '',
    totalIssues: '',
    totalPRs: '',
    totalContributors: '',
    languages: '',
    repoCount: '',
    credentials: []
  });
  const [experienceForm, setExperienceForm] = React.useState({
    skillsArray: '',
    experience: '',
    claimText: '',
    currentTrustScore: ''
  });
  const [claimForm, setClaimForm] = React.useState({ claim: '' });

  const loadClaims = async () => {
    try {
      const result = await ClaimsService.fetchAllClaims();
      if (result.success) {
        setClaims(Array.isArray(result.data) ? result.data : []);
      }
    } catch (err) {
      console.error('Failed to load claims:', err);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'claims') {
      loadClaims();
    }
  }, [activeTab]);

  const saveExperience = async () => {
    if (!experienceForm.skillsArray || !experienceForm.experience || !experienceForm.claimText) {
      setError('Please fill all required fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const trustScore = trustScoreData?.trust_score || '0';
      const result = await ProfileService.addExperience({
        ...experienceForm,
        currentTrustScore: trustScore.toString()
      });
      if (result.success) {
        setSuccessMsg('Profile experience saved successfully!');
        setExperienceForm({ skillsArray: '', experience: '', claimText: '', currentTrustScore: '' });
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(result.message || 'Failed to save experience');
      }
    } catch (err) {
      setError('Connection error. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const submitClaim = async () => {
    if (!claimForm.claim.trim()) {
      setError('Please enter a claim');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await ClaimsService.submitClaim(claimForm.claim);
      if (result.success) {
        setSuccessMsg('Claim submitted successfully!');
        setClaimForm({ claim: '' });
        loadClaims();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(result.message || 'Failed to submit claim');
      }
    } catch (err) {
      setError('Connection error. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrustScore = async () => {
    if (!profileForm.username) {
      setError('Please enter a GitHub username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const languagesArray = profileForm.languages
        ? profileForm.languages.split(',').map(l => l.trim()).filter(l => l)
        : [];

      const result = await TrustScoreService.predictTrustScore({
        username: profileForm.username,
        totalStars: parseInt(profileForm.totalStars) || 0,
        totalForks: parseInt(profileForm.totalForks) || 0,
        totalIssues: parseInt(profileForm.totalIssues) || 0,
        totalPRs: parseInt(profileForm.totalPRs) || 0,
        totalContributors: parseInt(profileForm.totalContributors) || 0,
        languages: languagesArray,
        repoCount: parseInt(profileForm.repoCount) || 0,
        credentials: profileForm.credentials
      });

      if (result.success) {
        setTrustScoreData(result.data);
      } else {
        setError(result.message || 'Failed to calculate trust score');
      }
    } catch (err) {
      setError('Connection error. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-[#002B5C] transition-all outline-none hover:border-gray-400";
  const btnClasses = "px-6 py-3 rounded-lg font-semibold text-white shadow-md bg-[#002B5C] hover:bg-[#001f42] hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const tabClasses = (isActive) => `px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${isActive
      ? 'border-[#002B5C] text-[#002B5C]'
      : 'border-transparent text-gray-500 hover:text-[#002B5C] hover:border-gray-300'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#002B5C] mb-2">Professional Dashboard</h1>
          <p className="text-gray-600">Manage your profile, calculate trust scores, and showcase your expertise</p>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg text-sm">
            <span className="mr-2">✅</span>{successMsg}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-[#E60012] text-red-700 rounded-r-lg text-sm">
            <span className="mr-2">⚠️</span>{error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-t-xl shadow-lg border-b border-gray-200">
          <div className="flex flex-wrap gap-2 px-4 sm:px-6">
            <button onClick={() => setActiveTab('trust-score')} className={tabClasses(activeTab === 'trust-score')}>
              📊 Trust Score
            </button>
            <button onClick={() => setActiveTab('profile')} className={tabClasses(activeTab === 'profile')}>
              👤 Profile
            </button>
            <button onClick={() => setActiveTab('claims')} className={tabClasses(activeTab === 'claims')}>
              📝 Claims
            </button>
            <button onClick={() => setActiveTab('credentials')} className={tabClasses(activeTab === 'credentials')}>
              🏆 Credentials
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-xl shadow-lg p-6 lg:p-8">
          {/* Trust Score Tab */}
          {activeTab === 'trust-score' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Left Panel - Input Form */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">GitHub Profile Information</h2>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border-l-4 border-[#E60012] text-red-700 rounded-r-lg text-sm">
                    <span className="mr-2">⚠️</span>{error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">GitHub Username *</label>
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                      className={inputClasses}
                      placeholder="octocat"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Total Stars</label>
                      <input
                        type="number"
                        value={profileForm.totalStars}
                        onChange={(e) => setProfileForm({ ...profileForm, totalStars: e.target.value })}
                        className={inputClasses}
                        placeholder="1500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Total Forks</label>
                      <input
                        type="number"
                        value={profileForm.totalForks}
                        onChange={(e) => setProfileForm({ ...profileForm, totalForks: e.target.value })}
                        className={inputClasses}
                        placeholder="300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Total Issues</label>
                      <input
                        type="number"
                        value={profileForm.totalIssues}
                        onChange={(e) => setProfileForm({ ...profileForm, totalIssues: e.target.value })}
                        className={inputClasses}
                        placeholder="50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Total Pull Requests</label>
                      <input
                        type="number"
                        value={profileForm.totalPRs}
                        onChange={(e) => setProfileForm({ ...profileForm, totalPRs: e.target.value })}
                        className={inputClasses}
                        placeholder="120"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Total Contributors</label>
                      <input
                        type="number"
                        value={profileForm.totalContributors}
                        onChange={(e) => setProfileForm({ ...profileForm, totalContributors: e.target.value })}
                        className={inputClasses}
                        placeholder="25"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Repository Count</label>
                      <input
                        type="number"
                        value={profileForm.repoCount}
                        onChange={(e) => setProfileForm({ ...profileForm, repoCount: e.target.value })}
                        className={inputClasses}
                        placeholder="15"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Languages (comma-separated)</label>
                    <input
                      type="text"
                      value={profileForm.languages}
                      onChange={(e) => setProfileForm({ ...profileForm, languages: e.target.value })}
                      className={inputClasses}
                      placeholder="Python, JavaScript, Go"
                    />
                  </div>

                  <button
                    onClick={fetchTrustScore}
                    disabled={loading || !profileForm.username}
                    className={btnClasses + " w-full"}
                  >
                    {loading ? 'Calculating...' : 'Calculate Trust Score'}
                  </button>
                </div>
              </div>

              {/* Right Panel - Trust Score Visualization */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Trust Score Analysis</h2>

                {trustScoreData ? (
                  <div className="space-y-6">
                    {/* Trust Score Gauge */}
                    <TrustScoreGauge score={trustScoreData.trust_score || 0} />

                    {/* Score Breakdown */}
                    <div className="space-y-4 mt-8">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">GitHub Activity Score</span>
                          <span className="text-sm font-bold text-[#002B5C]">{trustScoreData.github_score?.toFixed(2) || '0.00'}/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-[#002B5C] h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${((trustScoreData.github_score || 0) / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">Credential Score</span>
                          <span className="text-sm font-bold text-[#E60012]">{trustScoreData.credential_score?.toFixed(2) || '0.00'}/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-[#E60012] h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${((trustScoreData.credential_score || 0) / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">Confidence Level</span>
                          <span className={`text-sm font-bold px-3 py-1 rounded-full ${trustScoreData.confidence_level === 'High' ? 'bg-green-100 text-green-700' :
                              trustScoreData.confidence_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                            {trustScoreData.confidence_level || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Credentials Info */}
                      {trustScoreData.credentials_info && (
                        <div className="pt-4 border-t border-gray-200">
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">Credentials Summary</h3>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p>Verified: {trustScoreData.credentials_info.verified_count || 0}</p>
                            <p>Total Submitted: {trustScoreData.credentials_info.total_submitted || 0}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-400">
                    <svg className="w-24 h-24 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                    </svg>
                    <p className="text-center">Enter your GitHub profile information and click "Calculate Trust Score" to see your trust analysis</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile & Experience</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Skills (comma-separated) *</label>
                  <input
                    type="text"
                    value={experienceForm.skillsArray}
                    onChange={(e) => setExperienceForm({ ...experienceForm, skillsArray: e.target.value })}
                    className={inputClasses}
                    placeholder="React, Node.js, Python, AWS"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Experience *</label>
                  <textarea
                    value={experienceForm.experience}
                    onChange={(e) => setExperienceForm({ ...experienceForm, experience: e.target.value })}
                    className={inputClasses + " min-h-[120px]"}
                    placeholder="Describe your professional experience..."
                    rows="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Professional Claim *</label>
                  <textarea
                    value={experienceForm.claimText}
                    onChange={(e) => setExperienceForm({ ...experienceForm, claimText: e.target.value })}
                    className={inputClasses + " min-h-[100px]"}
                    placeholder="What makes you stand out? Your key achievements..."
                    rows="4"
                  />
                </div>
                <button onClick={saveExperience} disabled={loading} className={btnClasses + " w-full"}>
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          )}

          {/* Claims Tab */}
          {activeTab === 'claims' && (
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Professional Claims</h2>
              <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit New Claim</h3>
                <div className="space-y-4">
                  <textarea
                    value={claimForm.claim}
                    onChange={(e) => setClaimForm({ claim: e.target.value })}
                    className={inputClasses + " min-h-[100px]"}
                    placeholder="Enter your professional claim or achievement..."
                    rows="4"
                  />
                  <button onClick={submitClaim} disabled={loading} className={btnClasses}>
                    {loading ? 'Submitting...' : 'Submit Claim'}
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Claims</h3>
                {claims.length > 0 ? (
                  <div className="space-y-3">
                    {claims.map((claim, index) => (
                      <div key={claim._id || index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-start">
                        <p className="text-gray-700 flex-1">{claim.claim}</p>
                        <button
                          onClick={async () => {
                            if (confirm('Delete this claim?')) {
                              const result = await ClaimsService.deleteClaim(claim._id);
                              if (result.success) {
                                loadClaims();
                                setSuccessMsg('Claim deleted successfully');
                                setTimeout(() => setSuccessMsg(''), 3000);
                              }
                            }
                          }}
                          className="ml-4 text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No claims submitted yet</p>
                )}
              </div>
            </div>
          )}

          {/* Credentials Tab */}
          {activeTab === 'credentials' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Professional Credentials</h2>
              <p className="text-gray-600 mb-6">Add and manage your professional certifications and credentials</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <p className="text-blue-700">Credential management coming soon...</p>
                <p className="text-sm text-blue-600 mt-2">You can add credentials when calculating your trust score</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RecruiterView = () => {
  const [activeTab, setActiveTab] = React.useState('search');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [professionals, setProfessionals] = React.useState([]);
  const [filteredProfessionals, setFilteredProfessionals] = React.useState([]);
  const [minTrustScore, setMinTrustScore] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [selectedProfessional, setSelectedProfessional] = React.useState(null);
  const [jobForm, setJobForm] = React.useState({
    title: '',
    description: '',
    requiredSkills: '',
    status: 'open'
  });
  const [jobs, setJobs] = React.useState([]);
  const [successMsg, setSuccessMsg] = React.useState('');

  // 1. UPDATED: Fetching from our new Vetted Professionals endpoint
  const loadProfessionals = async () => {
    setLoading(true);
    try {
      const result = await ProfileService.fetchAll('all');
      if (result.success && Array.isArray(result.data)) {

        const uniqueMap = new Map();
        result.data.forEach(item => {
          // Use the user's ID as the key. If it repeats, it overwrites the old one.
          const userId = item.user?._id || item.user || item._id;
          uniqueMap.set(userId, item);
        });

        const uniqueData = Array.from(uniqueMap.values());

        setProfessionals(uniqueData);
        setFilteredProfessionals(uniqueData);
      }
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    setJobs([]);
  };

  // 2. UPDATED: Filter logic to look at the populated User Name
  const filterProfessionals = () => {
  const filtered = professionals.filter(p => {
    // 1. Get the searchable text (Name, Email, or Skills)
    const fullName = (p.user?.name || p.name || "").toLowerCase();
    const email = (p.user?.email || "").toLowerCase();
    const skills = (p.skillsArray || "").toLowerCase();
    const query = searchQuery.toLowerCase();

    // 2. Check if it matches the search query
    const matchesSearch = fullName.includes(query) || email.includes(query) || skills.includes(query);

    // 3. Check the trust score
    const score = parseFloat(p.currentTrustScore) || 0;
    const matchesScore = score >= minTrustScore;

    return matchesSearch && matchesScore;
  });

  setFilteredProfessionals(filtered);
};
  React.useEffect(() => {
    loadProfessionals();
    loadJobs();
  }, []);

  React.useEffect(() => {
    filterProfessionals();
  }, [searchQuery, minTrustScore, professionals]);

  const tabClasses = (isActive) => `px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${isActive
      ? 'border-[#002B5C] text-[#002B5C]'
      : 'border-transparent text-gray-500 hover:text-[#002B5C] hover:border-gray-300'
    }`;
  const inputClasses = "w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-[#002B5C] transition-all outline-none hover:border-gray-400";
  const btnClasses = "px-6 py-3 rounded-lg font-semibold text-white shadow-md bg-[#002B5C] hover:bg-[#001f42] hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#002B5C] mb-2">Recruiter Portal</h1>
          <p className="text-gray-600">Search for verified talent and manage job postings</p>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg text-sm">
            <span className="mr-2">✅</span>{successMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-t-xl shadow-lg border-b border-gray-200">
          <div className="flex flex-wrap gap-2 px-4 sm:px-6">
            <button onClick={() => setActiveTab('search')} className={tabClasses(activeTab === 'search')}>
              🔍 Search Talent
            </button>
            <button onClick={() => setActiveTab('jobs')} className={tabClasses(activeTab === 'jobs')}>
              💼 Job Postings
            </button>
            <button onClick={() => setActiveTab('analytics')} className={tabClasses(activeTab === 'analytics')}>
              📈 Analytics
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-xl shadow-lg p-6 lg:p-8">
          {activeTab === 'search' && (
            <div>
              <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={inputClasses}
                      placeholder="Search by name..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Trust Score</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={minTrustScore}
                      onChange={(e) => setMinTrustScore(parseFloat(e.target.value) || 0)}
                      className={inputClasses}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-end">
                    <button onClick={filterProfessionals} disabled={loading} className={btnClasses + " w-full"}>
                      {loading ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Results ({filteredProfessionals.length})</h2>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#002B5C]"></div>
                  </div>
                ) : filteredProfessionals.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProfessionals.map((p, index) => (
                      <div key={p._id || index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            {/* FIXED: Added p.name as fallback */}
                            <h3 className="text-lg font-bold text-gray-900">
                              {/* Checks user object, then professional name, then email, then default */}
                              {p.user?.name || p.name || p.user?.email || 'Tech Professional'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {p.user?.email || p.email || 'Contact info hidden'}
                            </p>
                          </div>
                          <div className="text-right">
                            {/* FIXED: Using currentTrustScore instead of score */}
                            <div className="text-2xl font-bold text-[#002B5C]">
                              {parseFloat(p.currentTrustScore || 0).toFixed(1)}
                            </div>
                            <div className="text-xs text-gray-500">Trust Score</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedProfessional(p)}
                          className="mt-4 w-full py-2 text-sm font-semibold text-[#002B5C] border border-[#002B5C] rounded-lg hover:bg-[#002B5C] hover:text-white transition-colors"
                        >
                          View Full Profile
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-12 text-gray-500">No professionals found matching your criteria</p>
                )}
              </div>
            </div>
          )}

          {/* Jobs Tab */}
          {activeTab === 'jobs' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Job Postings</h2>
              <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Job Posting</h3>
                <div className="space-y-4">
                  <input type="text" className={inputClasses} placeholder="Job Title" />
                  <textarea className={inputClasses + " min-h-[100px]"} placeholder="Description"></textarea>
                  <button onClick={() => { setSuccessMsg('Feature coming soon!'); setTimeout(() => setSuccessMsg(''), 3000); }} className={btnClasses + " w-full"}>Post Job</button>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recruitment Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-3xl font-bold text-[#002B5C] mb-2">{professionals.length}</div>
                  <div className="text-sm text-gray-600">Total Professionals</div>
                </div>
                <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-3xl font-bold text-green-700 mb-2">{jobs.length}</div>
                  <div className="text-sm text-gray-600">Active Jobs</div>
                </div>
                <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-3xl font-bold text-purple-700 mb-2">
                    {professionals.length > 0 ? (professionals.reduce((sum, p) => sum + (parseFloat(p.currentTrustScore) || 0), 0) / professionals.length).toFixed(1) : '0.0'}
                  </div>
                  <div className="text-sm text-gray-600">Avg Trust Score</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- MODAL FOR PROFILE DETAILS --- */}
        {selectedProfessional && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#002B5C]">
                  {selectedProfessional.user?.name || selectedProfessional.name} Profile
                </h2>
                <button onClick={() => setSelectedProfessional(null)} className="text-gray-400 text-3xl hover:text-gray-600">&times;</button>
              </div>

              <div className="space-y-6">
                {/* Bio Section */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Professional Bio</h4>
                  <p className="text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-lg border border-blue-100 italic">
                    "{selectedProfessional.claimText || "No professional bio provided."}"
                  </p>
                </div>

                {/* Experience & Skills Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Experience</h4>
                    <p className="text-gray-900 font-semibold bg-gray-50 p-3 rounded-lg border border-gray-100">
                      {selectedProfessional.experience || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Technical Skills</h4>
                    <div className="flex flex-wrap gap-2 p-1">
                      {selectedProfessional.skillsArray ?
                        selectedProfessional.skillsArray.split(',').map((skill, i) => (
                          <span key={i} className="px-3 py-1 bg-[#002B5C] text-white text-[10px] font-bold rounded-full">
                            {skill.trim()}
                          </span>
                        )) : <span className="text-gray-400 text-sm">No skills listed</span>
                      }
                    </div>
                  </div>
                </div>

                {/* VETTING HISTORY */}
                <div className="pt-6 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Vetting History</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">✅</div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">Latest AI Evaluation</p>
                          <p className="text-[10px] text-gray-500">Updated recently</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-[#002B5C]">
                          {parseFloat(selectedProfessional.currentTrustScore || 0).toFixed(1)}
                        </span>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Trust Score</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

};

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