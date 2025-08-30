import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const endpoint = isLogin ? '/api/login' : '/api/signup';
    const data = isLogin ? { username, password } : { username, password, email };

    try {
      const response = await axios.post(`http://localhost:5000${endpoint}`, data);

      if (isLogin) {
        const { token, username: returnedUsername, email: returnedEmail } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('username', returnedUsername);
        localStorage.setItem('email', returnedEmail);
        navigate('/dashboard', { replace: true });
      } else {
        setSuccess('Usuario registrado exitosamente. Ahora inicia sesión.');
        setIsLogin(true);
        setUsername('');
        setPassword('');
        setEmail('');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error en el servidor');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && location.pathname === '/') {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-6 relative overflow-hidden">
      {/* Partículas animadas de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              width: Math.random() * 30 + 10,
              height: Math.random() * 30 + 10,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.3 + 0.1,
              background: `rgba(${Math.random() > 0.5 ? '99, 179, 237' : '72, 187, 120'}, ${Math.random() * 0.3 + 0.1})`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${Math.random() * 10 + 15}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Efectos de luz animados */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl animate-pulse-slow opacity-20"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full filter blur-3xl animate-pulse-slow opacity-20 animation-delay-2000"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center">
        {/* Logo con animación */}
        <div className="text-center mb-8 md:mb-12 transform hover:scale-105 transition-transform duration-500">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 animate-fade-in-down">
            <span className="text-blue-400 drop-shadow-md">QHATU</span>
            <span className="text-emerald-400 drop-shadow-md"> MARCA</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl animate-fade-in-up animation-delay-300">
            Sistema de Seguridad y Gestión
          </p>
        </div>

        {/* Tarjeta de login con animación de aparición */}
        <div className="w-full max-w-4xl bg-gray-800/70 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-gray-700/30 flex flex-col md:flex-row animate-scale-in">
          {/* Sección de imagen con efecto parallax */}
          <div className="hidden md:block md:w-2/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-purple-600/20 z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/70 to-transparent z-10"></div>
            <img 
              src="/img/minimarket.jpg" 
              alt="Tienda QHATU MARCA" 
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute bottom-6 left-6 right-6 z-20 transform transition-transform duration-500 group-hover:translateY-[-5px]">
              <div className="bg-black/40 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <h3 className="text-white font-semibold text-lg mb-1">Sistema Integral</h3>
                <p className="text-gray-300 text-sm">Gestione su negocio de forma eficiente y segura</p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="w-full md:w-3/5 p-6 md:p-8 lg:p-10">
            <h2 className="text-2xl font-bold text-white mb-6 text-center animate-fade-in">
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>

            {/* Mensajes de estado con animación */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm animate-shake">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}
            
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-4 py-3 rounded-lg mb-6 text-sm animate-fade-in">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {success}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="animate-fade-in animation-delay-100">
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg 
                      text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 
                      focus:border-blue-500 transition-all duration-200 disabled:opacity-50"
                    placeholder="Ingrese su usuario"
                  />
                </div>
              </div>
              
              {!isLogin && (
                <div className="animate-fade-in animation-delay-200">
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg 
                        text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 
                        focus:border-blue-500 transition-all duration-200 disabled:opacity-50"
                      placeholder="Ingrese su email"
                    />
                  </div>
                </div>
              )}
              
              <div className="animate-fade-in animation-delay-300">
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg 
                      text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 
                      focus:border-blue-500 transition-all duration-200 disabled:opacity-50"
                    placeholder="Ingrese su contraseña"
                  />
                </div>
              </div>
              
              <div 
                className="animate-fade-in animation-delay-400"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 
                    transform hover:scale-[1.02] active:scale-[0.98] shadow-lg relative overflow-hidden
                    ${isLoading 
                      ? 'bg-gray-700 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 hover:shadow-blue-500/30'
                    }`}
                >
                  {/* Efecto de brillo al pasar el mouse */}
                  <div className={`absolute inset-0 bg-white/20 transform -skew-x-12 transition-all duration-500 ${isHovered && !isLoading ? 'translate-x-[100%]' : '-translate-x-[150%]'}`}></div>
                  
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </div>
                  ) : isLogin ? (
                    'Iniciar Sesión'
                  ) : (
                    'Crear Cuenta'
                  )}
                </button>
              </div>
            </form>
            
            <div className="mt-6 pt-6 border-t border-gray-700/50 text-center animate-fade-in animation-delay-500">
              <p className="text-gray-400 text-sm">
                {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setSuccess('');
                  }}
                  disabled={isLoading}
                  className="ml-2 text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 disabled:opacity-50 relative group"
                >
                  {isLogin ? 'Registrarse' : 'Iniciar Sesión'}
                  {/* Subrayado animado */}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
                </button>
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer con animación */}
        <div className="mt-8 text-center text-gray-500 text-sm animate-fade-in-up animation-delay-700">
          <p>© 2023 QHATU MARCA - Todos los derechos reservados</p>
        </div>
      </div>

      {/* Estilos de animación personalizados */}
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
            100% { transform: translateY(0) rotate(0deg); }
          }
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.3; }
          }
          @keyframes fadeInDown {
            from { opacity: 0; transform: translate3d(0, -20px, 0); }
            to { opacity: 1; transform: translate3d(0, 0, 0); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translate3d(0, 20px, 0); }
            to { opacity: 1; transform: translate3d(0, 0, 0); }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-float { animation: float 15s ease-in-out infinite; }
          .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }
          .animate-fade-in-down { animation: fadeInDown 0.8s ease-out; }
          .animate-fade-in-up { animation: fadeInUp 0.8s ease-out; }
          .animate-scale-in { animation: scaleIn 0.5s ease-out; }
          .animate-shake { animation: shake 0.5s ease-in-out; }
          .animate-fade-in { animation: fadeIn 0.5s ease-out; }
          .animation-delay-300 { animation-delay: 0.3s; }
          .animation-delay-500 { animation-delay: 0.5s; }
          .animation-delay-700 { animation-delay: 0.7s; }
          .animation-delay-100 { animation-delay: 0.1s; }
          .animation-delay-200 { animation-delay: 0.2s; }
          .animation-delay-2000 { animation-delay: 2s; }
        `}
      </style>
    </div>
  );
};

export default Login;