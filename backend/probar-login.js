import https from 'https';
import http from 'http';

const probarLogin = async () => {
  const data = JSON.stringify({
    email: 'fernandoroyano.dev@gmail.com',
    password: '123456'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  console.log('🔐 Probando login...\n');
  console.log('URL: http://localhost:5000/api/auth/login');
  console.log('Email: fernandoroyano.dev@gmail.com');
  console.log('Password: 123456\n');

  const req = http.request(options, (res) => {
    let body = '';

    res.on('data', (chunk) => {
      body += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ LOGIN EXITOSO!\n');
        const response = JSON.parse(body);
        console.log('Token generado correctamente');
        console.log('Nombre:', response.nombre);
        console.log('Email:', response.email);
        console.log('Rol:', response.rol);
      } else {
        console.log('❌ ERROR AL HACER LOGIN\n');
        console.log('Status:', res.statusCode);
        console.log('Respuesta:', body);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ ERROR DE CONEXIÓN\n');
    console.error('¿Está el servidor corriendo en http://localhost:5000?');
    console.error('Error:', error.message);
  });

  req.write(data);
  req.end();
};

probarLogin();
