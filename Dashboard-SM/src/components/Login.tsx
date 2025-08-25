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
        const { token } = response.data;
        localStorage.setItem('token', token);
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
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
        fontFamily: '"Segoe UI", Arial, sans-serif',
        overflow: 'hidden',
        padding: '20px',
        position: 'relative',
      }}
    >
      {/* Fondo decorativo con animación sutil */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(99, 179, 237, 0.15) 0%, transparent 30%), radial-gradient(circle at 80% 20%, rgba(72, 187, 120, 0.15) 0%, transparent 30%)',
          zIndex: 0,
        }}
      />

      {/* Contenedor principal centrado */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '1100px',
          zIndex: 1,
        }}
      >
        {/* Logo/Marca superior */}
        <div
          style={{
            marginBottom: '30px',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              color: '#e2e8f0',
              fontSize: '2.5rem',
              fontWeight: '700',
              margin: 0,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            <span style={{ color: '#63b3ed' }}>QHATU</span>
            <span style={{ color: '#48bb78' }}> MARCA</span>
          </h1>
          <p style={{ color: '#a0aec0', marginTop: '8px', fontSize: '1rem' }}>
            Sistema de Seguridad y Gestión
          </p>
        </div>

        {/* Tarjeta de login */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#2d3748',
            borderRadius: '16px',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
            width: '100%',
            maxWidth: '900px',
            overflow: 'hidden',
            border: '1px solid #4a5568',
          }}
        >
          {/* Sección de imagen */}
          <div
            style={{
              flex: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '30px',
              backgroundColor: '#1a202c',
              position: 'relative',
              minHeight: '400px',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
             <img
                src="/img/minimarket.jpg"
                alt="Tienda QHATU MARCA"
                style={{
                    width: '350px',     // ancho fijo
                    height: '450px',    // alto fijo
                    objectFit: 'cover', // recorta si la imagen no encaja
                    borderRadius: '10px',
                    display: 'block',
                }}
              />
            </div>
          </div>

          {/* Sección del formulario */}
          <div
            style={{
              flex: '1',
              padding: '40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <h2
              style={{
                color: '#e2e8f0',
                marginBottom: '25px',
                fontSize: '1.8rem',
                fontWeight: '600',
                textAlign: 'center',
              }}
            >
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>

            {error && (
              <div
                style={{
                  color: '#e53e3e',
                  marginBottom: '15px',
                  fontSize: '14px',
                  backgroundColor: 'rgba(229, 62, 62, 0.1)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(229, 62, 62, 0.2)',
                }}
              >
                {error}
              </div>
            )}
            
            {success && (
              <div
                style={{
                  color: '#48bb78',
                  marginBottom: '15px',
                  fontSize: '14px',
                  backgroundColor: 'rgba(72, 187, 120, 0.1)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(72, 187, 120, 0.2)',
                }}
              >
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#a0aec0 ',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  Usuario
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid #4a5568',
                    borderRadius: '8px',
                    backgroundColor: '#1a202c',
                    color: '#e2e8f0',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#63b3ed';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 179, 237, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#4a5568';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {!isLogin && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: '#a0aec0',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '1px solid #4a5568',
                      borderRadius: '8px',
                      backgroundColor: '#1a202c',
                      color: '#e2e8f0',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#63b3ed';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99, 179, 237, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#4a5568';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              )}

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#a0aec0',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid #4a5568',
                    borderRadius: '8px',
                    backgroundColor: '#1a202c',
                    color: '#e2e8f0',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#63b3ed';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 179, 237, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#4a5568';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: isLoading ? '#2d3748' : '#48bb78',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                  transition: 'all 0.3s ease',
                  boxShadow: isLoading ? 'none' : '0 4px 6px rgba(72, 187, 120, 0.3)',
                  marginTop: '10px',
                  position: 'relative',
                }}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#38a169';
                    e.currentTarget.style.boxShadow = '0 6px 8px rgba(72, 187, 120, 0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#48bb78';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(72, 187, 120, 0.3)';
                  }
                }}
              >
                {isLoading ? (
                  <span>Procesando...</span>
                ) : isLogin ? (
                  'Iniciar Sesión'
                ) : (
                  'Crear Cuenta'
                )}
              </button>
            </form>

            <div
              style={{
                marginTop: '25px',
                textAlign: 'center',
                color: '#a0aec0',
                fontSize: '14px',
                paddingTop: '15px',
                borderTop: '1px solid #4a5568',
              }}
            >
              <p style={{ margin: 0 }}>
                {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setSuccess('');
                  }}
                  disabled={isLoading}
                  style={{
                    background: 'none',
                    color: '#63b3ed',
                    border: 'none',
                    cursor: 'pointer',
                    marginLeft: '5px',
                    fontWeight: '600',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#4299e1')}
                  onMouseOut={(e) => (e.currentTarget.style.color = '#63b3ed')}
                >
                  {isLogin ? 'Registrarse' : 'Iniciar Sesión'}
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '30px',
            textAlign: 'center',
            color: '#a0aec0',
            fontSize: '0.8rem',
          }}
        >
          <p>© 2023 QHATU MARCA - Todos los derechos reservados</p>
        </div>
      </div>

      {/* Estilos responsivos */}
      <style>
        {`
          @media (max-width: 900px) {
            .login-container {
              flex-direction: column;
              max-width: 450px;
            }
            
            .image-section {
              min-height: 200px;
              border-right: none;
              border-bottom: 1px solid #4a5568;
            }
          }
          
          @media (max-width: 480px) {
            .login-container {
              border-radius: 12px;
            }
            
            .form-section {
              padding: 25px;
            }
            
            h1 {
              font-size: 2rem;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Login;