require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mqtt = require('mqtt');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true }
});
const User = mongoose.model('User', UserSchema, 'usuarios');

// Reporte Schema
const ReporteSchema = new mongoose.Schema({
  message: String,
  timestamp: { type: Date, default: Date.now }
});
const Reporte = mongoose.model('Reporte', ReporteSchema);

// Token verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

// Signup Endpoint
app.post('/api/signup', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Usuario o email ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, email });
    await newUser.save();

    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (err) {
    console.error('Error al crear usuario:', err.message);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login exitoso', token, username: user.username, email: user.email });
  } catch (err) {
    console.error('Error al iniciar sesión:', err.message);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Update Profile Endpoint
app.post('/api/update-profile', verifyToken, async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    let updated = false;
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) return res.status(400).json({ error: 'Nombre de usuario ya existe' });
      user.username = username;
      updated = true;
    }
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) return res.status(400).json({ error: 'Email ya existe' });
      user.email = email;
      updated = true;
    }

    if (updated) {
      await user.save();
    }

    const newToken = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Perfil actualizado', token: newToken, username: user.username, email: user.email });
  } catch (err) {
    console.error('Error al actualizar perfil:', err.message);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

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
  mqttClient.subscribe('home/alarm/control', (err) => {
    if (!err) console.log('Suscrito a home/alarm/control');
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
        // Broadcast to all Socket.io clients
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

      if (!password || typeof password !== 'string' || password.length > 20) {
        console.error('Contraseña inválida o no proporcionada');
        io.emit('alarmNotification', {
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
          io.emit('alarmNotification', {
            message: JSON.stringify({ error: 'Failed to publish MQTT message' }),
            timestamp: new Date(),
          });
        } else {
          console.log('Mensaje MQTT publicado exitosamente');
        }
      });
    } catch (err) {
      console.error('Error al procesar disarmAlarm:', err.message);
      io.emit('alarmNotification', {
        message: JSON.stringify({ error: 'Invalid request format' }),
        timestamp: new Date(),
      });
    }
  });

  socket.on('activateAlarm', () => {
    console.log('Solicitud de activación recibida');
    const mqttMessage = JSON.stringify({ action: 'activate' });
    mqttClient.publish('home/alarm/control', mqttMessage, { qos: 1 }, (err) => {
      if (err) {
        console.error('Error al publicar MQTT:', err.message);
        io.emit('alarmNotification', {
          message: JSON.stringify({ error: 'Failed to publish MQTT message' }),
          timestamp: new Date(),
        });
      } else {
        console.log('Mensaje de activación MQTT publicado exitosamente');
      }
    });
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