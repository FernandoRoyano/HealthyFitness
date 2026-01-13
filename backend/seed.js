import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';
import Cliente from './src/models/Cliente.js';
import Reserva from './src/models/Reserva.js';

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Limpiar datos existentes
    await User.deleteMany({});
    await Cliente.deleteMany({});
    await Reserva.deleteMany({});
    console.log('Base de datos limpiada');

    // Crear gerente
    const gerente = await User.create({
      nombre: 'Carlos Gerente',
      email: 'gerente@gym.com',
      password: '123456',
      rol: 'gerente',
      telefono: '+34 600 000 001'
    });
    console.log('Gerente creado');

    // Crear 6 entrenadores
    const entrenadores = [];
    const nombresEntrenadores = [
      'Juan Pérez',
      'María García',
      'Pedro López',
      'Ana Martínez',
      'Luis Rodríguez',
      'Carmen Fernández'
    ];

    for (let i = 0; i < 6; i++) {
      const entrenador = await User.create({
        nombre: nombresEntrenadores[i],
        email: `entrenador${i + 1}@gym.com`,
        password: '123456',
        rol: 'entrenador',
        telefono: `+34 600 000 ${(i + 2).toString().padStart(3, '0')}`
      });
      entrenadores.push(entrenador);
    }
    console.log('6 entrenadores creados');

    // Crear clientes
    const clientes = [];
    const nombresClientes = [
      { nombre: 'Roberto', apellido: 'Santos', genero: 'masculino' },
      { nombre: 'Laura', apellido: 'Torres', genero: 'femenino' },
      { nombre: 'Miguel', apellido: 'Ruiz', genero: 'masculino' },
      { nombre: 'Elena', apellido: 'Jiménez', genero: 'femenino' },
      { nombre: 'David', apellido: 'Moreno', genero: 'masculino' },
      { nombre: 'Sara', apellido: 'Álvarez', genero: 'femenino' },
      { nombre: 'Javier', apellido: 'Romero', genero: 'masculino' },
      { nombre: 'Paula', apellido: 'Navarro', genero: 'femenino' },
      { nombre: 'Alberto', apellido: 'Vega', genero: 'masculino' },
      { nombre: 'Isabel', apellido: 'Ramos', genero: 'femenino' },
      { nombre: 'Fernando', apellido: 'Gil', genero: 'masculino' },
      { nombre: 'Cristina', apellido: 'Ortiz', genero: 'femenino' }
    ];

    for (let i = 0; i < nombresClientes.length; i++) {
      const { nombre, apellido, genero } = nombresClientes[i];
      const cliente = await Cliente.create({
        nombre,
        apellido,
        email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}@email.com`,
        telefono: `+34 700 000 ${(i + 1).toString().padStart(3, '0')}`,
        fechaNacimiento: new Date(1985 + i, i % 12, (i * 3) % 28 + 1),
        genero,
        objetivos: 'Mejorar condición física general',
        peso: 65 + (i * 3) % 30,
        altura: 160 + (i * 2) % 25,
        nivelActividad: ['sedentario', 'ligero', 'moderado', 'activo'][i % 4]
      });
      clientes.push(cliente);
    }
    console.log(`${clientes.length} clientes creados`);

    // Crear reservas para esta semana
    const hoy = new Date();
    const lunes = new Date(hoy);
    const dia = lunes.getDay();
    const diff = lunes.getDate() - dia + (dia === 0 ? -6 : 1);
    lunes.setDate(diff);

    const horarios = ['09:00', '10:00', '11:00', '12:00', '16:00', '17:00', '18:00', '19:00'];
    const reservasCreadas = [];

    // Crear algunas reservas aleatorias para cada entrenador durante la semana
    for (const entrenador of entrenadores) {
      const numReservas = 8 + Math.floor(Math.random() * 5); // 8-12 reservas por entrenador

      for (let i = 0; i < numReservas; i++) {
        const diaOffset = Math.floor(Math.random() * 5); // Lunes a Viernes
        const fechaReserva = new Date(lunes);
        fechaReserva.setDate(lunes.getDate() + diaOffset);

        const horaIndex = Math.floor(Math.random() * horarios.length);
        const horaInicio = horarios[horaIndex];
        const horaFin = `${parseInt(horaInicio.split(':')[0]) + 1}:00`;

        const clienteAleatorio = clientes[Math.floor(Math.random() * clientes.length)];

        // Verificar si ya existe una reserva en ese horario
        const reservaExiste = reservasCreadas.some(r =>
          r.entrenador.toString() === entrenador._id.toString() &&
          r.fecha.toDateString() === fechaReserva.toDateString() &&
          r.horaInicio === horaInicio
        );

        if (!reservaExiste) {
          const reserva = await Reserva.create({
            cliente: clienteAleatorio._id,
            entrenador: entrenador._id,
            fecha: fechaReserva,
            horaInicio,
            horaFin,
            tipoSesion: ['personal', 'grupal', 'evaluacion'][Math.floor(Math.random() * 3)],
            estado: 'confirmada',
            duracion: 60
          });
          reservasCreadas.push(reserva);
        }
      }
    }
    console.log(`${reservasCreadas.length} reservas creadas`);

    console.log('\n=== Datos de Prueba ===');
    console.log(`\nGerente:`);
    console.log(`  Email: gerente@gym.com`);
    console.log(`  Password: 123456`);
    console.log(`\nEntrenadores (todos con password: 123456):`);
    entrenadores.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.nombre} - ${e.email}`);
    });

    mongoose.connection.close();
    console.log('\n¡Datos de prueba creados exitosamente!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedDB();
