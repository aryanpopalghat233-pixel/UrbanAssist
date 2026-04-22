import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  Search, 
  MapPin, 
  User, 
  Calendar, 
  Briefcase, 
  TrendingUp, 
  ChevronRight,
  Scissors,
  Sparkles,
  Wind,
  Home as HomeHouse,
  Bug,
  Zap,
  Droplets,
  Palette,
  X,
  Navigation,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Star,
  Menu,
  Filter,
  Check,
  Lock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, SERVICES, Service, Booking } from './constants';
import { cn } from './lib/utils';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';
import L from 'leaflet';

// Leaflet icon fix
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const socket = io();

// Search Context for global search state
interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const SearchContext = createContext<SearchContextType>({
  searchQuery: '',
  setSearchQuery: () => {},
});

const useSearch = () => useContext(SearchContext);

// Auth Context
interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isAuthModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  isSidebarOpen: false,
  toggleSidebar: () => {},
});

const useAuth = () => useContext(AuthContext);

// Constants for icons mapping
const iconMap: Record<string, any> = {
  Scissors, Sparkles, Wind, Home: HomeHouse, Bug, Zap, Droplets, Palette
};

function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      login(data.user, data.token);
      closeAuthModal();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-ink/40 backdrop-blur-md">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-slate-border"
        >
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-ink">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p className="text-sm text-slate-500 font-medium">{isLogin ? 'Sign in to access your dashboard' : 'Join our premium service network'}</p>
              </div>
              <button onClick={closeAuthModal} className="p-2 hover:bg-slate-secondary rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
            </div>

            {error && <div className="p-4 bg-rose-50 text-rose-500 text-xs font-bold rounded-xl mb-6 border border-rose-100">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Full Name</label>
                  <input 
                    required 
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full h-12 px-4 rounded-xl border border-slate-border bg-slate-background focus:ring-2 focus:ring-brand/20 outline-none transition-all text-sm font-medium" 
                    placeholder="John Doe" 
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Email Address</label>
                <input 
                  required 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full h-12 px-4 rounded-xl border border-slate-border bg-slate-background focus:ring-2 focus:ring-brand/20 outline-none transition-all text-sm font-medium" 
                  placeholder="john@example.com" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Password</label>
                <input 
                  required 
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full h-12 px-4 rounded-xl border border-slate-border bg-slate-background focus:ring-2 focus:ring-brand/20 outline-none transition-all text-sm font-medium" 
                  placeholder="••••••••" 
                />
              </div>

              <button 
                disabled={isLoading}
                className="w-full h-14 bg-slate-ink text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all mt-4"
              >
                {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-brand transition-colors"
              >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isBooking, setIsBooking] = useState(false);
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [workerCount, setWorkerCount] = useState(0);
  const { user, openAuthModal } = useAuth();
  const service = SERVICES.find(s => s.id === id);

  useEffect(() => {
    if (service) {
      fetch('/api/workers')
        .then(r => r.json())
        .then(workers => {
          const count = workers.filter((w: any) => w.service === service.name).length;
          setWorkerCount(count);
        })
        .catch(e => console.error(e));
    }
  }, [service]);

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <X size={48} className="mb-4" />
        <p className="font-bold uppercase tracking-widest text-xs">Service Not Found</p>
        <Link to="/" className="text-brand text-xs font-black uppercase tracking-widest mt-4 border-b-2 border-brand pb-1">Return to Directory</Link>
      </div>
    );
  }

  const detectLocation = () => {
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsDetecting(false);
      },
      () => setIsDetecting(false)
    );
  };

  const handleBook = async () => {
    console.log('Book Now clicked');
    if (!user) {
      console.log('User not logged in, opening auth modal');
      openAuthModal();
      return;
    }
    if (!address || address.trim() === '') {
      console.log('Address missing');
      alert('Please enter your service address before booking.');
      return;
    }

    if (isBooking) return;

    setIsBooking(true);
    try {
      const payload = {
        service: service.name,
        category: service.category,
        price: service.price,
        date: new Date().toISOString(),
        userId: user.id || (user as any)._id, // Safety for ID naming
        address: address.trim(),
        coordinates: coords
      };

      console.log('Sending booking request with payload:', payload);
      
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log('Server response:', data);
      
      if (!res.ok) {
        throw new Error(data.error || `Server responded with status ${res.status}`);
      }

      alert('Service Booked Successfully!');
      navigate('/profile');
    } catch (err) {
      console.error('CRITICAL: Booking Failed:', err);
      alert(err instanceof Error ? err.message : 'An unexpected error occurred during booking. Please check your connection and try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const IconComp = iconMap[service.icon];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto space-y-6 lg:space-y-8"
    >
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-ink transition-colors font-bold text-[10px] uppercase tracking-widest px-2 lg:px-0"
      >
        <ArrowLeft size={16} />
        Back to Search
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          <div className="bg-white p-6 lg:p-10 rounded-[24px] lg:rounded-[32px] border border-slate-border shadow-sm">
            <div className="flex items-start justify-between mb-8">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl lg:rounded-3xl bg-slate-secondary flex items-center justify-center text-brand">
                {IconComp && <IconComp size={32} />}
              </div>
              <div className="flex flex-col items-end">
                <div className="px-3 py-1 lg:px-4 lg:py-1.5 rounded-full bg-sky-50 text-brand text-[9px] lg:text-[10px] font-black uppercase tracking-widest mb-2">
                  {service.category}
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star size={14} fill="currentColor" />
                  <span className="text-sm font-black text-slate-ink">4.8</span>
                  <span className="text-[10px] font-bold text-slate-400">(2.4k reviews)</span>
                </div>
              </div>
            </div>

            <h1 className="text-2xl lg:text-4xl font-black text-slate-ink tracking-tight mb-2">{service.name}</h1>
            <div className="flex items-center gap-2 mb-6">
              <div className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-100/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {workerCount} {service.name} Specialists Available
              </div>
            </div>
            <p className="text-slate-500 font-medium leading-relaxed text-base lg:text-lg mb-8 lg:mb-10">
              {service.longDescription}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              {service.highlights.map((highlight, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 lg:p-4 rounded-xl bg-slate-background border border-slate-border">
                  <CheckCircle2 size={18} className="text-brand shrink-0" />
                  <span className="text-xs lg:text-sm font-bold text-slate-700">{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 lg:p-10 rounded-[24px] lg:rounded-[32px] border border-slate-border shadow-sm space-y-6">
            <h3 className="text-lg lg:text-xl font-black text-slate-ink">Service Process</h3>
            <div className="space-y-6">
              {[
                { title: 'Slot Booking', desc: 'Select preferred time and request.', icon: Clock },
                { title: 'Specialist Assigned', desc: 'Verified professional handles your task.', icon: User },
                { title: 'On-site Execution', desc: 'Step-by-step mess-free implementation.', icon: ShieldCheck },
              ].map((step, i) => (
                <div key={i} className="flex gap-4 lg:gap-6">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-slate-secondary flex items-center justify-center text-slate-ink shrink-0">
                    <step.icon size={20} />
                  </div>
                  <div>
                    <h5 className="text-sm lg:text-base font-bold text-slate-ink">{step.title}</h5>
                    <p className="text-xs lg:text-sm text-slate-500 font-medium mt-1">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 lg:p-8 rounded-[24px] lg:rounded-[32px] border border-slate-border shadow-xl lg:sticky lg:top-28">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Reservation Summary</div>
            
            <div className="space-y-6 mb-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Service Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Enter street address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full h-11 pl-9 pr-4 bg-slate-secondary border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand/20 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
                <button 
                  onClick={detectLocation}
                  disabled={isDetecting}
                  className="flex items-center gap-2 text-[9px] font-black text-brand uppercase tracking-widest pl-1 hover:opacity-70 transition-opacity"
                >
                  <Navigation size={10} className={cn(isDetecting && "animate-pulse")} />
                  {coords ? "Location Pinned" : (isDetecting ? "Detecting..." : "Detect Location")}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">Base Price</span>
                <span className="text-xl lg:text-2xl font-black text-slate-ink">₹{service.price}</span>
              </div>
            </div>

            <button 
              disabled={isBooking}
              onClick={handleBook}
              className="w-full h-14 lg:h-16 bg-slate-ink text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition-all"
            >
              {isBooking ? "Confirming..." : "Book Now"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Sidebar() {
  const location = useLocation();
  const { isSidebarOpen, toggleSidebar, user } = useAuth();

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-slate-ink/30 backdrop-blur-[2px] z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed inset-y-0 left-0 w-70 bg-white border-r border-slate-border p-6 flex flex-col gap-8 z-[70] transition-transform duration-300 lg:translate-x-0 overflow-y-auto",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between">
          <Link to="/" onClick={() => isSidebarOpen && toggleSidebar()} className="text-2xl font-extrabold tracking-tighter text-slate-ink">
            URBAN<span className="text-brand">ASSIST</span>
          </Link>
          <button onClick={toggleSidebar} className="lg:hidden p-2 hover:bg-slate-secondary rounded-lg transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        
        <nav className="flex flex-col gap-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-4">Navigation</div>
          {[
            { label: 'Home Services', path: '/', icon: HomeIcon },
            { label: 'Careers & Jobs', path: '/careers', icon: Briefcase },
            { label: 'Activity Logs', path: '/profile', icon: Calendar },
            ...(user?.email === 'aryanpopalghat233@gmail.com' ? [{ label: 'Fleet Control', path: '/admin', icon: ShieldCheck }] : [])
          ].map((link) => (
            <Link 
              key={link.path} 
              to={link.path}
              onClick={() => isSidebarOpen && toggleSidebar()}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
                location.pathname === link.path 
                  ? "bg-sky-50 text-brand font-semibold shadow-sm shadow-sky-100/50" 
                  : "text-slate-500 hover:bg-slate-secondary hover:text-slate-ink"
              )}
            >
              <link.icon size={18} />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-secondary">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Partner with us</div>
          <Link 
            to="/careers" 
            onClick={() => isSidebarOpen && toggleSidebar()}
            className="w-full bg-slate-ink text-white py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-black transition-colors"
          >
            Apply Now
          </Link>
        </div>
      </aside>
    </>
  );
}

function Header() {
  const { searchQuery, setSearchQuery } = useSearch();
  const { user, openAuthModal, logout, toggleSidebar } = useAuth();
  
  return (
    <header className="h-20 lg:h-24 bg-white border-b border-slate-border sticky top-0 z-40 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-2 lg:gap-4 flex-1 max-w-full lg:max-w-xl">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2.5 hover:bg-slate-secondary rounded-xl transition-colors shrink-0"
        >
          <Menu size={20} className="text-slate-ink" />
        </button>

        <div className="hidden sm:flex items-center gap-2 px-3 lg:px-4 py-2 bg-slate-secondary rounded-lg text-[10px] lg:text-sm text-slate-600 font-medium whitespace-nowrap">
          <MapPin size={14} className="text-brand" />
          <span>New York, NY</span>
        </div>

        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 lg:h-11 pl-10 pr-4 bg-slate-secondary border-none rounded-xl text-sm focus:ring-2 focus:ring-brand/20 outline-none transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-ink"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 lg:gap-4 ml-2 lg:ml-4">
        {user ? (
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[10px] lg:text-xs font-black text-slate-ink leading-tight uppercase tracking-wider truncate max-w-[100px]">{user.name}</span>
              <button onClick={logout} className="text-[10px] font-bold text-slate-400 hover:text-rose-500 text-left">Logout</button>
            </div>
            <Link to="/profile" className="w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-brand flex items-center justify-center text-white font-black text-sm shadow-lg shadow-brand/20 uppercase shrink-0">
              {user.name.charAt(0)}
            </Link>
          </div>
        ) : (
          <button 
            onClick={openAuthModal}
            className="px-4 lg:px-6 py-2 lg:py-3 rounded-xl bg-slate-ink text-white text-[9px] lg:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10 hover:bg-black transition-all whitespace-nowrap"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="h-14 bg-slate-ink text-white/60 flex items-center justify-center text-[10px] font-bold uppercase tracking-[0.1em]">
      Secure connections via MongoDB Atlas • Service Trust Guarantee 2024
    </footer>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-background lg:pl-70 flex flex-col">
      <Sidebar />
      <Header />
      <main className="flex-1 bg-slate-secondary/50 p-4 lg:p-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function CategoryTabs({ active, onChange }: { active: string, onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-6 no-scrollbar">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={cn(
            "whitespace-nowrap px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
            active === cat 
              ? "bg-brand text-white shadow-lg shadow-brand/20" 
              : "bg-white text-slate-500 border border-slate-border hover:bg-slate-50"
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

function TrackingView() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState<{lat: number, lng: number, name?: string} | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelStep, setCancelStep] = useState<'none' | 'confirm'>('none');
  const [cancelReason, setCancelReason] = useState('Traffic Delays');

  useEffect(() => {
    socket.emit('join:room', bookingId || 'demo');
    socket.on('worker:location', (data) => {
      setLocation({ lat: data.lat, lng: data.lng, name: data.name });
    });
    return () => { socket.off('worker:location'); };
  }, [bookingId]);

  const handleCancel = async () => {
    if (!bookingId) {
      console.warn('TrackingView: Attempted cancel without bookingId');
      return;
    }
    
    console.log('TrackingView: Cancelling booking:', bookingId);
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });

      const data = await res.json();
      console.log('TrackingView: Cancel response:', data);

      if (!res.ok) {
        throw new Error(data.error || `Failed to cancel: ${res.status}`);
      }

      alert('Service Cancelled Successfully');
      navigate('/profile');
    } catch (err) {
      console.error('TrackingView: Cancellation Error:', err);
      alert(err instanceof Error ? err.message : 'An error occurred while cancelling. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="h-[400px] lg:h-[600px] w-full relative rounded-[24px] lg:rounded-3xl overflow-hidden border border-slate-border shadow-xl bg-slate-secondary">
      {location ? (
        <MapContainer center={[location.lat, location.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[location.lat, location.lng]}>
            <Popup>Your Worker is arriving soon!</Popup>
          </Marker>
        </MapContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-slate-400 p-6 text-center">
          <div>
            <div className="relative inline-block mb-4">
               <Navigation className="w-10 h-10 lg:w-12 lg:h-12 text-brand animate-pulse" />
               <div className="absolute inset-0 bg-brand/20 blur-xl animate-pulse rounded-full"></div>
            </div>
            <p className="text-[10px] lg:text-sm font-black uppercase tracking-widest">Pinpointing GPS Tracker...</p>
          </div>
        </div>
      )}

      {/* Floating Info Card */}
      <div className="absolute bottom-4 left-4 right-4 lg:bottom-auto lg:top-6 lg:left-6 lg:right-auto z-[1000] bg-white/95 backdrop-blur-md p-4 lg:p-5 rounded-2xl shadow-2xl border border-slate-border w-auto lg:w-[280px]">
        <div className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Live Tracking</div>
        <div className="flex items-center gap-3 lg:gap-4 mb-4 lg:mb-5">
          <div className="w-10 h-10 lg:w-14 lg:h-14 bg-slate-secondary rounded-xl lg:rounded-2xl flex items-center justify-center border border-slate-border shrink-0">
            <User className="text-slate-ink" size={20} />
          </div>
          <div>
            <p className="text-xs lg:text-sm font-bold text-slate-ink">{location?.name || 'Assigned Specialist'}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[8px] lg:text-[9px] font-black uppercase tracking-wider">Active</span>
              <p className="text-[9px] lg:text-[10px] text-slate-500 font-bold">• Live Updates</p>
            </div>
          </div>
        </div>
...

        {cancelStep === 'none' ? (
          <button 
            onClick={() => setCancelStep('confirm')}
            className="w-full py-3 rounded-xl border border-rose-100 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-colors"
          >
            Cancel Service (Worker)
          </button>
        ) : (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 pt-4 border-t border-slate-border"
          >
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Specify Reason</label>
              <select 
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-secondary text-xs font-bold border-none focus:ring-1 focus:ring-rose-200 outline-none"
              >
                <option>Traffic Delays</option>
                <option>Emergency Issue</option>
                <option>Vehicle Breakdown</option>
                <option>Incorrect Address</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setCancelStep('none')}
                className="flex-1 py-3 rounded-xl bg-slate-secondary text-[10px] font-bold text-slate-ink"
              >
                Back
              </button>
              <button 
                disabled={isCancelling}
                onClick={handleCancel}
                className="flex-1 py-3 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200"
              >
                {isCancelling ? "Processing..." : "Confirm"}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<any[]>([]);
  
  if (!user || user.email !== 'aryanpopalghat233@gmail.com') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Lock size={48} className="mb-4" />
        <p className="font-bold uppercase tracking-widest text-xs">Access Restricted</p>
        <p className="text-[10px] font-medium mt-2">Only authorized administrators can access this panel.</p>
        <button onClick={() => navigate('/')} className="text-brand text-xs font-black uppercase tracking-widest mt-6 border-b-2 border-brand pb-1">Return to Directory</button>
      </div>
    );
  }
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [service, setService] = useState(SERVICES[0].name);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWorkers = async () => {
    try {
      const res = await fetch('/api/workers');
      const data = await res.json();
      setWorkers(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    const l = parseFloat(lat);
    const g = parseFloat(lng);

    if (isNaN(l) || isNaN(g)) {
      alert('Please enter valid numerical coordinates');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          service,
          coordinates: { lat: l, lng: g }
        })
      });
      
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to add worker');
      }

      setName(''); setLat(''); setLng('');
      alert('Worker registered successfully!');
      fetchWorkers();
    } catch (e) { 
      console.error(e); 
      alert(e instanceof Error ? e.message : 'Error adding worker');
    }
    finally { setIsLoading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/workers/${id}`, { method: 'DELETE' });
      fetchWorkers();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="bg-white p-8 lg:p-12 rounded-[32px] border border-slate-border shadow-xl">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-slate-ink rounded-xl flex items-center justify-center text-white">
            <Lock size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-ink">Control Panel</h2>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Worker Fleet Management</p>
          </div>
        </div>

        <form onSubmit={handleAddWorker} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-slate-secondary/50 p-6 rounded-2xl border border-slate-border mb-12">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">Worker Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full h-11 px-4 rounded-xl bg-white border border-slate-border text-xs font-bold outline-none focus:ring-2 focus:ring-brand/20" placeholder="e.g. Amit Singh" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">Service Type</label>
            <select value={service} onChange={e => setService(e.target.value)} className="w-full h-11 px-4 rounded-xl bg-white border border-slate-border text-xs font-bold outline-none appearance-none">
              {SERVICES.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">Latitude</label>
            <input required type="number" step="any" value={lat} onChange={e => setLat(e.target.value)} className="w-full h-11 px-4 rounded-xl bg-white border border-slate-border text-xs font-bold outline-none focus:ring-2 focus:ring-brand/20" placeholder="19.0760" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">Longitude</label>
            <input required type="number" step="any" value={lng} onChange={e => setLng(e.target.value)} className="w-full h-11 px-4 rounded-xl bg-white border border-slate-border text-xs font-bold outline-none focus:ring-2 focus:ring-brand/20" placeholder="72.8777" />
          </div>
          <div className="flex items-end">
            <button disabled={isLoading} className="w-full h-11 bg-brand text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-transform">
              {isLoading ? "Adding..." : "Register Worker"}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-ink uppercase tracking-widest mb-6 px-1">Active Fleet ({workers.length})</h3>
          <div className="grid grid-cols-1 gap-4">
            {workers.map((w) => (
              <div key={w._id} className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-border hover:shadow-lg hover:border-brand/20 transition-all group">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-slate-secondary flex items-center justify-center text-slate-400 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                     <User size={18} />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-ink">{w.name}</p>
                     <div className="flex items-center gap-2 mt-0.5">
                       <span className="text-[9px] font-black uppercase text-brand bg-brand/5 px-1.5 py-0.5 rounded">{w.service}</span>
                       <span className="text-[10px] font-medium text-slate-400">GPS: {w.coordinates.lat.toFixed(4)}, {w.coordinates.lng.toFixed(4)}</span>
                     </div>
                   </div>
                </div>
                <button onClick={() => handleDelete(w._id)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors">
                  <X size={16} />
                </button>
              </div>
            ))}
            {workers.length === 0 && <p className="text-center py-10 text-slate-400 font-bold text-xs">No dynamic workers registered yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function CareerPortal() {
  const [status, setStatus] = useState<string | null>(null);
  const [areaCoords, setAreaCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const { user, openAuthModal } = useAuth();

  const detectLocation = () => {
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAreaCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsDetecting(false);
      },
      () => setIsDetecting(false)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      ...Object.fromEntries(formData),
      baseCoordinates: areaCoords
    };
    
    try {
      await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setStatus('success');
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12">
      <div className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-border">
        <div className="flex items-center gap-6 mb-10">
          <div className="w-16 h-16 bg-slate-ink rounded-2xl flex items-center justify-center text-white">
            <Briefcase size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-ink tracking-tight">Become a Partner</h2>
            <p className="text-slate-500 font-medium text-sm">Join UrbanAssist's specialist network</p>
          </div>
        </div>

        {status === 'success' ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-10">
            <div className="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-6 text-brand shadow-inner">
              <Sparkles size={36} />
            </div>
            <h3 className="text-xl font-black text-slate-ink mb-2">Application Received</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8 px-8">Your profile is currently under review. Expect a call from our recruitment lead within 48 hours.</p>
            <Link to="/" className="inline-block px-10 py-4 bg-slate-ink text-white rounded-xl font-bold text-sm tracking-wider uppercase shadow-xl hover:scale-105 transition-transform">Back to dashboard</Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Full Name</label>
                <input name="name" required className="w-full h-12 px-4 rounded-xl border border-slate-border bg-slate-background focus:ring-2 focus:ring-brand/20 outline-none transition-all text-sm font-medium" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Email Address</label>
                <input name="email" type="email" required className="w-full h-12 px-4 rounded-xl border border-slate-border bg-slate-background focus:ring-2 focus:ring-brand/20 outline-none transition-all text-sm font-medium" placeholder="john@urbanpro.com" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Specialization</label>
              <select name="service" required className="w-full h-12 px-4 rounded-xl border border-slate-border bg-slate-background focus:ring-2 focus:ring-brand/20 outline-none transition-all text-sm font-medium appearance-none">
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Service Area / Location</label>
              <div className="relative">
                <input 
                  name="serviceArea" 
                  required 
                  className="w-full h-12 px-4 rounded-xl border border-slate-border bg-slate-background focus:ring-2 focus:ring-brand/20 outline-none transition-all text-sm font-medium" 
                  placeholder="e.g. South Manhattan, NY" 
                />
                <button 
                  type="button"
                  onClick={detectLocation}
                  disabled={isDetecting}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[9px] font-black text-brand uppercase tracking-widest hover:opacity-70 transition-opacity"
                >
                  <Navigation size={10} className={cn(isDetecting && "animate-pulse")} />
                  {areaCoords ? "Pinned" : "Pin Location"}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Years of Experience</label>
              <input name="experience" type="number" required className="w-full h-12 px-4 rounded-xl border border-slate-border bg-slate-background focus:ring-2 focus:ring-brand/20 outline-none transition-all text-sm font-medium" placeholder="e.g. 5" />
            </div>
            <button className="w-full h-14 bg-brand text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-brand/20 hover:bg-brand/90 transition-all active:scale-[0.98] mt-4">
              Submit Application
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Home() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [availabilityFilters, setAvailabilityFilters] = useState<string[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const navigate = useNavigate();
  const { searchQuery } = useSearch();

  useEffect(() => {
    fetch('/api/workers')
      .then(r => r.json())
      .then(setWorkers)
      .catch(e => console.error(e));
  }, []);

  const getWorkerCount = (serviceName: string) => {
    return workers.filter(w => w.service === serviceName).length;
  };

  // Define availability types
  const AVAILABILITY_TYPES = [
    { label: 'Available', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'High Demand', color: 'text-brand', bg: 'bg-sky-50', border: 'border-sky-100' },
    { label: 'Few Slots', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' }
  ];

  // Memoize service availabilities so they are stable
  const serviceAvailabilities = React.useMemo(() => {
    return SERVICES.reduce((acc, service, index) => {
      // Deterministic but "random-looking" assignment based on index
      acc[service.id] = AVAILABILITY_TYPES[index % 3];
      return acc;
    }, {} as Record<string, typeof AVAILABILITY_TYPES[0]>);
  }, []);

  const filteredServices = SERVICES.filter(s => {
    const matchesCategory = activeCategory === 'All' || s.category === activeCategory;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         s.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Availability Filter logic
    const serviceAvail = serviceAvailabilities[s.id];
    const matchesAvailability = availabilityFilters.length === 0 || availabilityFilters.includes(serviceAvail.label);

    return matchesCategory && matchesSearch && matchesAvailability;
  });

  const toggleAvailabilityFilter = (label: string) => {
    setAvailabilityFilters(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-slate-ink tracking-tight">Services Directory</h1>
          <p className="text-slate-500 font-medium">Browse verified professionals for your home needs.</p>
        </div>
        
        {/* Availability Quick Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-border rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Filter size={12} className="text-brand" />
            Live Status
          </div>
          {AVAILABILITY_TYPES.map((type) => {
            const isActive = availabilityFilters.includes(type.label);
            return (
              <button
                key={type.label}
                onClick={() => toggleAvailabilityFilter(type.label)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-2",
                  isActive 
                    ? cn(type.bg, type.color, type.border, "shadow-sm") 
                    : "bg-white text-slate-400 border-slate-border hover:border-slate-300"
                )}
              >
                {isActive && <Check size={10} />}
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      <CategoryTabs active={activeCategory} onChange={setActiveCategory} />
      
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredServices.map((service) => {
            const IconComp = iconMap[service.icon];
            const availability = serviceAvailabilities[service.id];

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={service.id}
                onClick={() => navigate(`/service/${service.id}`)}
                className="group p-6 bg-white rounded-[24px] border border-slate-border cursor-pointer hover:border-brand hover:shadow-2xl hover:shadow-brand/15 hover:-translate-y-1.5 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-8">
                   <div className="w-14 h-14 rounded-2xl bg-slate-secondary flex items-center justify-center text-slate-ink group-hover:bg-brand group-hover:text-white transition-all duration-300">
                     {IconComp && <IconComp size={24} />}
                   </div>
                   <div className="flex flex-col items-end gap-1.5">
                     <div className="px-3 py-1 rounded-full bg-slate-secondary text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                       {service.category}
                     </div>
                     <div className={cn("px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-[0.1em] flex items-center gap-1.5", availability.bg, availability.color)}>
                       <span className="w-1 h-1 rounded-full bg-current animate-pulse"></span>
                       {availability.label}
                     </div>
                   </div>
                </div>
                <h3 className="font-bold text-slate-ink mb-1 text-lg group-hover:text-brand">{service.name}</h3>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed line-clamp-2">{service.description}</p>
                 <div className="flex items-center justify-between pt-4 border-t border-slate-secondary">
                  <div className="flex flex-col">
                    <div className="text-slate-ink font-black text-xl">₹{service.price}</div>
                    <div className="flex items-center gap-1.5 mt-1 text-[9px] font-bold text-slate-400">
                      <User size={10} className="text-brand" />
                      {getWorkerCount(service.name)} Specialists
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-ink text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredServices.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white/50 rounded-[32px] border border-dashed border-slate-border">
             <Search size={48} className="mx-auto text-slate-200 mb-4" />
             <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No services found with these filters</p>
             <button 
               onClick={() => { setActiveCategory('All'); setAvailabilityFilters([]); }}
               className="text-brand text-[10px] font-black uppercase tracking-[0.2em] mt-4 border-b-2 border-brand pb-1 active:scale-95 transition-transform"
             >
               Reset All Filters
             </button>
          </div>
        )}
      </section>
    </div>
  );
}

function StarRating({ rating, onRate, readonly = false }: { rating: number, onRate?: (r: number) => void, readonly?: boolean }) {
  const [hovered, setHovered] = useState(0);
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          disabled={readonly}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => !readonly && onRate && onRate(star)}
          className={cn(
            "transition-all",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110",
            (hovered || rating) >= star ? "text-amber-400" : "text-slate-200"
          )}
        >
          <Star size={16} fill={(hovered || rating) >= star ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}

function Profile() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchBookings = () => {
    console.log('Profile: Fetching bookings...');
    fetch('/api/bookings')
      .then(r => r.json())
      .then(data => {
        console.log('Profile: Bookings received:', data);
        setBookings(data);
      })
      .catch(err => console.error('Profile: Fetch Error:', err));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleRate = async (bookingId: string, rating: number) => {
    try {
      await fetch(`/api/bookings/${bookingId}/rate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!bookingId) {
      console.error('Profile: Missing bookingId for cancellation');
      alert('Error: Missing Booking ID');
      return;
    }
    
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    console.log('Profile: Attempting cancellation for:', bookingId);
    try {
      const resp = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User requested cancellation' }),
      });
      
      const data = await resp.json();
      console.log('Profile: Cancel response:', data);
      
      if (!resp.ok) {
        throw new Error(data.error || `Server responded with ${resp.status}`);
      }

      alert('Booking cancelled successfully');
      fetchBookings();
    } catch (err) {
      console.error('Profile: Cancellation Error:', err);
      alert(err instanceof Error ? err.message : 'An error occurred during cancellation');
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <User size={48} className="mb-4 opacity-20" />
        <p className="font-bold uppercase tracking-widest text-xs">Login Required</p>
        <p className="text-[10px] font-medium mt-2 max-w-[200px] text-center">Sign in to view your detailed activity logs and service history.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 lg:space-y-12">
      <header className="flex flex-col sm:flex-row items-center justify-between p-6 lg:p-10 bg-white rounded-[24px] lg:rounded-[32px] border border-slate-border shadow-sm gap-6">
        <div className="flex items-center gap-5 lg:gap-8 text-center sm:text-left flex-col sm:flex-row">
          <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-[24px] lg:rounded-[32px] bg-brand flex items-center justify-center text-white text-3xl lg:text-4xl font-black shadow-xl shadow-brand/20 uppercase shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-black text-slate-ink tracking-tight">{user.name}</h1>
            <p className="text-[10px] lg:text-sm text-slate-500 font-bold tracking-wide uppercase">PRO MEMBER • {bookings.length} SERVICES COMPLETED</p>
          </div>
        </div>
        <button className="w-full sm:w-auto px-8 py-3 rounded-xl border border-slate-border text-[10px] font-black uppercase tracking-widest text-slate-ink hover:bg-slate-secondary transition-all">Settings</button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 lg:space-y-8 order-2 lg:order-1">
          <div className="flex items-center gap-3 px-2">
            <Calendar size={20} className="text-brand" />
            <h2 className="text-lg lg:text-xl font-black text-slate-ink">Service Timeline</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="p-6 lg:p-8 bg-white rounded-[24px] lg:rounded-3xl border border-slate-border hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                  <div className="flex gap-4 lg:gap-6 w-full">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 bg-slate-secondary rounded-xl lg:rounded-2xl flex items-center justify-center text-slate-ink group-hover:bg-brand group-hover:text-white transition-all shrink-0">
                      <TrendingUp size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base lg:text-lg font-black text-slate-ink group-hover:text-brand transition-colors truncate">{booking.service}</h4>
                      <div className="flex items-center gap-2 lg:gap-3 mt-1 flex-wrap">
                        <span className="text-[9px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">{booking.category}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-[9px] lg:text-xs font-bold text-slate-400">{new Date(booking.date).toLocaleDateString()}</span>
                      </div>
                      
                      {booking.address && (
                        <div className="mt-3 flex items-start gap-2 bg-slate-secondary/50 p-2.5 rounded-xl border border-slate-border/50">
                          <MapPin size={12} className="text-brand shrink-0 mt-0.5" />
                          <span className="text-[10px] lg:text-[11px] font-bold text-slate-500 leading-snug break-words">{booking.address}</span>
                        </div>
                      )}
                      
                      <div className="mt-4 pt-4 border-t border-slate-secondary flex items-center gap-4 flex-wrap">
                         <div className="flex items-center gap-2">
                           <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-slate-secondary flex items-center justify-center text-slate-400 shrink-0">
                             <User size={12} />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Specialist</span>
                             <span className="text-[10px] lg:text-xs font-bold text-slate-600">{booking.workerName || 'Professional'}</span>
                           </div>
                         </div>
                         
                         <div className="hidden sm:block w-px h-6 bg-slate-secondary"></div>
                         
                         <div className="flex flex-col gap-1 w-full sm:w-auto mt-2 sm:mt-0">
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Feedback</span>
                           {booking.status === 'Completed' ? (
                             <StarRating 
                               rating={booking.rating || 0} 
                               onRate={(r) => booking._id && handleRate(booking._id, r)} 
                             />
                           ) : (
                             <span className="text-[9px] font-bold text-slate-400 italic">Review on completion</span>
                           )}
                         </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-secondary">
                    <div className="flex flex-col items-end gap-2">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[8px] lg:text-[9px] font-black uppercase tracking-widest",
                        booking.status === 'Completed' ? "bg-green-50 text-green-700" : 
                        booking.status === 'Cancelled' ? "bg-rose-50 text-rose-700" :
                        "bg-sky-50 text-brand"
                      )}>
                        {booking.status}
                      </span>
                      {booking.status !== 'Completed' && booking.status !== 'Cancelled' && (
                        <button 
                          onClick={() => booking._id && handleCancel(booking._id)}
                          className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 lg:gap-4">
                      <div className="text-xl lg:text-2xl font-black text-slate-ink">₹{booking.price}</div>
                      <button onClick={() => navigate(`/track/${booking._id}`)} className="w-10 h-10 lg:w-12 lg:h-12 bg-slate-ink text-white rounded-xl lg:rounded-2xl flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-slate-900/10">
                        <Navigation size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {bookings.length === 0 && (
              <div className="text-center py-16 lg:py-20 bg-white rounded-[24px] lg:rounded-[32px] border border-dashed border-slate-border mx-2">
                <Calendar className="w-12 h-12 lg:w-14 lg:h-14 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Awaiting first booking</p>
                <Link to="/" className="text-brand text-[10px] font-black uppercase tracking-widest mt-4 inline-block border-b-2 border-brand pb-1">Browse Services</Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 lg:space-y-8 order-1 lg:order-2 px-2 lg:px-0">
           <h2 className="text-lg lg:text-xl font-black text-slate-ink">Activity Log</h2>
           <div className="p-6 lg:p-8 bg-white rounded-[24px] lg:rounded-[32px] border border-slate-border space-y-6 lg:space-y-8">
              {[
                { time: '12:30', msg: 'Worker assigned to request' },
                { time: '11:15', msg: 'Payment confirmed' },
                { time: '10:45', msg: 'Booking created successfully' },
              ].map((log, i) => (
                <div key={i} className="flex gap-4 relative">
                   {i !== 2 && <div className="absolute left-[7px] top-6 bottom-[-24px] w-[1px] bg-slate-border"></div>}
                   <div className="w-4 h-4 rounded-full border-4 border-white bg-brand shadow-sm mt-1 z-10"></div>
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{log.time}</p>
                      <p className="text-xs lg:text-sm font-bold text-slate-600 mt-0.5">{log.msg}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  const login = (u: AuthUser, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('token', t);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ 
      user, token, login, logout, 
      isAuthModalOpen, 
      openAuthModal: () => setIsAuthModalOpen(true), 
      closeAuthModal: () => setIsAuthModalOpen(false),
      isSidebarOpen,
      toggleSidebar: () => setIsSidebarOpen(!isSidebarOpen)
    }}>
      <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
        <BrowserRouter>
          <Layout>
            <AuthModal />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/service/:id" element={<ServiceDetail />} />
              <Route path="/track/:bookingId" element={<TrackingView />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/careers" element={<CareerPortal />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </SearchContext.Provider>
    </AuthContext.Provider>
  );
}


