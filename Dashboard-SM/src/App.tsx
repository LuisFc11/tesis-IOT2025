import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

interface AlarmNotification {
  message: string;
  timestamp: Date;
}

function App() {
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [password, setPassword] = useState('');

  useEffect(() => {
    const socket = io('http://localhost:5000', { withCredentials: true, transports: ['websocket'] });

    socket.on('connect', () => {
      console.log('Conectado a Socket.io');
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
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const disarmAlarm = () => {
    if (password) {
      const socket = io('http://localhost:5000');
      socket.emit('disarmAlarm', { password });
      setNotification('Enviando contraseña...');
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification('Por favor, ingrese una contraseña.');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-blue-400 mb-6">SecureHome</h1>

      {/* Estado de la alarma */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          Estado: {isAlarmActive ? 'Alarma Activa' : 'Sistema Seguro'}
        </h2>
        {notification && (
          <p className="text-sm text-gray-300 mb-4">{notification}</p>
        )}

        {/* Entrada de contraseña */}
        {isAlarmActive && (
          <div className="flex flex-col gap-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese contraseña (1234)"
              className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={disarmAlarm}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
            >
              Desactivar Alarma
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;