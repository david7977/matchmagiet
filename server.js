const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const app = express();
const PORT = process.env.PORT || 3001;

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/matchmagiet')
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('No se pudo conectar a MongoDB', err));

// Definir el esquema y modelo de usuario
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String
});

const User = mongoose.model('User', userSchema);

// Configurar bodyParser para manejar datos de formularios
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Añadir para manejar JSON

// Configurar sesiones
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rutas para servir archivos HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/register.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.get('/dashboard', (req, res) => {
  if (req.session.loggedIn) {
    res.sendFile(path.join(__dirname, 'public/dashboard.html'));
  } else {
    res.redirect('/login');
  }
});

// Ruta para obtener perfiles destacados y buscar perfiles
const perfiles = [
  { nombre: "Ana", edad: 28, ciudad: "Madrid", intereses: "Libros, Música", imagen: "https://i.imgur.com/imagen1.jpg" },
  { nombre: "Juan", edad: 35, ciudad: "Barcelona", intereses: "Deportes, Viajes", imagen: "https://i.imgur.com/imagen2.jpg" },
  // Añadir más perfiles según sea necesario
];

app.get('/perfiles', (req, res) => {
  const search = req.query.search;
  if (search) {
    const resultados = perfiles.filter(perfil => 
      perfil.nombre.toLowerCase().includes(search.toLowerCase()) ||
      perfil.ciudad.toLowerCase().includes(search.toLowerCase()) ||
      perfil.intereses.toLowerCase().includes(search.toLowerCase())
    );
    res.json(resultados);
  } else {
    res.json(perfiles);
  }
});

// Manejar el registro de usuarios
app.post('/register', 
  [
    body('username').notEmpty().withMessage('Nombre de usuario es requerido'),
    body('email').isEmail().withMessage('Correo electrónico no es válido'),
    body('password').isLength({ min: 5 }).withMessage('La contraseña debe tener al menos 5 caracteres'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    })
  ], 
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Convertir los errores a un formato de objeto de mensajes
      const errorMessages = errors.array().reduce((acc, err) => {
        acc[err.param] = err.msg;
        return acc;
      }, {});
      return res.status(400).json({ errors: errorMessages });
    }

    const { username, email, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ errors: { email: 'El usuario ya existe' } });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario y guardar en la base de datos
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.redirect('/login'); // Redireccionar a la página de inicio de sesión después de registrarse
  }
);

// Manejar el inicio de sesión de usuarios
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && await bcrypt.compare(password, user.password)) {
    req.session.loggedIn = true;
    req.session.userId = user._id;
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

// Manejar el cierre de sesión
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
