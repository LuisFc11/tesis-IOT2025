import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Para redirigir
import { io } from 'socket.io-client';
import { 
  FiHome, 
  FiClock, 
  FiSettings, 
  FiShield, 
  FiBell, 
  FiX, 
  FiCheck,
  FiMenu,
  FiLogOut,
  FiVideo,
  FiUser,
  FiAlertTriangle
} from 'react-icons/fi';

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

const dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alarmHistory, setAlarmHistory] = useState<AlarmHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showIntrusionModal, setShowIntrusionModal] = useState(false);
  const [showCameraView, setShowCameraView] = useState(false);
  const [verificationStep, setVerificationStep] = useState('question'); // 'question', 'password', 'camera'

  // Simular historial de alarmas
  useEffect(() => {
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
      }
    ];
    setAlarmHistory(mockHistory);
  }, []);

  // Conexión a Socket.io y manejo de notificaciones
  useEffect(() => {
    const socket = io('http://localhost:5000', { withCredentials: true, transports: ['websocket'] });

    socket.on('connect', () => {
      console.log('Conectado a Socket.io');
      setIsLoading(false);
    });

    socket.on('alarmNotification', (data: AlarmNotification) => {
      console.log('Recibido alarmNotification:', data);
      try {
        const parsedMessage = JSON.parse(data.message);
        if (parsedMessage.error) {
          setNotification(parsedMessage.error);
          setTimeout(() => setNotification(null), 3000);
        } else {
          const isActive = parsedMessage.alarmActive;
          setIsAlarmActive(isActive);

          const newHistoryItem: AlarmHistoryItem = {
            id: alarmHistory.length + 1,
            type: isActive ? 'intrusion' : 'deactivated',
            timestamp: new Date(),
            message: isActive 
              ? '¡Intrusión detectada! La alarma se ha activado.' 
              : 'Alarma desactivada correctamente.'
          };

          setAlarmHistory(prev => [newHistoryItem, ...prev]);

          if (isActive) {
            setShowIntrusionModal(true);
            setVerificationStep('question');
          }

          setNotification(
            isActive
              ? '¡Alarma activada! Intrusión detectada.'
              : 'Alarma desactivada correctamente.'
          );
          setTimeout(() => setNotification(null), 3000);
          if (!isActive) setPassword('');
        }
      } catch (err) {
        console.error('Error al procesar alarmNotification:', err);
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Error de conexión Socket.io:', err.message);
      setIsLoading(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [alarmHistory.length]);

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('token'); // Elimina el token
    navigate('/'); // Redirige a la página de login
  };

  const disarmAlarm = () => {
    if (password) {
      setIsLoading(true);
      const socket = io('http://localhost:5000');
      socket.emit('disarmAlarm', { password });
      setNotification('Enviando contraseña...');
      setShowIntrusionModal(false);
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification('Por favor, ingrese una contraseña.');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const activateAlarm = () => {
    setIsLoading(true);
    const socket = io('http://localhost:5000');
    socket.emit('activateAlarm');
    setNotification('Activando sistema de alarma...');

    const newHistoryItem: AlarmHistoryItem = {
      id: alarmHistory.length + 1,
      type: 'activated',
      timestamp: new Date(),
      message: 'Sistema activado por el usuario'
    };

    setAlarmHistory(prev => [newHistoryItem, ...prev]);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleIntrusionResponse = (wasUser: boolean) => {
    if (wasUser) {
      setVerificationStep('password');
    } else {
      setVerificationStep('camera');
      setShowCameraView(true);
    }
  };

  const handleCameraReviewComplete = () => {
    setShowCameraView(false);
    setVerificationStep('password');
  };

  const renderIntrusionModal = () => {
    if (!showIntrusionModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-center text-red-500 mb-4">
              <FiAlertTriangle size={48} />
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-2">¡Alerta de Intrusión!</h2>
            <p className="text-gray-300 text-center mb-6">
              Se ha detectado movimiento en la propiedad
            </p>
            
            {verificationStep === 'question' && (
              <div>
                <p className="text-lg font-medium mb-4 text-center">¿Eres tú?</p>
                <div className="flex space-x-4 justify-center">
                  <button
                    onClick={() => handleIntrusionResponse(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
                  >
                    <FiUser className="mr-2" /> Sí, soy yo
                  </button>
                  <button
                    onClick={() => handleIntrusionResponse(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
                  >
                    <FiVideo className="mr-2" /> Revisar cámara
                  </button>
                </div>
              </div>
            )}
            
            {verificationStep === 'password' && (
              <div>
                <p className="text-lg font-medium mb-4 text-center">Verifica tu identidad</p>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese contraseña"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />
                <div className="flex space-x-4">
                  <button
                    onClick={() => setVerificationStep('question')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex-1"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={disarmAlarm}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex-1"
                  >
                    Verificar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCameraView = () => {
    if (!showCameraView) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold">Vista de cámara de seguridad</h2>
            <button
              onClick={handleCameraReviewComplete}
              className="text-gray-400 hover:text-white"
            >
              <FiX size={24} />
            </button>
          </div>
          
          <div className="p-4">
            <div className="bg-black aspect-video flex items-center justify-center rounded-lg mb-4">
              <div className="text-center">
                <FiVideo size={64} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">Simulación de vista de cámara</p>
                <div className="mt-4 bg-gray-900 rounded-lg p-4 inline-block">
                  <div className="flex animate-pulse">
                    <div className="bg-red-500 rounded-full w-4 h-4 mr-2"></div>
                    <div className="bg-red-500 rounded-full w-4 h-4"></div>
                  </div>
                  <p className="text-sm mt-2">Grabando en curso...</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 p-3 rounded-lg">
                <h3 className="font-medium mb-2">Cámara Principal</h3>
                <p className="text-sm text-gray-400">Entrada - Último movimiento: hace 0:23 seg</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <h3 className="font-medium mb-2">Cámara Trasera</h3>
                <p className="text-sm text-gray-400">Jardín - Sin movimiento</p>
              </div>
            </div>
            
            <button
              onClick={handleCameraReviewComplete}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors mt-6"
            >
              Continuar con verificación
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FiShield className="mr-2" /> Estado del Sistema
        </h2>
        <div className={`p-4 rounded-lg mb-4 ${isAlarmActive ? 'bg-red-900/20 border border-red-700' : 'bg-green-900/20 border border-green-700'}`}>
          <p className="text-lg font-medium">
            {isAlarmActive ? '⚠️ Alarma Activada - Intrusión Detectada' : '✅ Sistema Seguro'}
          </p>
        </div>
        
        {notification && (
          <div className={`p-3 rounded-lg mb-4 ${notification.includes('error') ? 'bg-red-900/20' : 'bg-blue-900/20'}`}>
            <p className="text-sm">{notification}</p>
          </div>
        )}

        <div className="flex flex-col gap-4 mt-6">
          {isAlarmActive ? (
            <>
              <p className="text-gray-300">La alarma está activa. ¿Necesitas desactivarla?</p>
              <button
                onClick={() => setShowIntrusionModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg transition-colors flex items-center justify-center"
              >
                <FiX className="mr-2" /> Verificar Intrusión
              </button>
            </>
          ) : (
            <button
              onClick={activateAlarm}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? 'Procesando...' : (
                <>
                  <FiCheck className="mr-2" /> Activar Sistema
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FiBell className="mr-2" /> Actividad Reciente
        </h2>
        <div className="space-y-3">
          {alarmHistory.slice(0, 3).map((item) => (
            <div key={item.id} className={`p-3 rounded-lg flex items-start ${getHistoryItemStyle(item.type)}`}>
              <div className="flex-1">
                <p className="font-medium">{item.message}</p>
                <p className="text-xs text-gray-400">{formatDate(item.timestamp)}</p>
              </div>
            </div>
          ))}
          {alarmHistory.length === 0 && (
            <p className="text-gray-400 text-center py-4">No hay actividad reciente</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <FiClock className="mr-2" /> Historial de Alarmas
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-700">
              <th className="pb-3">Evento</th>
              <th className="pb-3">Fecha y Hora</th>
              <th className="pb-3">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {alarmHistory.map((item) => (
              <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-750">
                <td className="py-3">{item.message}</td>
                <td className="py-3">{formatDate(item.timestamp)}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${getHistoryBadgeStyle(item.type)}`}>
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
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <FiSettings className="mr-2" /> Configuración
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-gray-300 mb-2">Contraseña actual</label>
          <input
            type="password"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ingrese su contraseña actual"
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-2">Nueva contraseña</label>
          <input
            type="password"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ingrese nueva contraseña"
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-2">Confirmar nueva contraseña</label>
          <input
            type="password"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Confirme nueva contraseña"
          />
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors w-full">
          Guardar Cambios
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      <div className={`bg-gray-800 w-64 fixed h-screen transition-all duration-300 z-10 ${sidebarOpen ? 'left-0' : '-left-64'}`}>
        <div className="p-5 border-b border-gray-700 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-400 flex items-center">
            <FiHome className="mr-2" /> SecureHome
          </h1>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white"
          >
            <FiX />
          </button>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`w-full text-left p-3 rounded-lg flex items-center transition-colors ${activeTab === 'dashboard' ? 'bg-blue-900/30 text-blue-400' : 'hover:bg-gray-700'}`}
              >
                <FiHome className="mr-3" /> Dashboard
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('history')}
                className={`w-full text-left p-3 rounded-lg flex items-center transition-colors ${activeTab === 'history' ? 'bg-blue-900/30 text-blue-400' : 'hover:bg-gray-700'}`}
              >
                <FiClock className="mr-3" /> Historial
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full text-left p-3 rounded-lg flex items-center transition-colors ${activeTab === 'settings' ? 'bg-blue-900/30 text-blue-400' : 'hover:bg-gray-700'}`}
              >
                <FiSettings className="mr-3" /> Configuración
              </button>
            </li>
            <li className="pt-4 mt-4 border-t border-gray-700">
              <button 
                onClick={handleLogout} // Nuevo evento para cerrar sesión
                className="w-full text-left p-3 rounded-lg flex items-center transition-colors hover:bg-gray-700 text-red-400 hover:text-red-300"
              >
                <FiLogOut className="mr-3" /> Cerrar Sesión
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800"
            >
              <FiMenu size={20} />
            </button>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm">Conectado</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-6">
            {activeTab === 'dashboard' && 'Dashboard'}
            {activeTab === 'history' && 'Historial de Alarmas'}
            {activeTab === 'settings' && 'Configuración'}
          </h1>

          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'history' && renderHistory()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>

      {renderIntrusionModal()}
      {renderCameraView()}
    </div>
  );
};

// Funciones auxiliares (sin cambios)
function getHistoryItemStyle(type: string) {
  switch (type) {
    case 'activated': return 'bg-blue-900/20 border border-blue-700';
    case 'deactivated': return 'bg-green-900/20 border border-green-700';
    case 'intrusion': return 'bg-red-900/20 border border-red-700';
    default: return 'bg-gray-700';
  }
}

function getHistoryBadgeStyle(type: string) {
  switch (type) {
    case 'activated': return 'bg-blue-700 text-blue-200';
    case 'deactivated': return 'bg-green-700 text-green-200';
    case 'intrusion': return 'bg-red-700 text-red-200';
    default: return 'bg-gray-700';
  }
}

function getHistoryBadgeText(type: string) {
  switch (type) {
    case 'activated': return 'Activación';
    case 'deactivated': return 'Desactivación';
    case 'intrusion': return 'Intrusión';
    default: return 'Evento';
  }
}

function formatDate(date: Date) {
  return new Date(date).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default dashboard;