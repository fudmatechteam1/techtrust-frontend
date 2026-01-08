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
// --- SERVICE LAYER: API CONFIGURATION & HELPERS ---
// ====================================================================

const API_CONFIG = {
    AUTH_BASE: 'https://techtrust-backend.onrender.com/api/auth',
    PROFILE_BASE: 'https://techtrust-backend.onrender.com/api/profile',
    CLAIMS_BASE: 'https://techtrust-backend.onrender.com/api/claims'
};

// Helper for standardized error handling (Fault Tolerance)
const handleRequest = async (requestPromise) => {
    try {
        const response = await requestPromise;
        const data = await response.json();
        
        if (response.ok) {
            return { success: true, data };
        } else {
            return { success: false, error: data.message || "Operation failed." };
        }
    } catch (error) {
        console.error("API Request Error:", error);
        return { success: false, error: "Network error. Please check your connection." };
    }
};

// ====================================================================
// --- AUTHENTICATION SERVICE ---
// ====================================================================

const AuthService = {
    register: (name, email, password, userType) => {
        return handleRequest(fetch(`${API_CONFIG.AUTH_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, userType }),
            credentials: 'include'
        }));
    },

    login: (email, password) => {
        return handleRequest(fetch(`${API_CONFIG.AUTH_BASE}/login`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        }));
    },

    logout: () => {
        return handleRequest(fetch(`${API_CONFIG.AUTH_BASE}/logout`, {
            method: 'POST',
            credentials: 'include'
        }));
    },

    // OTP & Account Verification
    sendVerifyOtp: (email) => {
        return handleRequest(fetch(`${API_CONFIG.AUTH_BASE}/sendOtp`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        }));
    },

    verifyAccount: (email, otp) => {
        return handleRequest(fetch(`${API_CONFIG.AUTH_BASE}/verify`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        }));
    },

    // Password Reset Flow
    sendResetOtp: (email) => {
        return handleRequest(fetch(`${API_CONFIG.AUTH_BASE}/sendResetOtp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
            credentials: 'include'
        }));
    },

    resetPassword: (email, otp, newPassword) => {
        return handleRequest(fetch(`${API_CONFIG.AUTH_BASE}/resetPassword`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, newPassword }),
            credentials: 'include'
        }));
    },

    // Fetch all users
    fetchAllUsers: () => {
        return handleRequest(fetch(`${API_CONFIG.AUTH_BASE}/fetch`, {
            method: 'GET',
            credentials: 'include'
        }));
    }
};

// ====================================================================
// --- PROFILE SERVICE ---
// ====================================================================

const ProfileService = {
    // Fetch user by ID
    fetchUserById: (userId) => {
        return handleRequest(fetch(`${API_CONFIG.PROFILE_BASE}/fetch-user/${userId}`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        }));
    },

    // Fetch all profiles
    fetchAllProfiles: () => {
        return handleRequest(fetch(`${API_CONFIG.PROFILE_BASE}/fetch1`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        }));
    },

    // Add experience to profile
    addExperience: (skillsArray, experience, claimText, currentTrustScore) => {
        return handleRequest(fetch(`${API_CONFIG.PROFILE_BASE}/expr`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skillsArray, experience, claimText, currentTrustScore })
        }));
    },

    // Fetch profile by ID
    fetchProfileById: (profileId) => {
        return handleRequest(fetch(`${API_CONFIG.PROFILE_BASE}/fetch-profile/${profileId}`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        }));
    },

    // Update profile
    updateProfile: (profileData) => {
        return handleRequest(fetch(`${API_CONFIG.PROFILE_BASE}/Edit-profile`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
        }));
    }
};

// ====================================================================
// --- CLAIMS SERVICE ---
// ====================================================================

const ClaimsService = {
    // Submit a new claim
    submitClaim: (claimText) => {
        return handleRequest(fetch(`${API_CONFIG.CLAIMS_BASE}/claim`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ claim: claimText })
        }));
    },

    // Remove/delete a claim
    removeClaim: (claimId) => {
        return handleRequest(fetch(`${API_CONFIG.CLAIMS_BASE}/remove/${claimId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        }));
    }
};


// ====================================================================
// --- MOCK DATA (For non-auth features) ---
// ====================================================================
const MOCK_PROFILE_DATA_BASE = {
  name: "Jane Doe (React Dev)",
  title: "Senior Software Architect",
  memberSince: "July 2024",
  lastVetted: "2025-10-21",
};

const MOCK_INITIAL_CLAIMS = [
    { id: 1, text: "Certified AWS Solutions Architect (2023)", status: "VERIFIED" },
    { id: 2, text: "Led Microservices Migration Project (3 years experience)", status: "PENDING" },
    { id: 3, text: "Contributed to Linux Kernel (2022)", status: "REJECTED" },
];

const MOCK_SEARCH_RESULTS = [
    { id: 101, name: "Michael Johnson", title: "DevOps Engineer", score: 9.6, skills: ["Kubernetes", "Terraform", "AWS"], verificationSource: "CNCF" },
    { id: 102, name: "Sarah Chen", title: "Senior Data Scientist", score: 8.9, skills: ["Python", "TensorFlow", "Spark"], verificationSource: "Project A-Z" },
];

const MOCK_API_KEYS = [
    { id: 1, name: "Recruiter Search API", key: "tt-rec-ab1c-d2e3-f4g5", active: true, usage: 1240, limit: 5000 },
];


// ====================================================================
// 1. Header Component
// ====================================================================

const Header = ({ currentView, setView, toggleTheme, themeMode }) => {
  const { primary, secondary, textOnPrimary } = useTheme(); 
  const isLoggedIn = currentView !== 'login'; 
  const isVerifier = currentView === 'verifier'; 
  const isRecruiter = currentView === 'recruiter' || currentView === 'api'; 

  const handleLogout = async () => {
    const result = await AuthService.logout();
    if(result.success) {
        localStorage.clear(); 
        setView('login');
        alert('You have been successfully logged out.');
    } else {
        alert('Logout failed. Clearing local session anyway.');
        localStorage.clear(); 
        setView('login');
    }
  };

  return (
    <header className={`bg-[${primary}] text-[${textOnPrimary}] shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-wider">TechTrust</div>
        <nav className="space-x-6 hidden sm:flex">
          {isLoggedIn && (
            <>
              <a href="#" onClick={() => setView('profile')} className="font-medium hover:text-blue-300 transition-colors">Profile</a>
              <a href="#" onClick={() => setView('recruiter')} className="font-medium hover:text-blue-300 transition-colors">Job Board</a>
              {isVerifier && 
                <a href="#" onClick={() => setView('verifier')} className="font-medium text-yellow-300 hover:text-yellow-100 transition-colors">Verifier Console</a>
              }
              {isRecruiter &&
                <a href="#" onClick={() => setView('api')} className="font-medium text-purple-300 hover:text-purple-100 transition-colors">API Management</a>
              }
            </>
          )}
        </nav>
        
        <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="text-white hover:text-blue-300 transition-colors p-2 rounded-full hover:bg-white/10" title="Toggle Theme">
                {themeMode === 'light' ? '🌙' : '☀️'}
            </button>
            <button 
                onClick={() => isLoggedIn ? handleLogout() : setView('login')} 
                className={`font-semibold px-4 py-1.5 rounded-full transition-colors text-sm 
                            ${isLoggedIn ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : `bg-[${secondary}] text-[${primary}] hover:bg-blue-300`}`}
            >
                {isLoggedIn ? 'Logout' : 'Sign In'}
            </button>
        </div>
      </div>
    </header>
  );
};

// ====================================================================
// 2. Authentication View (Login, Register, Reset Password)
// ====================================================================

const AuthView = ({ setView }) => {
  const { primary, secondary, textOnSecondary, neutralBg } = useTheme(); 
  
  // View Modes: 'login', 'register', 'forgot-password'
  const [authMode, setAuthMode] = React.useState('login'); 
  const [isLoading, setIsLoading] = React.useState(false);

  // State specifically for Password Reset flow
  const [resetStep, setResetStep] = React.useState(1); // 1: Email, 2: OTP & New Password
  const [resetEmail, setResetEmail] = React.useState('');

  const MIN_PASS_LENGTH = 8;

  // --- Handlers ---

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData.entries());

    const result = await AuthService.login(email, password);
    
    setIsLoading(false);
    if (result.success) {
        // Ensure backend sends { user: { userType: ... } }
        const finalUserType = result.data.user?.userType || 'profile'; 
        const userId = result.data.user?._id || result.data.user?.id || 'default-id';
        localStorage.setItem('techtust_user_type', finalUserType);
        localStorage.setItem('techtrust_user_id', userId);
        alert(`Login successful!`);
        setView(finalUserType);
    } else {
        alert(`❌ Login Failed: ${result.error}`);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.target);
    const { name, email, password, user_type } = Object.fromEntries(formData.entries());

    if (password.length < MIN_PASS_LENGTH) {
        alert(`Password must be at least ${MIN_PASS_LENGTH} characters.`);
        setIsLoading(false);
        return;
    }
    
    const result = await AuthService.register(name, email, password, user_type);
    
    setIsLoading(false);
    if (result.success) {
        alert(`✅ Registration successful! Please log in.`);
        setAuthMode('login'); 
    } else {
        alert(`❌ Registration Failed: ${result.error}`);
    }
  };

  const handleForgotPassword = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      const formData = new FormData(e.target);
      
      // Step 1: Send OTP
      if (resetStep === 1) {
          const email = formData.get('email');
          const result = await AuthService.sendResetOtp(email);
          
          if (result.success) {
              setResetEmail(email);
              setResetStep(2);
              alert(`✅ OTP sent to ${email}. Please check your inbox.`);
          } else {
              alert(`❌ Failed to send OTP: ${result.error}`);
          }
      } 
      // Step 2: Reset Password
      else if (resetStep === 2) {
          const otp = formData.get('otp');
          const newPassword = formData.get('newPassword');
          
          const result = await AuthService.resetPassword(resetEmail, otp, newPassword);
          
          if (result.success) {
              alert(`✅ Password reset successful! Please log in.`);
              setAuthMode('login');
              setResetStep(1); // Reset flow for next time
          } else {
              alert(`❌ Password Reset Failed: ${result.error}`);
          }
      }
      setIsLoading(false);
  }

  // --- Renderers ---

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Log In</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email Address</label>
        <input type="email" name="email" className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[${secondary}]`} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input type="password" name="password" className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[${secondary}]`} required />
      </div>
      <div className="flex justify-between items-center">
          <button type="button" onClick={() => setAuthMode('forgot-password')} className={`text-sm text-[${primary}] hover:underline`}>Forgot Password?</button>
      </div>
      <button type="submit" disabled={isLoading} className={`w-full py-2 rounded-md font-semibold text-white bg-[${primary}] hover:bg-indigo-900 disabled:opacity-50`}>
        {isLoading ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  );

  const renderRegisterForm = () => (
    <form onSubmit={handleRegister} className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">Full Name</label>
        <input type="text" name="name" className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[${secondary}]`} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email Address</label>
        <input type="email" name="email" className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[${secondary}]`} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Password (Min 8 chars)</label>
        <input type="password" name="password" minLength="8" className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[${secondary}]`} required />
      </div>
      <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
          <div className="flex space-x-6">
              <label className="inline-flex items-center">
                  <input type="radio" name="user_type" value="profile" defaultChecked className={`form-radio text-[${primary}]`} />
                  <span className="ml-2 text-gray-700">Tech Professional</span>
              </label>
              <label className="inline-flex items-center">
                  <input type="radio" name="user_type" value="recruiter" className={`form-radio text-[${primary}]`} />
                  <span className="ml-2 text-gray-700">Recruiter</span>
              </label>
          </div>
      </div>
      <button type="submit" disabled={isLoading} className={`w-full py-2 rounded-md font-semibold bg-[${secondary}] text-[${textOnSecondary}] hover:bg-blue-300 disabled:opacity-50`}>
        {isLoading ? 'Registering...' : 'Register Account'}
      </button>
    </form>
  );

  const renderForgotPasswordForm = () => (
      <form onSubmit={handleForgotPassword} className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
          
          {resetStep === 1 && (
              <div>
                  <p className="text-sm text-gray-600 mb-4">Enter your email address to receive a One-Time Password (OTP).</p>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input type="email" name="email" className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[${secondary}]`} required />
              </div>
          )}

          {resetStep === 2 && (
              <>
                <p className="text-sm text-gray-600 mb-4">An OTP has been sent to <strong>{resetEmail}</strong>.</p>
                <div>
                    <label className="block text-sm font-medium text-gray-700">OTP Code</label>
                    <input type="text" name="otp" className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[${secondary}]`} required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <input type="password" name="newPassword" minLength="8" className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[${secondary}]`} required />
                </div>
              </>
          )}

          <button type="submit" disabled={isLoading} className={`w-full py-2 rounded-md font-semibold text-white bg-[${primary}] hover:bg-indigo-900 disabled:opacity-50`}>
            {isLoading ? 'Processing...' : (resetStep === 1 ? 'Send OTP' : 'Reset Password')}
          </button>
          
          <button type="button" onClick={() => { setAuthMode('login'); setResetStep(1); }} className="w-full text-sm text-gray-500 hover:text-gray-700 mt-2">
              Back to Login
          </button>
      </form>
  );

  return (
    <div className={`w-full max-w-lg bg-[${neutralBg}] p-8 rounded-lg shadow-xl border border-gray-200`}>
      {/* Tabs for Login/Register only */}
      {authMode !== 'forgot-password' && (
          <div className="flex border-b border-gray-200 mb-6">
            <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-lg font-semibold border-b-2 transition-colors ${authMode === 'login' ? `text-[${primary}] border-[${primary}]` : 'text-gray-500 border-transparent'}`}>
              Log In
            </button>
            <button onClick={() => setAuthMode('register')} className={`flex-1 py-2 text-lg font-semibold border-b-2 transition-colors ${authMode === 'register' ? `text-[${primary}] border-[${primary}]` : 'text-gray-500 border-transparent'}`}>
              Register
            </button>
          </div>
      )}

      {authMode === 'login' && renderLoginForm()}
      {authMode === 'register' && renderRegisterForm()}
      {authMode === 'forgot-password' && renderForgotPasswordForm()}
    </div>
  );
};

// ====================================================================
// 3. Add Claim Modal 
// ====================================================================

const AddClaimModal = ({ isOpen, onClose, onClaimSubmitted }) => {
    const { primary, secondary, neutralBg } = useTheme(); 
    if (!isOpen) return null; 
    
    const [isLoading, setIsLoading] = React.useState(false); 

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const form = e.target.closest('form');
        const formData = new FormData(form);
        const claimTitle = formData.get('claim-title');
        const claimDetails = formData.get('claim-details');
        const fullClaim = `${claimTitle} - ${claimDetails}`;
        
        try {
            // Call actual API to submit claim
            const result = await ClaimsService.submitClaim(fullClaim);

            if (result.success) {
                onClaimSubmitted(claimTitle); 
                alert("✅ Claim Submitted! It is now PENDING verification.");
                onClose();
            } else {
                throw new Error(result.error || "Claim submission failed.");
            }
        } catch (error) {
            console.error('Claim submission failed:', error.message);
            alert(`❌ Submission Failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className={`bg-[${neutralBg}] rounded-lg shadow-2xl w-full max-w-xl p-6 relative`}>
                <h2 className={`text-2xl font-bold text-[${primary}] mb-4 border-b pb-2`}>Submit New Verifiable Claim</h2>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Claim Title</label>
                        <input type="text" name="claim-title" required className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[${secondary}]`} placeholder="e.g., Certified Kubernetes Administrator" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Details / Proof</label>
                        <textarea name="claim-details" rows="4" required className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[${secondary}]`} placeholder="Provide link or summary"></textarea>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                        <button type="submit" disabled={isLoading} className={`px-4 py-2 text-sm font-medium text-white bg-[${primary}] rounded-md hover:bg-indigo-900 disabled:opacity-50`}>{isLoading ? 'Submitting...' : 'Submit'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ====================================================================
// 4. Profile View
// ====================================================================

const ProfileView = ({ claims, trustScore, newlyVerifiedId, onClaimSubmitted, onClaimAction, onAlertDismissed }) => {
  const { primary, secondary, success, neutralBg } = useTheme(); 
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false); 
  const [showAlert, setShowAlert] = React.useState(false);
  
  const newlyVerifiedClaim = claims.find(c => c.id === newlyVerifiedId);

  React.useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // Get current user ID from localStorage or state
        const userId = localStorage.getItem('techtrust_user_id') || 'default-user-id';
        
        // Fetch user profile from API
        const result = await ProfileService.fetchUserById(userId);
        
        if (result.success) {
          const userData = result.data.message || result.data;
          setProfile({
            name: userData.name || "User Profile",
            title: userData.email || "Tech Professional",
            memberSince: userData.createdAt || "Member",
            lastVetted: new Date().toISOString().split('T')[0]
          });
        } else {
          // Fallback to mock data if API fails
          setProfile(MOCK_PROFILE_DATA_BASE);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        setProfile(MOCK_PROFILE_DATA_BASE);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, []);
  
  React.useEffect(() => {
      if (newlyVerifiedId && newlyVerifiedClaim) {
          setShowAlert(true);
          const timer = setTimeout(() => { handleDismiss(); }, 8000); 
          return () => clearTimeout(timer);
      }
  }, [newlyVerifiedId]);

  const handleDismiss = () => { setShowAlert(false); onAlertDismissed(); };

  const handleDeleteClaim = async (claimId) => {
    if(window.confirm('Delete this claim?')) {
      try {
        const result = await ClaimsService.removeClaim(claimId);
        if (result.success) {
          onClaimAction(claimId);
          alert("✅ Claim deleted successfully.");
        } else {
          alert(`❌ Failed to delete claim: ${result.error}`);
        }
      } catch (error) {
        console.error('Error deleting claim:', error);
        alert("❌ Error deleting claim");
        // Still remove from UI optimistically
        onClaimAction(claimId);
      }
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!profile) return <div className="text-center py-10">Failed to load.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
      {showAlert && newlyVerifiedClaim && (
          <div className="lg:col-span-3 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md flex justify-between items-center mb-4">
              <div><span className="text-2xl mr-2">🎉</span> Claim "{newlyVerifiedClaim.text}" Verified!</div>
              <button onClick={handleDismiss} className="font-bold">&times;</button>
          </div>
      )}

      <div className="lg:col-span-1 space-y-6">
        <div className={`bg-[${neutralBg}] p-6 rounded-lg shadow-xl border-t-4 border-[${success}]`}>
          <h3 className="text-xl font-bold text-gray-800 mb-4">Verification Status</h3>
          <div className="text-center">
            <p className={`text-6xl font-extrabold text-[${primary}]`}>{trustScore.toFixed(1)}</p>
            <p className={`text-lg font-semibold text-[${success}] mt-1`}>AI Trust Score</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className={`mt-6 w-full bg-[${secondary}] text-[${primary}] py-2 rounded-md font-semibold hover:bg-blue-300`}>Submit Claims</button>
        </div>
        <div className={`bg-[${neutralBg}] p-6 rounded-lg shadow-xl border border-gray-200`}>
          <h3 className="text-xl font-bold text-gray-800 mb-4">Profile Details</h3>
          <p><strong>Name:</strong> {profile.name}</p>
          <p><strong>Title:</strong> {profile.title}</p>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className={`bg-[${neutralBg}] p-6 rounded-lg shadow-xl border border-gray-200`}>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Verifiable Claims</h3>
            {claims.map(claim => (
                <div key={claim.id} className="border-b py-3 flex justify-between items-center last:border-b-0">
                    <div>
                        <p className="font-semibold text-gray-700">{claim.text}</p>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${claim.status === 'VERIFIED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{claim.status}</span>
                    </div>
                    <button onClick={() => { handleDeleteClaim(claim.id); }} className="text-red-500 text-sm hover:underline">Delete</button>
                </div>
            ))}
        </div>
      </div>
      
      <AddClaimModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onClaimSubmitted={onClaimSubmitted} />
    </div>
  );
};

// ====================================================================
// 5. Recruiter View
// ====================================================================
const RecruiterView = () => {
  const { primary, secondary, neutralBg } = useTheme();
  const [allProfiles, setAllProfiles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAllProfiles = async () => {
      setLoading(true);
      try {
        const result = await ProfileService.fetchAllProfiles();
        if (result.success) {
          const profiles = result.data.message || result.data || [];
          setAllProfiles(Array.isArray(profiles) ? profiles : []);
        } else {
          setAllProfiles(MOCK_SEARCH_RESULTS);
        }
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
        setAllProfiles(MOCK_SEARCH_RESULTS);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllProfiles();
  }, []);

  if (loading) return <div className="text-center py-10">Loading profiles...</div>;

  return (
    <div className={`w-full bg-[${neutralBg}] p-6 rounded-lg shadow-xl`}>
      <h1 className={`text-3xl font-bold text-[${primary}] mb-4`}>Recruiter Dashboard</h1>
      <p className="text-gray-600 mb-6">Browse and search verified tech professionals</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allProfiles.length > 0 ? allProfiles.map((profile, index) => (
          <div key={index} className="border border-gray-300 p-4 rounded-lg hover:shadow-lg transition">
            <h3 className={`text-lg font-bold text-[${primary}]`}>{profile.name || `Profile ${index + 1}`}</h3>
            <p className="text-gray-600">{profile.email || profile.title || 'Tech Professional'}</p>
            <p className="text-sm text-gray-500 mt-2">Skills: {profile.skills?.join(', ') || 'Not specified'}</p>
            <p className={`text-sm font-semibold text-[${secondary}] mt-2`}>Trust Score: {profile.currentTrustScore || 'N/A'}</p>
          </div>
        )) : (
          <div className="col-span-2 text-center py-10 text-gray-500">
            <p>No profiles available yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ====================================================================
// 6. Verifier View
// ====================================================================
const VerifierView = () => {
  const { primary, secondary, neutralBg } = useTheme();
  const [allUsers, setAllUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAllUsers = async () => {
      setLoading(true);
      try {
        const result = await AuthService.fetchAllUsers();
        if (result.success) {
          const users = result.data.message || result.data || [];
          setAllUsers(Array.isArray(users) ? users : []);
        } else {
          setAllUsers([]);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setAllUsers([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllUsers();
  }, []);

  if (loading) return <div className="text-center py-10">Loading verification queue...</div>;

  return (
    <div className={`w-full bg-[${neutralBg}] p-6 rounded-lg shadow-xl`}>
      <h1 className={`text-3xl font-bold text-[${primary}] mb-4`}>Verifier Console</h1>
      <p className="text-gray-600 mb-6">Review and verify user claims and profiles</p>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className={`bg-[${secondary}] text-white`}>
              <th className="border p-2 text-left">User ID</th>
              <th className="border p-2 text-left">Name</th>
              <th className="border p-2 text-left">Email</th>
              <th className="border p-2 text-left">User Type</th>
              <th className="border p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.length > 0 ? allUsers.map((user, index) => (
              <tr key={index} className="hover:bg-gray-100">
                <td className="border p-2">{user.userID || user._id?.substring(0, 8) || `ID-${index}`}</td>
                <td className="border p-2">{user.name || 'N/A'}</td>
                <td className="border p-2">{user.email || 'N/A'}</td>
                <td className="border p-2"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{user.userType || 'User'}</span></td>
                <td className="border p-2"><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Active</span></td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="border p-4 text-center text-gray-500">No users to verify</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ====================================================================
// 7. API Management View
// ====================================================================
const EnterpriseAPIView = () => {
  const { primary, secondary, neutralBg } = useTheme();

  return (
    <div className={`w-full bg-[${neutralBg}] p-6 rounded-lg shadow-xl`}>
      <h1 className={`text-3xl font-bold text-[${primary}] mb-4`}>Enterprise API Management</h1>
      <p className="text-gray-600 mb-6">Manage your API keys and integrations</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-300 p-4 rounded-lg">
          <h3 className={`text-lg font-bold text-[${primary}] mb-2`}>Available APIs</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✅ User Search API - /api/profile/fetch-user</li>
            <li>✅ Profile Fetch API - /api/profile/fetch-profile</li>
            <li>✅ Add Experience API - /api/profile/expr</li>
            <li>✅ Claims API - /api/claims/claim</li>
            <li>✅ Auth API - /api/auth/register, /login, /logout</li>
          </ul>
        </div>
        
        <div className="border border-gray-300 p-4 rounded-lg">
          <h3 className={`text-lg font-bold text-[${primary}] mb-2`}>API Keys</h3>
          <div className="space-y-2">
            {MOCK_API_KEYS.map(key => (
              <div key={key.id} className="flex justify-between items-center text-sm p-2 bg-gray-100 rounded">
                <span className="font-mono text-xs truncate">{key.key}</span>
                <span className={`px-2 py-1 rounded text-xs ${key.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {key.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800"><strong>Base URL:</strong> https://techtrust-backend.onrender.com</p>
      </div>
    </div>
  );
};


// ====================================================================
// 8. App Component (Router & Global State)
// ====================================================================

const App = () => {
  const [currentView, setCurrentView] = React.useState('login'); 
  const [themeMode, setThemeMode] = React.useState('light'); 
  const [trustScore, setTrustScore] = React.useState(9.2); 
  const [newlyVerifiedId, setNewlyVerifiedId] = React.useState(null); 
  const [allClaims, setAllClaims] = React.useState(MOCK_INITIAL_CLAIMS); 

  const toggleTheme = () => setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  const activeTheme = themeMode === 'light' ? THEME_CONFIG : DARK_THEME_CONFIG;

  React.useEffect(() => {
    const userType = localStorage.getItem('techtust_user_type');
    if (userType) setCurrentView(userType); 
  }, []);

  const addClaim = (text) => setAllClaims(prev => [{ id: Date.now(), text, status: 'PENDING' }, ...prev]);
  const removeClaim = (id) => setAllClaims(prev => prev.filter(c => c.id !== id));
  const handleAlertDismissed = () => setNewlyVerifiedId(null);

  let content;
  switch (currentView) {
    case 'login': content = <AuthView setView={setCurrentView} />; break;
    case 'profile': content = <ProfileView claims={allClaims} trustScore={trustScore} newlyVerifiedId={newlyVerifiedId} onClaimSubmitted={addClaim} onClaimAction={removeClaim} onAlertDismissed={handleAlertDismissed} />; break;
    case 'recruiter': content = <RecruiterView />; break;
    case 'verifier': content = <VerifierView />; break;
    case 'api': content = <EnterpriseAPIView />; break;
    default: content = <AuthView setView={setCurrentView} />;
  }

  return (
    <ThemeContext.Provider value={activeTheme.colors}>
      <div className={`min-h-screen flex flex-col ${themeMode === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
        <Header currentView={currentView} setView={setCurrentView} toggleTheme={toggleTheme} themeMode={themeMode} />
        <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-8 flex items-center justify-center">
            {content}
        </main>
        <footer className="bg-gray-800 text-white mt-auto p-4 text-center text-sm">
            &copy; 2025 TechTrust. All rights reserved.
        </footer>
      </div>
    </ThemeContext.Provider>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement); 
    root.render(<React.StrictMode><App /></React.StrictMode>);
}