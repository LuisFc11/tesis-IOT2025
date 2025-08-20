require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mqtt = require('mqtt');

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure CORS with restricted origin
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error en MongoDB:', err.message));

// Modelo para almacenar eventos
const ReporteSchema = new mongoose.Schema({
  message: String,
  timestamp: { type: Date, default: Date.now }
});
const Reporte = mongoose.model('Reporte', ReporteSchema);

// Ruta para obtener datos de Reporte
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Reporte.find().sort({ timestamp: -1 }).limit(100);
    res.json(reports);
  } catch (err) {
    console.error('Error al obtener reports:', err.message);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

// Configuración del cliente MQTT
const mqttOptions = {
  port: parseInt(process.env.MQTT_PORT),
  username: process.env.MQTT_USER || undefined,
  password: process.env.MQTT_PASSWORD || undefined
};
const mqttClient = mqtt.connect(process.env.MQTT_BROKER, mqttOptions);

mqttClient.on('connect', () => {
  console.log('Conectado a MQTT');
  mqttClient.subscribe('home/alarm/status', (err) => {
    if (!err) console.log('Suscrito a home/alarm/status');
    else console.error('Error al suscribirse a MQTT:', err.message);
  });
});

mqttClient.on('error', (err) => {
  console.error('Error en conexión MQTT:', err.message);
});

mqttClient.on('message', (topic, message) => {
  console.log('Mensaje MQTT recibido:', topic, message.toString());
  try {
    const data = JSON.parse(message.toString());
    const newReporte = new Reporte({ message: JSON.stringify(data) });
    newReporte.save()
      .then(() => {
        console.log(`Guardado en Reporte desde ${topic}: ${message}`);
        io.emit('alarmNotification', { message: JSON.stringify(data), timestamp: new Date() });
      })
      .catch(err => console.error('Error al guardar en Reporte:', err.message));
  } catch (err) {
    console.error('Error al parsear mensaje MQTT:', err.message);
  }
});

// Socket.io conexión
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('disarmAlarm', (data) => {
    console.log('Solicitud de desactivación recibida:', data);
    try {
      const { password } = data;

      // Validate password input
      if (!password || typeof password !== 'string' || password.length > 20) {
        console.error('Contraseña inválida o no proporcionada');
        socket.emit('alarmNotification', {
          message: JSON.stringify({ error: 'Invalid or missing password' }),
          timestamp: new Date(),
        });
        return;
      }

      const mqttMessage = JSON.stringify({ password });
      console.log('Publicando mensaje MQTT:', mqttMessage);
      mqttClient.publish('home/alarm/control', mqttMessage, { qos: 1 }, (err) => {
        if (err) {
          console.error('Error al publicar MQTT:', err.message);
          socket.emit('alarmNotification', {
            message: JSON.stringify({ error: 'Failed to publish MQTT message' }),
            timestamp: new Date(),
          });
        } else {
          console.log('Mensaje MQTT publicado exitosamente');
        }
      });
    } catch (err) {
      console.error('Error al procesar disarmAlarm:', err.message);
      socket.emit('alarmNotification', {
        message: JSON.stringify({ error: 'Invalid request format' }),
        timestamp: new Date(),
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Iniciar servidor
const PORT = parseInt(process.env.SERVER_PORT) || 5000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});