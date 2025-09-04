import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FiHome, FiClock, FiSettings, FiShield, FiBell, FiX, FiCheck,
  FiMenu, FiLogOut, FiVideo, FiUser, FiAlertTriangle, FiEdit,
  FiMail, FiPhone, FiRefreshCw, FiBarChart, FiLock, FiActivity,
  FiEye, FiEyeOff, FiMapPin, FiCalendar
} from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface AlarmNotification {
  message: string;
  timestamp: Date;
}

interface AlarmHistoryItem {
  id: number;
  type: 'activated' | 'deactivated' | 'intrusion';
  timestamp: Date;
  message: string;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  joinedDate: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [password, setPassword] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alarmHistory, setAlarmHistory] = useState<AlarmHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showIntrusionModal, setShowIntrusionModal] = useState(false);
  const [showCameraView, setShowCameraView] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [verificationStep, setVerificationStep] = useState('question');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Juan Pérez',
    email: 'juan.perez@example.com',
    phone: '+51 987 654 321',
    address: 'Av. Principal 123, Lima, Perú',
    joinedDate: '15 de Enero, 2023'
  });
  const [editProfile, setEditProfile] = useState<UserProfile>({ ...userProfile });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeStat, setActiveStat] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Stats animation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStat(prev => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Responsive handling
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedEmail = localStorage.getItem('email');
    const storedPhone = localStorage.getItem('phone') || '+51 987 654 321';
    const storedAddress = localStorage.getItem('address') || 'Av. Principal 123, Lima, Perú';

    const profile: UserProfile = {
      name: storedUsername || 'Juan Pérez',
      email: storedEmail || 'juan.perez@example.com',
      phone: storedPhone,
      address: storedAddress,
      joinedDate: '15 de Enero, 2023'
    };

    setUserProfile(profile);
    setEditProfile({ ...profile });

    toast.info('Cargando perfil de usuario...', { autoClose: 3000 });

    const mockHistory: AlarmHistoryItem[] = [
      {
        id: 1,
        type: 'activated',
        timestamp: new Date(Date.now() - 86400000),
        message: 'Sistema activado por el usuario'
      },
      {
        id: 2,
        type: 'intrusion',
        timestamp: new Date(Date.now() - 43200000),
        message: 'Movimiento detectado en la entrada principal'
      },
      {
        id: 3,
        type: 'deactivated',
        timestamp: new Date(Date.now() - 21600000),
        message: 'Sistema desactivado con contraseña correcta'
      },
      {
        id: 4,
        type: 'activated',
        timestamp: new Date(Date.now() - 172800000),
        message: 'Sistema activado automáticamente'
      },
      {
        id: 5,
        type: 'intrusion',
        timestamp: new Date(Date.now() - 129600000),
        message: 'Sensor de ventana activado'
      }
    ];
    setAlarmHistory(mockHistory);
    toast.success('Historial de alarmas cargado.', { autoClose: 3000 });
  }, []);

  // Handle audio playback based on alarm state
  useEffect(() => {
    if (isAlarmActive && audioRef.current) {
      audioRef.current.loop = true; // Loop the sound
      audioRef.current.play().catch(err => console.error('Error playing audio:', err));
    } else if (!isAlarmActive && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reset to start
    }
  }, [isAlarmActive]);

  const connectSocket = () => {
    if (socket) {
      socket.disconnect();
    }
    const newSocket = io('http://localhost:5000', { withCredentials: true, transports: ['websocket'] });
    setSocket(newSocket);
    setConnectionStatus('connecting');
    toast.info('Conectando al servidor...', { autoClose: 3000 });

    newSocket.on('connect', () => {
      console.log('Conectado a Socket.io');
      setConnectionStatus('connected');
      setIsLoading(false);
      toast.success('Conectado exitosamente al servidor.', { autoClose: 3000 });
    });

    // En el useEffect para Socket.io
newSocket.on('alarmNotification', (data: AlarmNotification) => {
  console.log('Recibido alarmNotification:', data);
  try {
    const parsedMessage = JSON.parse(data.message);
    if (parsedMessage.error) {
      toast.error(`Error: ${parsedMessage.error}`, { autoClose: 3000 });
      setIsLoading(false);
    } else {
      const isActive = parsedMessage.alarmActive;
      const source = parsedMessage.source || 'sensor';
      setIsAlarmActive(isActive);

      const newHistoryItem: AlarmHistoryItem = {
        id: alarmHistory.length + 1,
        type: isActive ? (source === 'manual' ? 'activated' : 'intrusion') : 'deactivated',
        timestamp: new Date(),
        message: isActive
          ? source === 'manual'
            ? 'Sistema activado por el usuario'
            : '¡Intrusión detectada! La alarma se ha activada.'
          : 'Alarma desactivada correctamente.'
      };

      setAlarmHistory(prev => [newHistoryItem, ...prev]);
      toast.success('Historial de alarmas actualizado.', { autoClose: 3000 });

      if (isActive && source !== 'manual') {
        setShowIntrusionModal(true);
        setVerificationStep('question');
      } else {
        setShowIntrusionModal(false);
        setPassword('');
        setVerificationStep('question');
      }

      toast[isActive ? 'warn' : 'success'](
        isActive
          ? source === 'manual'
            ? 'Sistema activado manualmente.'
            : '¡Alarma activada! Intrusión detectada.'
          : 'Alarma desactivada correctamente.',
        { autoClose: 3000 }
      );
      setIsLoading(false);
    }
  } catch (err) {
    console.error('Error al procesar alarmNotification:', err);
    toast.error('Error al procesar notificación de alarma.', { autoClose: 3000 });
    setIsLoading(false);
  }
});

    newSocket.on('connect_error', (err) => {
      console.error('Error de conexión Socket.io:', err.message);
      setConnectionStatus('disconnected');
      setIsLoading(false);
      toast.error('Error de conexión al servidor.', { autoClose: 3000 });
    });

    return () => {
      newSocket.disconnect();
    };
  };

  useEffect(() => {
    connectSocket();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('phone');
    localStorage.removeItem('address');
    if (socket) socket.disconnect();
    toast.success('Sesión cerrada exitosamente.', { autoClose: 2000 });
    setTimeout(() => navigate('/'), 2000);
  };

  const disarmAlarm = () => {
    if (password) {
      setIsLoading(true);
      socket.emit('disarmAlarm', { password });
      toast.info('Enviando contraseña para desactivar...', { autoClose: 3000 });
      setShowIntrusionModal(false);
    } else {
      toast.error('Por favor, ingrese una contraseña válida.', { autoClose: 3000 });
    }
  };

const activateAlarm = () => {
  if (connectionStatus !== 'connected') {
    toast.error('No se puede activar: no conectado al servidor.', { autoClose: 3000 });
    return;
  }
  setIsLoading(true);
  socket.emit('activateAlarm');
  toast.info('Activando el sistema de alarma...', { autoClose: 3000 });

  const newHistoryItem: AlarmHistoryItem = {
    id: alarmHistory.length + 1,
    type: 'activated',
    timestamp: new Date(),
    message: 'Sistema activado por el usuario'
  };

  setAlarmHistory(prev => [newHistoryItem, ...prev]);
  toast.success('Sistema activado y historial actualizado.', { autoClose: 3000 });
};

  const handleIntrusionResponse = (wasUser: boolean) => {
    if (wasUser) {
      setVerificationStep('password');
    } else {
      setVerificationStep('camera');
      setShowCameraView(true);
      toast.info('Abriendo vista de cámara...', { autoClose: 2000 });
    }
  };

  const handleCameraReviewComplete = () => {
    setShowCameraView(false);
    setVerificationStep('password');
    toast.info('Vista de cámara cerrada. Procediendo a verificación.', { autoClose: 2000 });
  };

  const handleProfileUpdate = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Sesión expirada. Inicie sesión nuevamente.', { autoClose: 3000 });
      return;
    }

    const updatedFields: string[] = [];

    if (editProfile.name !== userProfile.name) {
      updatedFields.push('Nombre');
    }
    if (editProfile.email !== userProfile.email) {
      updatedFields.push('Correo Electrónico');
    }
    if (editProfile.phone !== userProfile.phone) {
      updatedFields.push('Teléfono');
    }
    if (editProfile.address !== userProfile.address) {
      updatedFields.push('Dirección');
    }

    console.log('Campos actualizados:', updatedFields);

    if (updatedFields.length === 0) {
      toast.warn('No hay cambios para actualizar.', { autoClose: 3000 });
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/update-profile', {
        username: editProfile.name,
        email: editProfile.email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { token: newToken, username, email } = response.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('username', username);
      localStorage.setItem('email', email);
      localStorage.setItem('phone', editProfile.phone);
      localStorage.setItem('address', editProfile.address);

      setUserProfile({ ...editProfile });
      updatedFields.forEach(field => {
        toast.success(`${field} actualizado exitosamente.`, { autoClose: 3000 });
      });
      setShowProfileModal(false);
    } catch (err) {
      toast.error('Error al actualizar el perfil.', { autoClose: 3000 });
      console.error(err);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Por favor, complete todos los campos de contraseña.', { autoClose: 3000 });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las nuevas contraseñas no coinciden.', { autoClose: 3000 });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Sesión expirada. Inicie sesión nuevamente.', { autoClose: 3000 });
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/change-password', {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Contraseña actualizada exitosamente.', { autoClose: 3000 });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error('Error al cambiar la contraseña. Verifique la contraseña actual.', { autoClose: 3000 });
      console.error(err);
    }
  };

  const renderProfileModal = () => {
    if (!showProfileModal) return null;

    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all duration-300 scale-100 hover:scale-[1.01] border border-gray-700">
          <div className="p-6 bg-gradient-to-r from-amber-500 to-red-600 text-gray-100 flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight flex items-center">
              <FiUser className="mr-2" /> Perfil de Usuario
            </h2>
            <button
              onClick={() => setShowProfileModal(false)}
              className="text-gray-100 hover:text-gray-300 transition-colors transform hover:rotate-90 duration-300"
            >
              <FiX size={24} />
            </button>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-red-500 flex items-center justify-center text-amber-100 text-4xl font-bold shadow-lg animate-pulse-slow">
                {userProfile.name.charAt(0)}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 bg-gray-700/50 rounded-lg transition-all duration-300 hover:bg-gray-700/70">
                <FiUser className="text-amber-500" size={20} />
                <div>
                  <p className="text-sm text-gray-400">Nombre</p>
                  <p className="font-medium text-gray-100">{userProfile.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 bg-gray-700/50 rounded-lg transition-all duration-300 hover:bg-gray-700/70">
                <FiMail className="text-amber-500" size={20} />
                <div>
                  <p className="text-sm text-gray-400">Correo Electrónico</p>
                  <p className="font-medium text-gray-100">{userProfile.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 bg-gray-700/50 rounded-lg transition-all duration-300 hover:bg-gray-700/70">
                <FiPhone className="text-amber-500" size={20} />
                <div>
                  <p className="text-sm text-gray-400">Teléfono</p>
                  <p className="font-medium text-gray-100">{userProfile.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 bg-gray-700/50 rounded-lg transition-all duration-300 hover:bg-gray-700/70">
                <FiMapPin className="text-amber-500" size={20} />
                <div>
                  <p className="text-sm text-gray-400">Dirección</p>
                  <p className="font-medium text-gray-100">{userProfile.address}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 bg-gray-700/50 rounded-lg transition-all duration-300 hover:bg-gray-700/70">
                <FiCalendar className="text-amber-500" size={20} />
                <div>
                  <p className="text-sm text-gray-400">Fecha de Registro</p>
                  <p className="font-medium text-gray-100">{userProfile.joinedDate}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setShowProfileModal(false);
                setActiveTab('settings');
              }}
              className="w-full mt-6 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-gray-100 py-3 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <FiEdit className="mr-2" /> Editar Perfil
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderIntrusionModal = () => {
    if (!showIntrusionModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute text-red-400 opacity-20 animate-float"
              style={{
                fontSize: '1.5rem',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            >
              ⚠️
            </div>
          ))}
        </div>

        <div className="relative w-full max-w-md">
          <div className="absolute inset-0 bg-red-500 rounded-2xl opacity-20 animate-ping-slow"></div>
          <div className="absolute -inset-2 bg-red-600/30 blur-xl rounded-3xl opacity-70"></div>
          <div className="relative bg-gradient-to-br from-red-900 via-red-800 to-red-900 rounded-2xl shadow-2xl overflow-hidden border border-red-500/50 transform transition-all duration-300">
            <div className="relative p-6 bg-gradient-to-r from-red-700 to-red-600 text-white">
              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%,transparent_100%)] bg-[length:10px_10px]"></div>
              <div className="relative flex flex-col items-center justify-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                  <div className="relative w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <FiAlertTriangle className="text-red-600 text-2xl" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center mb-2 tracking-tight text-white drop-shadow-md">
                  ¡ALERTA DE SEGURIDAD!
                </h2>
                <p className="text-red-100 text-center mb-2 font-medium">
                  Intrusión detectada
                </p>
                <p className="text-red-200 text-center text-sm">
                  Movimiento detectado en la propiedad
                </p>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-b from-red-950 to-red-900">
              {verificationStep === 'question' && (
                <div className="animate-fade-in">
                  <p className="text-lg font-medium mb-4 text-center text-white">
                    ¿Eres tú quien activó el sensor?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => handleIntrusionResponse(true)}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-3 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold"
                    >
                      <FiUser className="mr-2" /> Sí, soy yo
                    </button>
                    <button
                      onClick={() => handleIntrusionResponse(false)}
                      className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white px-6 py-3 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold"
                    >
                      <FiVideo className="mr-2" /> Verificar cámara
                    </button>
                  </div>
                </div>
              )}
              
              {verificationStep === 'password' && (
                <div className="animate-fade-in">
                  <p className="text-lg font-medium mb-4 text-center text-white">
                    Verifica tu identidad
                  </p>
                  <p className="text-red-200 text-center text-sm mb-4">
                    Ingresa tu contraseña para desactivar la alarma
                  </p>
                  
                  <div className="relative mb-4">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingresa tu contraseña de seguridad"
                      className="w-full p-4 bg-red-800/50 border border-red-600/50 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 pr-12"
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-300 hover:text-white transition-colors duration-200 p-1"
                    >
                      {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </button>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setVerificationStep('question')}
                      className="flex-1 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white px-4 py-3 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl font-medium"
                    >
                      ← Volver
                    </button>
                    <button
                      onClick={disarmAlarm}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-3 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl font-medium"
                    >
                      <FiCheck className="mr-2" /> Verificar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-red-950 p-3 border-t border-red-800/50">
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-red-400 text-xs font-medium">ALARMA ACTIVA - RESPONDE INMEDIATAMENTE</span>
              </div>
            </div>
          </div>
        </div>

        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes ping-slow {
              0% { transform: scale(1); opacity: 0.8; }
              75%, 100% { transform: scale(1.05); opacity: 0; }
            }
            @keyframes float {
              0%, 100% { transform: translateY(0) rotate(0deg); }
              50% { transform: translateY(-10px) rotate(5deg); }
            }
            .animate-fade-in {
              animation: fadeIn 0.5s ease-out;
            }
            .animate-ping-slow {
              animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            }
            .animate-float {
              animation: float 3s ease-in-out infinite;
            }
          `}
        </style>
      </div>
    );
  };

 const renderCameraView = (): JSX.Element | null => {
  if (!showCameraView) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden transform transition-all duration-300 scale-100 hover:scale-[1.01] border border-gray-700">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
          <h2 className="text-xl font-bold text-gray-100 tracking-tight flex items-center">
            <FiVideo className="mr-2" /> Vista de cámara de seguridad
          </h2>
          <button
            onClick={handleCameraReviewComplete}
            className="text-gray-400 hover:text-gray-100 transition-colors transform hover:rotate-90 duration-300"
          >
            <FiX size={24} />
          </button>
        </div>
        <div className="p-6">
          <div className="bg-gray-700/50 aspect-video flex items-center justify-center rounded-xl mb-6 shadow-inner relative overflow-hidden">
            <img
              src="http://192.168.18.25:8080/video"
              alt="Cámara IP"
              className="w-full h-full object-cover"
              onError={() => toast.error('Error al cargar el video de la cámara.', { autoClose: 3000 })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700/50 p-4 rounded-lg shadow-sm transition-all duration-300 hover:bg-gray-700/70">
              <h3 className="font-medium mb-2 text-gray-100 flex items-center">
                <FiVideo className="mr-2 text-amber-500" /> Cámara Principal
              </h3>
              <p className="text-sm text-gray-400">Transmisión en vivo desde IP Webcam</p>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg shadow-sm transition-all duration-300 hover:bg-gray-700/70">
              <h3 className="font-medium mb-2 text-gray-100 flex items-center">
                <FiVideo className="mr-2 text-amber-500" /> Estado
              </h3>
              <p className="text-sm text-gray-400">
                {isAlarmActive ? 'Alarma activa' : 'Sistema seguro'}
              </p>
            </div>
          </div>
          <button
            onClick={handleCameraReviewComplete}
            className="w-full mt-6 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-gray-100 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Continuar con verificación
          </button>
        </div>
      </div>
    </div>
  );
};

  const renderDashboard = () => (
    <div className="space-y-8">
      

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center text-gray-100 tracking-tight">
            <FiShield className="mr-2 text-amber-500" size={24} /> Estado del Sistema
          </h2>
          <button 
            onClick={connectSocket}
            className="text-gray-400 hover:text-amber-500 transition-colors flex items-center gap-2 transform hover:rotate-180 duration-500"
            disabled={isLoading || connectionStatus === 'connecting'}
          >
            <FiRefreshCw size={16} className={connectionStatus === 'connecting' ? 'animate-spin' : ''} />
            <span className="text-sm">Actualizar</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-6 rounded-xl flex flex-col items-center justify-center text-center transition-all duration-300 shadow-inner ${isAlarmActive ? 'bg-red-900/30 border-2 border-red-600 animate-pulse' : 'bg-green-900/30 border-2 border-green-600'}`}>
            <div className={`mb-4 p-4 rounded-full ${isAlarmActive ? 'bg-red-600/20' : 'bg-green-600/20'}`}>
              {isAlarmActive ? (
                <FiAlertTriangle size={48} className="text-red-500 animate-pulse" />
              ) : (
                <FiLock size={48} className="text-green-500" />
              )}
            </div>
            <h3 className="text-2xl font-bold mb-2 text-gray-100">
              {isAlarmActive ? 'Alarma Activada' : 'Sistema Seguro'}
            </h3>
            <p className="text-gray-300">
              {isAlarmActive ? 'Intrusión detectada. Acción requerida.' : 'Todo está bajo control. No hay amenazas detectadas.'}
            </p>
          </div>
          <div className="flex flex-col justify-between">
            <div className="mb-4">
              <h4 className="text-lg font-medium mb-2 text-gray-100 flex items-center">
                <FiActivity className="mr-2 text-amber-500" /> Detalles de Conexión
              </h4>
              <div className="bg-gray-700/50 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Estado de Conexión:</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="font-medium capitalize text-gray-100">{connectionStatus}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {isAlarmActive ? (
                <button
                  onClick={() => setShowIntrusionModal(true)}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-gray-100 py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm font-medium"
                >
                  <FiAlertTriangle className="mr-2" /> Verificar y Desactivar Alarma
                </button>
              ) : (
                <button
                  onClick={activateAlarm}
                  disabled={isLoading || connectionStatus !== 'connected'}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-gray-100 py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {isLoading ? 'Procesando...' : (
                    <>
                      <FiCheck className="mr-2" /> Activar Sistema de Seguridad
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-100 tracking-tight">
          <FiBell className="mr-2 text-amber-500" size={24} /> Actividad Reciente
        </h2>
        <div className="space-y-4">
          {alarmHistory.slice(0, 3).map((item) => (
            <div key={item.id} className={`p-4 rounded-xl flex items-center justify-between ${getHistoryItemStyle(item.type)} transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-1`}>
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${getHistoryBadgeStyle(item.type)}`}>
                  {item.type === 'activated' && <FiCheck size={16} />}
                  {item.type === 'deactivated' && <FiX size={16} />}
                  {item.type === 'intrusion' && <FiAlertTriangle size={16} />}
                </div>
                <div>
                  <p className="font-medium text-gray-100">{item.message}</p>
                  <p className="text-sm text-gray-400">{formatDate(item.timestamp)}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getHistoryBadgeStyle(item.type)}`}>
                {getHistoryBadgeText(item.type)}
              </span>
            </div>
          ))}
          {alarmHistory.length === 0 && (
            <p className="text-gray-400 text-center py-6">No hay actividad reciente disponible</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700">
      <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-100 tracking-tight">
        <FiClock className="mr-2 text-amber-500" /> Historial de Alarmas
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead>
            <tr className="text-left border-b border-gray-600">
              <th className="pb-3 text-gray-100 font-semibold">Evento</th>
              <th className="pb-3 text-gray-100 font-semibold">Fecha y Hora</th>
              <th className="pb-3 text-gray-100 font-semibold">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {alarmHistory.map((item) => (
              <tr key={item.id} className="border-b border-gray-600 hover:bg-gray-700/50 transition-colors duration-300">
                <td className="py-3 text-gray-100">{item.message}</td>
                <td className="py-3 text-gray-100">{formatDate(item.timestamp)}</td>
                <td className="py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getHistoryBadgeStyle(item.type)}`}>
                    {getHistoryBadgeText(item.type)}
                  </span>
                </td>
              </tr>
            ))}
            {alarmHistory.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-gray-400">
                  No hay eventos en el historial
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700">
      <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-100 tracking-tight">
        <FiSettings className="mr-2 text-amber-500" /> Configuración
      </h2>
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-100">Editar Perfil</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-2 font-medium">Nombre</label>
              <input
                type="text"
                value={editProfile.name}
                onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300"
                placeholder="Ingrese su nombre"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2 font-medium">Correo Electrónico</label>
              <input
                type="email"
                value={editProfile.email}
                onChange={(e) => setEditProfile({ ...editProfile, email: e.target.value })}
                className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300"
                placeholder="Ingrese su correo"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2 font-medium">Teléfono</label>
              <input
                type="tel"
                value={editProfile.phone}
                onChange={(e) => setEditProfile({ ...editProfile, phone: e.target.value })}
                className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300"
                placeholder="Ingrese su teléfono"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2 font-medium">Dirección</label>
              <input
                type="text"
                value={editProfile.address}
                onChange={(e) => setEditProfile({ ...editProfile, address: e.target.value })}
                className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300"
                placeholder="Ingrese su dirección"
              />
            </div>
            <button
              onClick={handleProfileUpdate}
              className="bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-gray-100 p-3 rounded-lg transition-all duration-300 w-full shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Guardar Perfil
            </button>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-100">Cambiar Contraseña</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-2 font-medium">Contraseña Actual</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300 pr-10"
                  placeholder="Ingrese su contraseña actual"
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-gray-400 mb-2 font-medium">Nueva Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300 pr-10"
                  placeholder="Ingrese nueva contraseña"
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-gray-400 mb-2 font-medium">Confirmar Nueva Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300 pr-10"
                  placeholder="Confirme nueva contraseña"
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>
            <button 
              onClick={handlePasswordChange}
              className="bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-gray-100 p-3 rounded-lg transition-all duration-300 w-full shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGraphics = () => {
    const counts = {
      activated: alarmHistory.filter(h => h.type === 'activated').length,
      deactivated: alarmHistory.filter(h => h.type === 'deactivated').length,
      intrusion: alarmHistory.filter(h => h.type === 'intrusion').length,
    };

    const pieData = [
      { name: 'Activadas', value: counts.activated },
      { name: 'Desactivadas', value: counts.deactivated },
      { name: 'Intrusiones', value: counts.intrusion },
    ];

    const COLORS = ['#F59E0B', '#10B981', '#EF4444'];

    const sortedHistory = [...alarmHistory].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    let state = 0;
    const lineData = sortedHistory.map(item => {
      if (item.type === 'activated' || item.type === 'intrusion') state = 1;
      if (item.type === 'deactivated') state = 0;
      return {
        time: formatDate(item.timestamp).split(', ')[1], // Solo hora
        state,
      };
    });

    const weeklyData = [
      { day: 'Lun', events: 4 },
      { day: 'Mar', events: 2 },
      { day: 'Mié', events: 7 },
      { day: 'Jue', events: 3 },
      { day: 'Vie', events: 5 },
      { day: 'Sáb', events: 1 },
      { day: 'Dom', events: 2 },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-100 tracking-tight">
              <FiBarChart className="mr-2 text-amber-500" /> Distribución de Eventos
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-100 tracking-tight">
              <FiBarChart className="mr-2 text-amber-500" /> Actividad Semanal
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#525252" />
                <XAxis dataKey="day" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip />
                <Area type="monotone" dataKey="events" stroke="#F59E0B" fill="url(#colorUv)" fillOpacity={0.3} />
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-100 tracking-tight">
            <FiBarChart className="mr-2 text-amber-500" /> Estado de Alarma en el Tiempo
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#525252" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis domain={[0, 1]} ticks={[0, 1]} stroke="#9CA3AF" />
              <Tooltip />
              <Legend />
              <Line type="step" dataKey="state" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 flex font-sans overflow-hidden">
      <audio ref={audioRef} src="/sounds/alarm.mp3" />
      <div className={`bg-gradient-to-b from-gray-900 to-gray-800 w-64 fixed h-screen transition-all duration-500 z-20 shadow-2xl ${sidebarOpen ? 'left-0' : '-left-64'} md:left-0`}>
        <div className="p-5 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-amber-500 to-red-600">
          <h1 className="text-xl font-bold text-gray-100 flex items-center tracking-tight">
            <FiHome className="mr-2" /> QHATU MARCA
          </h1>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="text-gray-100 hover:text-gray-300 transition-colors md:hidden"
          >
            <FiX />
          </button>
        </div>
        <div className="p-4 border-b border-gray-700">
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center space-x-3 w-full text-left hover:bg-gray-800/50 p-3 rounded-lg transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-gray-100 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <FiUser size={20} />
            </div>
            <div>
              <p className="font-semibold text-gray-100">{userProfile.name}</p>
              <p className="text-sm text-gray-400">{userProfile.email}</p>
            </div>
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`w-full text-left p-3 rounded-lg flex items-center transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-amber-500/20 text-amber-500 border-r-4 border-amber-500' : 'hover:bg-gray-800/50 text-gray-100'} transform hover:-translate-y-1`}
              >
                <FiHome className="mr-3" /> Dashboard
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('history')}
                className={`w-full text-left p-3 rounded-lg flex items-center transition-all duration-300 ${activeTab === 'history' ? 'bg-amber-500/20 text-amber-500 border-r-4 border-amber-500' : 'hover:bg-gray-800/50 text-gray-100'} transform hover:-translate-y-1`}
              >
                <FiClock className="mr-3" /> Historial
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('graphics')}
                className={`w-full text-left p-3 rounded-lg flex items-center transition-all duration-300 ${activeTab === 'graphics' ? 'bg-amber-500/20 text-amber-500 border-r-4 border-amber-500' : 'hover:bg-gray-800/50 text-gray-100'} transform hover:-translate-y-1`}
              >
                <FiBarChart className="mr-3" /> Gráficos
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full text-left p-3 rounded-lg flex items-center transition-all duration-300 ${activeTab === 'settings' ? 'bg-amber-500/20 text-amber-500 border-r-4 border-amber-500' : 'hover:bg-gray-800/50 text-gray-100'} transform hover:-translate-y-1`}
              >
                <FiSettings className="mr-3" /> Configuración
              </button>
            </li>
            <li className="pt-4 mt-4 border-t border-gray-700">
              <button 
                onClick={handleLogout}
                className="w-full text-left p-3 rounded-lg flex items-center transition-all duration-300 hover:bg-red-600/20 text-red-500 hover:text-red-600 transform hover:-translate-y-1"
              >
                <FiLogOut className="mr-3" /> Cerrar Sesión
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <div className={`flex-1 transition-all duration-500 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-gray-100 p-2 rounded-lg hover:bg-gray-700/50 transition-all duration-300 transform hover:scale-110"
            >
              <FiMenu size={20} />
            </button>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-600' : 'bg-red-600'} animate-pulse`}></div>
              <span className={`text-sm font-medium ${connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                {connectionStatus === 'connected' ? 'Conectado' : connectionStatus === 'connecting' ? 'Conectando...' : 'No Conectado'}
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-6 text-gray-100 tracking-tight animate-fade-in">
            {activeTab === 'dashboard' && 'Dashboard de Seguridad'}
            {activeTab === 'history' && 'Historial de Alarmas'}
            {activeTab === 'graphics' && 'Gráficos y Estadísticas'}
            {activeTab === 'settings' && 'Configuración del Sistema'}
          </h1>

          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'history' && renderHistory()}
          {activeTab === 'graphics' && renderGraphics()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>

      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastClassName="bg-gray-800 text-gray-100"
      />
      
      {renderProfileModal()}
      {renderIntrusionModal()}
      {renderCameraView()}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse-slow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
          }
          .animate-pulse-slow {
            animation: pulse-slow 2s infinite;
          }
        `}
      </style>
    </div>
  );
};

function getHistoryItemStyle(type: string): string {
  switch (type) {
    case 'activated': return 'bg-amber-500/10 border border-amber-500/30';
    case 'deactivated': return 'bg-green-500/10 border border-green-500/30';
    case 'intrusion': return 'bg-red-500/10 border border-red-500/30';
    default: return 'bg-gray-600';
  }
}

function getHistoryBadgeStyle(type: string): string {
  switch (type) {
    case 'activated': return 'bg-amber-500 text-gray-900';
    case 'deactivated': return 'bg-green-600 text-gray-100';
    case 'intrusion': return 'bg-red-600 text-gray-100';
    default: return 'bg-gray-600 text-gray-100';
  }
}

function getHistoryBadgeText(type: string): string {
  switch (type) {
    case 'activated': return 'Activación';
    case 'deactivated': return 'Desactivación';
    case 'intrusion': return 'Intrusión';
    default: return 'Evento';
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default Dashboard;