
import React, { useState, useEffect, useRef } from 'react';
import { ViewId, Product, CartItem, ChatMessage } from './types';
import { askKijanaStylist } from './services/geminiService';
import { Button } from './components/Button';
import { PRODUCTS, LOOKBOOK_IMAGES } from './constants';
import { GoogleGenAI } from "@google/genai";
import logo from './assets/ka-logo.png';

// --- Custom Hook for Scroll Parallax ---
const useParallax = (speed: number = 0.1) => {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const handleScroll = () => setOffset(window.scrollY * speed);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);
  return offset;22
};

// --- Magnified Image Component for Zoom Effect ---
const ZoomableImage: React.FC<{ src: string; alt: string; className?: string; borderClassName?: string }> = ({ src, alt, className = "", borderClassName = "" }) => {
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div 
      className={`relative overflow-hidden cursor-zoom-in group ${borderClassName}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-transform duration-500 ease-out ${className}`}
        style={{
          transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
          transform: isHovering ? 'scale(2)' : 'scale(1)'
        }}
      />
      {!isHovering && (
        <div className="absolute inset-0 bg-black/5 pointer-events-none group-hover:opacity-0 transition-opacity"></div>
      )}
    </div>
  );
};

// --- Decorative Components ---

const AnimatedBackground: React.FC = () => (
  <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
    <div className="absolute top-[-5%] left-[-5%] w-[60%] h-[60%] bg-[#FFD8BE]/70 rounded-full mix-blend-multiply filter blur-[80px] animate-blob"></div>
    <div className="absolute top-[20%] right-[-10%] w-[55%] h-[55%] bg-[#E2D1F9]/60 rounded-full mix-blend-multiply filter blur-[90px] animate-blob animation-delay-2000"></div>
    <div className="absolute bottom-[0%] left-[10%] w-[65%] h-[65%] bg-[#D1F2EB]/70 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000"></div>
    <div className="absolute inset-0 opacity-[0.1] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
  </div>
);

const LazyLookbookImage: React.FC<{ src: string, index: number }> = ({ src, index }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);
  
  const pastelColors = ['bg-[#FFD8BE]/30', 'bg-[#E2D1F9]/30', 'bg-[#D1F2EB]/30'];
  const placeholderColor = pastelColors[index % pastelColors.length];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      if (rect.top < viewportHeight && rect.bottom > 0) {
        setParallaxOffset((rect.top - viewportHeight / 2) * 0.08);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div 
      ref={containerRef}
      className={`relative group overflow-hidden rounded-[1.5rem] md:rounded-[4rem] ${placeholderColor} break-inside-avoid mb-6 md:mb-12 shadow-xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0 scale-100 rotate-0' : 'opacity-0 translate-y-32 scale-90 rotate-2'}`} 
      style={{ transitionDelay: `${(index % 4) * 150}ms` }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative overflow-hidden aspect-[3/4] md:aspect-auto cursor-zoom-in">
        <img
          src={src}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-auto transition-all duration-[400ms] ease-out border-2 md:border-4 border-white ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          alt={`Archive Entry ${index + 1}`}
          style={{ 
            transformOrigin: isHovering ? `${zoomPos.x}% ${zoomPos.y}%` : 'center center',
            transform: isHovering 
              ? `scale(1.8)` 
              : `translateY(${parallaxOffset}px) scale(1.2)`,
            transition: isHovering ? 'transform 0.1s ease-out, opacity 0.8s ease-out' : 'transform 0.4s ease-out, opacity 0.8s ease-out'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none flex items-end p-8 md:p-12">
        </div>
      </div>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center min-h-[300px]">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-[#FFD8BE] rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

const WhatsAppButton: React.FC = () => (
  <a 
    href="https://wa.me/254746129446" 
    target="_blank" 
    rel="noopener noreferrer"
    className="fixed bottom-8 left-8 z-[60] w-14 h-14 md:w-16 md:h-16 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-4xl hover:scale-110 active:scale-95 transition-all animate-glow"
  >
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
  </a>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewId>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [scrolled, setScrolled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'delivery' | 'card'>('mpesa');

  /**
   * 🎥 BRAND VIDEO URL:
   * Update this string to your manual video URL.
   */
  const [manualVideoUrl, setManualVideoUrl] = useState<string>("https://assets.mixkit.co/videos/preview/mixkit-fashion-model-walking-in-a-park-28631-large.mp4");

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigateTo = (view: ViewId, product?: Product) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
    if (product) setSelectedProduct(product);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (product: Product, size: string = 'M') => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedSize === size);
      if (existing) {
        return prev.map(item => item === existing ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, selectedSize: size }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: number, size: string) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.selectedSize === size)));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const finalizeWhatsAppOrder = () => {
    const methodLabels = { mpesa: 'M-PESA (Instant)', delivery: 'Payment on Delivery', card: 'Credit/Debit Card' };
    const message = `*✨ NEW ARTIFACT ORDER - KIJANA AMAZING ✨*\n\n` + 
      `Order Summary:\n` +
      cart.map(item => `📦 *${item.name}* [Size: ${item.selectedSize}] x ${item.quantity}`).join('\n') + 
      `\n\n💰 *Total Value: KES ${cartTotal.toLocaleString()}*\n` +
      `💳 *Method:* ${methodLabels[paymentMethod]}\n\n` +
      `Please initiate fulfillment for this visionary request!`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/254746129446?text=${encoded}`, '_blank');
  };

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'shop', label: 'Shop' },
    { id: 'lookbook', label: 'Lookbook' },
    { id: 'custom', label: 'Lab' },
    { id: 'about', label: 'Story' },
  ];

  return (
    <div className="min-h-screen relative text-slate-900 font-sans selection:bg-[#FFD8BE]/30 overflow-x-hidden">
      <AnimatedBackground />

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-2xl py-3 shadow-xl' : 'bg-transparent py-5'}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigateTo('home')}>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden shadow-lg group-hover:shadow-slate-900/40 transition-shadow flex items-center justify-center bg-white">
                  <img 
                    src={logo}  // 'logo' is imported at the top
                    alt="KA Logo" 
                    className="w-full h-full object-cover"
                  />
                  </div>

            <span className="hidden sm:block font-black uppercase italic tracking-tighter text-xl group-hover:text-[#FFD8BE] transition-colors">Kijana Amazing</span>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button 
                key={link.id}
                onClick={() => navigateTo(link.id as ViewId)}
                className={`relative px-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all overflow-hidden group/nav ${currentView === link.id ? 'text-[#FFD8BE]' : 'text-slate-400 hover:text-slate-900'}`}
              >
                {link.label}
                <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-[#FFD8BE] transform transition-transform duration-300 ${currentView === link.id ? 'translate-x-0' : '-translate-x-full group-hover/nav:translate-x-0'}`}></span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setIsCartOpen(true)} className="relative p-3 bg-white/60 backdrop-blur-sm rounded-full hover:bg-[#FFD8BE]/20 group transition-all transform hover:scale-110 active:scale-90 shadow-sm">
              <svg className="w-5 h-5 text-slate-600 group-hover:text-[#FFD8BE] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              {cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FFD8BE] text-[10px] text-white rounded-full flex items-center justify-center font-black animate-bounce shadow-lg shadow-[#FFD8BE]/40">{cart.length}</span>}
            </button>
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-3 bg-white/60 backdrop-blur-sm rounded-full hover:bg-[#FFD8BE]/20 transition-all shadow-sm">
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <div className={`fixed inset-0 z-[110] transition-opacity duration-500 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl" onClick={() => setIsMobileMenuOpen(false)}></div>
        <div className={`absolute top-0 right-0 h-full w-full max-w-sm bg-white shadow-4xl transition-transform duration-700 cubic-bezier(0.23,1,0.32,1) transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
          <div className="p-8 flex justify-between items-center border-b border-slate-50">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-black italic text-sm">KA</div>
               <span className="font-black uppercase tracking-tighter italic">Menu</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </div>
          <div className="flex-1 p-10 flex flex-col justify-center space-y-8">
            {navLinks.map((link) => (
              <button 
                key={link.id}
                onClick={() => navigateTo(link.id as ViewId)}
                className="text-4xl font-black uppercase italic tracking-tighter text-left hover:text-[#FFD8BE] transition-colors group flex items-center gap-4"
              >
                <span className="text-[10px] font-black text-slate-300 group-hover:text-[#FFD8BE]">0{navLinks.indexOf(link) + 1}</span>
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Slider */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-500 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsCartOpen(false)}></div>
        <div className={`absolute top-0 right-0 h-full w-full max-sm:w-[90%] max-w-md bg-white shadow-4xl transition-transform duration-700 cubic-bezier(0.23,1,0.32,1) transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">The Vault</h3>
            <button onClick={() => setIsCartOpen(false)} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 text-center">
                <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                <p className="font-black uppercase text-[10px] tracking-widest italic">The Vault is empty.</p>
              </div>
            ) : (
              <>
                <div className="space-y-8 pb-6 border-b border-slate-100">
                  {cart.map((item, i) => (
                    <div key={`${item.id}-${item.selectedSize}`} className="flex gap-6 animate-in slide-in-from-right duration-300" style={{animationDelay: `${i*100}ms`}}>
                      <img src={item.image} className="w-24 h-32 rounded-3xl object-cover shadow-xl border border-slate-50" alt={item.name} />
                      <div className="flex-1">
                        <h4 className="font-black text-sm uppercase tracking-tight">{item.name}</h4>
                        <p className="text-[10px] font-black text-slate-400 mt-1 uppercase">SIZE: {item.selectedSize} | QTY: {item.quantity}</p>
                        <p className="text-[#FFD8BE] font-black text-sm mt-3">KES {item.price.toLocaleString()}</p>
                        <button onClick={() => removeFromCart(item.id, item.selectedSize)} className="mt-4 text-[9px] font-black uppercase tracking-widest text-red-300 hover:text-red-500 transition-colors">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Quick Settlement Method</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <button onClick={() => setPaymentMethod('mpesa')} className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${paymentMethod === 'mpesa' ? 'border-[#25D366] bg-[#25D366]/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${paymentMethod === 'mpesa' ? 'bg-[#25D366]' : 'border border-slate-200'}`}></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">M-PESA (Instant)</span>
                      </div>
                    </button>
                    <button onClick={() => setPaymentMethod('delivery')} className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${paymentMethod === 'delivery' ? 'border-[#FFD8BE] bg-[#FFD8BE]/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${paymentMethod === 'delivery' ? 'bg-[#FFD8BE]' : 'border border-slate-200'}`}></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Pay on Delivery</span>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          {cart.length > 0 && (
            <div className="p-10 border-t border-slate-100 bg-[#FAF9F6] space-y-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-black text-slate-400 uppercase text-[10px] tracking-[0.3em]">Vault Total</span>
                <span className="font-black text-3xl text-slate-900">KES {cartTotal.toLocaleString()}</span>
              </div>
              <button onClick={finalizeWhatsAppOrder} className="w-full py-6 bg-[#25D366] text-white rounded-xl flex items-center justify-center gap-3 font-black uppercase tracking-widest shadow-3xl hover:scale-105 active:scale-95 transition-all animate-bounce-slow">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                Complete via WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>

      <main className="pt-24 min-h-screen">
        {/* HOME VIEW */}
        {currentView === 'home' && (
          <div className="animate-in fade-in duration-1000">
            <section className="relative min-h-[90vh] flex items-center px-6">
              <div className="container mx-auto grid md:grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center py-12">
                <div className="relative z-10 text-center lg:text-left">
                  <h2 className="text-[clamp(2.5rem,8vw,8.5rem)] font-black text-slate-900 mb-8 leading-[0.85] tracking-tighter uppercase italic">
                    <div className="overflow-hidden"><span className="inline-block animate-reveal-up" style={{ animationDelay: '0.1s' }}>ROOTED</span></div>
                    <div className="overflow-hidden"><span className="inline-block animate-reveal-up" style={{ animationDelay: '0.2s' }}>IN GRIT.</span></div>
                    <div className="overflow-hidden">
                       <span className="inline-block animate-reveal-up text-transparent bg-clip-text bg-gradient-to-r from-[#FFD8BE] via-orange-300 to-[#E2D1F9]" style={{ animationDelay: '0.3s' }}>
                         VISIONARY.
                       </span>
                    </div>
                  </h2>
                  <p className="text-lg md:text-2xl text-slate-500 mb-14 leading-relaxed font-medium max-w-xl mx-auto lg:mx-0 animate-fade-up" style={{ animationDelay: '0.5s' }}>
                    Elite athletic gear for the modern visionary. High-end streetwear crafted with pastel precision and athletic endurance.
                  </p>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-4 md:gap-8 animate-fade-up" style={{ animationDelay: '0.7s' }}>
                    <Button onClick={() => navigateTo('shop')} className="px-10 md:px-16 py-6 md:py-8 shadow-4xl hover:scale-105 active:scale-95 transition-transform duration-300">Shop Drop</Button>
                    <button onClick={() => navigateTo('about')} className="flex items-center gap-4 md:gap-6 group">
                      <span className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-slate-900/10 flex items-center justify-center group-hover:bg-[#FFD8BE] group-hover:text-white transition-all transform group-hover:rotate-12 font-black text-lg md:text-xl">→</span>
                      <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 group-hover:text-slate-900 group-hover:translate-x-2 transition-all">The Legacy</span>
                    </button>
                  </div>
                </div>
                
                <div className="relative group animate-fade-left lg:block" style={{ animationDelay: '0.4s' }}>
                  <div className="aspect-[4/5] rounded-[4rem] md:rounded-[6rem] overflow-hidden shadow-4xl relative z-10 transform rotate-2 group-hover:rotate-0 transition-transform duration-[1500ms] border-[12px] md:border-[20px] border-white bg-white">
                    <img src="./assets/bggg.jpg" alt="Core Vibe" className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-[2000ms]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </div>
              </div>
            </section>

            <div className="py-12 bg-slate-900 overflow-hidden relative z-10">
              <div className="flex whitespace-nowrap animate-marquee">
                {[...Array(10)].map((_, i) => (
                  <span key={i} className="text-white text-4xl md:text-6xl font-black uppercase italic tracking-tighter mx-10 opacity-40">
                    AESTHETIC ENDURANCE • ROOTED IN GRIT • KIJANA AMAZING • BESPOKE ARTIFACTS • 254 LEGACY • 
                  </span>
                ))}
              </div>
            </div>

            {/* Featured Section */}
            <section className="py-32 md:py-48 px-6 container mx-auto relative z-10">
               <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-24">
                  <div className="max-w-2xl">
                    <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#FFD8BE] mb-6 block">CURATED DROP</span>
                    <h3 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.85]">FEATURED <br/>ARTIFACTS.</h3>
                  </div>
                  <Button onClick={() => navigateTo('shop')} variant="outline">View All Pieces</Button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {PRODUCTS.slice(0, 3).map((p, i) => (
                    <div key={p.id} onClick={() => navigateTo('product', p)} className="group cursor-pointer hover-lift" style={{animationDelay: `${i*200}ms`}}>
                       <div className="aspect-[4/5] rounded-[3rem] overflow-hidden mb-8 border-4 border-white shadow-2xl relative">
                          <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1000ms]" alt={p.name} />
                          <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       </div>
                       <h4 className="text-2xl font-black uppercase italic tracking-tighter">{p.name}</h4>
                       <span className="text-slate-400 font-bold italic">KES {p.price.toLocaleString()}</span>
                    </div>
                  ))}
               </div>
            </section>

            {/* Campaign Cinema Section */}
            <section className="py-32 md:py-48 bg-white/40 backdrop-blur-xl border-y border-white">
              <div className="container mx-auto px-6 text-center">
                <div className="max-w-4xl mx-auto space-y-12">
                   <span className="text-[10px] font-black uppercase tracking-[0.8em] text-slate-400">CAMPAIGN CINEMA</span>
                   <h3 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter">THE BRAND FILM.</h3>
                   <p className="text-lg md:text-2xl text-slate-500 font-medium italic">Witness the elite motion of Kijana Amazing. Our latest drop captured in visionary quality.</p>
                   
                   <div className="relative aspect-video max-w-5xl mx-auto rounded-[3rem] overflow-hidden border-8 border-white shadow-4xl bg-slate-900 group">
                      <video 
                        key={manualVideoUrl}
                        src="./assets/vd2.mp4" 
                        className="w-full h-full object-cover" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        controls
                      />
                      <div className="absolute inset-0 bg-slate-900/10 pointer-events-none group-hover:bg-transparent transition-all duration-700"></div>
                   </div>
                   
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cinematic Artifact Selection 01</p>
                </div>
              </div>
            </section>

            <section className="py-32 md:py-64 bg-slate-900 text-white rounded-[4rem] md:rounded-[10rem] mx-4 md:mx-10 relative overflow-hidden group mt-12">
               <div className="absolute inset-0 opacity-20 pointer-events-none">
                 <img src="./assets/am1.png" className="w-full h-full object-cover grayscale group-hover:scale-110 transition-transform duration-[5000ms]" alt="Vision" />
               </div>
               <div className="container mx-auto px-6 relative z-10 text-center">
                  <h3 className="text-[clamp(3rem,10vw,12rem)] font-black uppercase italic tracking-tighter leading-none mb-16 animate-float">BEYOND THE <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD8BE] to-orange-400">CORE.</span></h3>
                  <p className="max-w-3xl mx-auto text-xl md:text-4xl font-black italic tracking-tight text-white/60 leading-tight">
                    "WE DON'T JUST MANUFACTURE CLOTHING. WE FORGE THE UNIFORM OF AMBITION. FOR THE YOUNG KIJANA, FOR THE VISIONARY, FOR THE ENDURING."
                  </p>
               </div>
            </section>
          </div>
        )}

        {/* SHOP VIEW */}
        {currentView === 'shop' && (
          <section className="py-24 container mx-auto px-6 animate-in fade-in duration-700">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 mb-16 md:mb-24">
              <div>
                <h3 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">The Collection</h3>
                <div className="flex gap-2 md:gap-4 mt-8 flex-wrap">
                  {['All', 'Gym', 'Retro', 'Street'].map((f) => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-6 md:px-10 py-2.5 md:py-3 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-slate-900 text-white shadow-xl' : 'bg-white/60 border border-white text-slate-400 hover:border-[#FFD8BE]'}`}>{f}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12">
              {PRODUCTS.filter(p => filter === 'All' || p.category === filter).map((p, i) => (
                <div key={p.id} onClick={() => navigateTo('product', p)} className="group cursor-pointer animate-in fade-in slide-in-from-bottom-10 hover-lift" style={{animationDelay: `${i*100}ms`}}>
                  <div className="aspect-[3/4] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden mb-6 md:mb-8 bg-white relative shadow-xl border border-white">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-[1500ms]" />
                    <div className="absolute bottom-6 left-6 translate-y-12 group-hover:translate-y-0 transition-all opacity-0 group-hover:opacity-100">
                      <Button onClick={(e) => { e.stopPropagation(); addToCart(p); }} className="px-6 py-3 bg-white text-slate-900">Add to Vault</Button>
                    </div>
                  </div>
                  <div className="px-4">
                    <h4 className="font-black text-lg md:text-xl uppercase tracking-tighter mb-1 group-hover:text-[#FFD8BE] transition-colors">{p.name}</h4>
                    <span className="text-lg md:text-xl font-black text-slate-900 italic">KES {p.price.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PRODUCT DETAIL VIEW */}
        {currentView === 'product' && selectedProduct && (
          <section className="py-24 container mx-auto px-6 animate-in fade-in duration-1000">
             <div className="grid lg:grid-cols-2 gap-16 md:gap-24 mb-32">
                <div className="relative group">
                   <div className="sticky top-32">
                      <ZoomableImage 
                        src={selectedProduct.image} 
                        alt={selectedProduct.name} 
                        borderClassName="aspect-[4/5] rounded-[3rem] md:rounded-[5rem] border-8 md:border-[20px] border-white shadow-4xl" 
                      />
                      <div className="mt-6 flex justify-center">
                         <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 animate-pulse">Hover to Inspect Texture</span>
                      </div>
                   </div>
                </div>
                <div className="flex flex-col justify-center space-y-12">
                   <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#FFD8BE] block mb-4">ARTIFACT ID: #{selectedProduct.id}</span>
                      <h2 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">{selectedProduct.name}</h2>
                      <p className="text-2xl md:text-4xl font-black text-slate-900 mt-6 italic">KES {selectedProduct.price.toLocaleString()}</p>
                   </div>
                   <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed uppercase tracking-wide">
                      {selectedProduct.description || "Crafted for elite visionary performance. Rooted in grit, forged for endurance."}
                   </p>
                   <div className="grid grid-cols-3 gap-4">
                      {['S', 'M', 'L', 'XL'].map(size => (
                        <button key={size} className="py-4 border-2 border-slate-100 rounded-2xl font-black hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest">{size}</button>
                      ))}
                   </div>
                   <Button onClick={() => addToCart(selectedProduct)} className="w-full py-8 text-lg">Add to Vault</Button>
                </div>
             </div>
          </section>
        )}

        {/* LOOKBOOK VIEW */}
        {currentView === 'lookbook' && (
           <section className="py-24 container mx-auto px-6">
              <div className="flex flex-col md:flex-row items-baseline gap-4 mb-16 md:mb-24 animate-fade-up">
                <h3 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter">THE ARCHIVE.</h3>
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">AWESOME ENTRIES FOUND</span>
              </div>
              <div className="columns-2 md:columns-3 xl:columns-4 gap-6 md:gap-12">
                 {LOOKBOOK_IMAGES.map((img, i) => (
                    <LazyLookbookImage key={i} src={img} index={i} />
                 ))}
              </div>
           </section>
        )}

        {/* LAB VIEW */}
        {currentView === 'custom' && (
          <section className="py-24 container mx-auto px-6 animate-in fade-in duration-1000">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-24 md:mb-40">
                <div className="inline-block px-8 py-3 bg-[#E2D1F9] text-slate-900 rounded-full text-[10px] font-black tracking-[0.4em] uppercase mb-12 animate-float">THE BESPOKE DESIGN LAB</div>
                <h3 className="text-6xl md:text-[10rem] font-black uppercase tracking-tighter italic leading-none mb-10">FORGE YOUR <br/>LEGACY.</h3>
                <p className="text-xl md:text-3xl text-slate-500 font-medium italic max-w-3xl mx-auto leading-relaxed">Exclusive access to Kijana's creative studio. Craft a one-of-one artifact.</p>
              </div>
              <div className="grid lg:grid-cols-3 gap-8 md:gap-12 mb-32">
                {[
                  { t: "EMBROIDERY", d: "Your story stitched with technical precision.", img: "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=800" },
                  { t: "COLORWAYS", d: "Elite palettes beyond standard drops.", img: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800" },
                  { t: "MANTRAS", d: "Personalize internal inscriptions.", img: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800" }
                ].map((module) => (
                  <div key={module.t} className="p-10 md:p-16 rounded-[4rem] bg-white/60 backdrop-blur-xl border border-white hover:shadow-4xl transition-all duration-700 group hover:-translate-y-4">
                    <div className="aspect-[4/3] rounded-[3rem] overflow-hidden mb-12 shadow-2xl bg-slate-100 border-4 border-white">
                      <img src={module.img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" alt={module.t} />
                    </div>
                    <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-4">{module.t}</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{module.d}</p>
                  </div>
                ))}
              </div>
              <a href="https://wa.me/254746129446" target="_blank" rel="noopener noreferrer" className="block w-full group">
                <Button className="w-full py-10 bg-[#25D366] text-white hover:bg-[#128C7E] shadow-3xl text-lg group-hover:scale-[1.02]">Connect via WhatsApp Lab</Button>
              </a>
            </div>
          </section>
        )}

        {/* STORY VIEW */}
        {currentView === 'about' && (
          <section className="animate-in fade-in duration-1000 pb-32">
            <div className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-slate-900 rounded-b-[4rem] md:rounded-b-[8rem]">
              <img src="https://images.unsplash.com/photo-1544919982-b61976f0ba43?q=80&w=1600" className="absolute inset-0 w-full h-full object-cover opacity-40 scale-100 animate-slow-zoom" alt="Basketball Grit" />
              <div className="relative z-10 text-center text-white px-6">
                <p className="text-[10px] font-black uppercase tracking-[1em] mb-12 opacity-60 animate-fade-up">The Manifesto</p>
                <h2 className="text-[clamp(3rem,10vw,12rem)] font-black italic uppercase tracking-tighter leading-[0.85] mb-8 animate-reveal-up">COURT TO <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD8BE] to-white">LEGACY.</span></h2>
              </div>
            </div>

            <div className="container mx-auto px-6 py-24 md:py-48 max-w-6xl space-y-48 relative z-10">
              <div className="grid md:grid-cols-2 gap-16 md:gap-32 items-center">
                 <div className="space-y-12 animate-fade-up">
                    <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#FFD8BE]">01 / THE SOURCE</span>
                    <h3 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">NAKURU <br/>ORIGINS.</h3>
                    <p className="text-xl md:text-2xl text-slate-600 font-medium italic leading-relaxed">
                       "Every young visionary in Nakuru knows the weight of the morning cold. The courts aren't just concrete; they are the forge of our grit."
                    </p>
                 </div>
                 <div className="relative group">
                    <div className="aspect-[4/5] rounded-[3rem] md:rounded-[5rem] overflow-hidden border-8 md:border-[20px] border-white shadow-4xl transform -rotate-3 hover:rotate-0 transition-all duration-1000">
                       <img src="https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=1200" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3000ms]" alt="Origins" />
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-48 h-48 md:w-64 md:h-64 rounded-full border-8 border-white overflow-hidden shadow-3xl transform rotate-12 hidden md:block">
                       <img src="https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=600" className="w-full h-full object-cover" alt="Detail" />
                    </div>
                 </div>
              </div>

              <div className="text-center space-y-12 max-w-4xl mx-auto py-24 md:py-32 px-10 md:px-16 bg-white/40 backdrop-blur-3xl rounded-[4rem] md:rounded-[8rem] border border-white shadow-4xl animate-float relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#FFD8BE] via-orange-400 to-[#E2D1F9]"></div>
                 <h4 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">THE SHARED <br/><span className="text-[#FFD8BE]">PULSE.</span></h4>
                 <p className="text-lg md:text-3xl text-slate-700 font-bold leading-relaxed italic px-4">
                    "Do you remember the sound of a basketball bouncing on dry asphalt at 5:00 AM? That's the rhythm of anyone who wants to be Amazing. Whether you're holding a ball or a dream, we are built the same."
                 </p>
                 <div className="pt-8">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">EST. 2024 / NAKURU DISTRICT</span>
                 </div>
              </div>

              <div className="grid md:grid-cols-2 gap-16 md:gap-32 items-center">
                 <div className="md:order-2 space-y-12 animate-fade-up">
                    <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#E2D1F9]">02 / THE DESIGN</span>
                    <h3 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">AESTHETIC <br/>ENDURANCE.</h3>
                    <p className="text-xl md:text-2xl text-slate-600 font-medium italic leading-relaxed">
                       "We blend tech-pastels with heavy-duty construction. Grace meets absolute power. Soft colors, hard grit."
                    </p>
                 </div>
                 <div className="md:order-1 relative group">
                    <div className="aspect-[4/5] rounded-[3rem] md:rounded-[5rem] overflow-hidden border-8 md:border-[20px] border-white shadow-4xl transform rotate-3 hover:rotate-0 transition-all duration-1000">
                       <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3000ms]" alt="Design" />
                    </div>
                 </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer className="pt-24 pb-16 relative z-10 bg-white/70 backdrop-blur-md border-t border-white/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 md:gap-20 mb-24">
            <div className="lg:col-span-2">
               <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white font-black italic mb-8 shadow-xl">KA</div>
               <h4 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic mb-6">Kijana Amazing</h4>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest italic">Rooted in Nakuru. Forged in Grit.</p>
               <div className="flex gap-4 mt-10">
                 <a href="https://wa.me/254746129446" target="_blank" rel="noopener noreferrer" className="p-4 bg-white rounded-full hover:bg-[#25D366] hover:text-white transition-all shadow-sm border border-slate-100">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                 </a>
                 <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-4 bg-white rounded-full hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white transition-all shadow-sm border border-slate-100">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 448 512"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>
                 </a>
                 <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="p-4 bg-white rounded-full hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-100">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 448 512">
                      <path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25V349.38A162.55 162.55 0 1 1 185 188.31V278.2a74.62 74.62 0 1 0 52.23 71.18V0l88 0a121.18 121.18 0 0 0 1.86 22.17h0A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14Z"/>
                    </svg>
                 </a>
               </div>
            </div>
            <div>
               <h5 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-slate-400 italic">Navigate</h5>
               <ul className="space-y-4">
                  <li className="text-xs font-black text-slate-900 uppercase tracking-widest hover:text-[#FFD8BE] cursor-pointer" onClick={() => navigateTo('shop')}>Shop Drops</li>
                  <li className="text-xs font-black text-slate-900 uppercase tracking-widest hover:text-[#FFD8BE] cursor-pointer" onClick={() => navigateTo('custom')}>Design Lab</li>
                  <li className="text-xs font-black text-slate-900 uppercase tracking-widest hover:text-[#FFD8BE] cursor-pointer" onClick={() => navigateTo('lookbook')}>Lookbook</li>
               </ul>
            </div>
            <div>
               <h5 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-slate-400 italic">Brand</h5>
               <ul className="space-y-4">
                  <li className="text-xs font-black text-slate-900 uppercase tracking-widest hover:text-[#FFD8BE] cursor-pointer" onClick={() => navigateTo('about')}>Our Story</li>
                  <li className="text-xs font-black text-slate-900 uppercase tracking-widest hover:text-[#FFD8BE] cursor-pointer">Stockists</li>
               </ul>
            </div>
          </div>
          <div className="pt-16 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">© 2025 Kijana Amazing. Created for Visionaries.</p>
            <div className="flex gap-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-900">Privacy Policy</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-900">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>

      <WhatsAppButton />
      <div className={`fixed bottom-8 right-8 z-[60] transition-all duration-300 ${chatOpen ? 'scale-0' : 'scale-100'}`}>
        <button onClick={() => setChatOpen(true)} className="w-16 h-16 md:w-20 md:h-20 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-4xl hover:scale-110 active:scale-90 animate-bounce-slow">
          <span className="text-xl md:text-2xl transition-transform">⛹️‍♂️</span>
        </button>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(60px, -80px) scale(1.2); }
          66% { transform: translate(-40px, 40px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-blob { animation: blob 25s infinite alternate ease-in-out; }
        .animate-marquee { animation: marquee 40s linear infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        @keyframes reveal-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fade-up { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 15px rgba(37, 211, 102, 0.4); } 50% { box-shadow: 0 0 45px rgba(37, 211, 102, 0.9); } }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(-12%); } 50% { transform: translateY(0); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-30px); } }
        @keyframes slow-zoom { from { transform: scale(1); } to { transform: scale(1.15); } }
        .animate-reveal-up { animation: reveal-up 1.4s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
        .animate-fade-up { animation: fade-up 1.2s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
        .animate-glow { animation: glow 2.5s infinite ease-in-out; }
        .animate-bounce-slow { animation: bounce-slow 3.5s infinite ease-in-out; }
        .animate-float { animation: float 5s infinite ease-in-out; }
        .animate-slow-zoom { animation: slow-zoom 35s alternate infinite ease-in-out; }
        .hover-lift { transition: transform 0.6s cubic-bezier(0.2, 1, 0.3, 1), box-shadow 0.6s cubic-bezier(0.2, 1, 0.3, 1); }
        .hover-lift:hover { transform: translateY(-20px) scale(1.04); box-shadow: 0 80px 140px -30px rgba(0,0,0,0.15); }
        .shadow-4xl { filter: drop-shadow(0 50px 100px rgba(0, 0, 0, 0.1)); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #FFD8BE; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
