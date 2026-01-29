import mongoose from 'mongoose';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async () => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      console.log(`MongoDB conectado: ${conn.connection.host}`);

      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB desconectado. Mongoose intentará reconectar automáticamente.');
      });

      mongoose.connection.on('error', (err) => {
        console.error(`Error de MongoDB: ${err.message}`);
      });

      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconectado.');
      });

      return conn;
    } catch (error) {
      console.error(`Intento ${attempt}/${MAX_RETRIES} - Error de conexión: ${error.message}`);
      if (attempt === MAX_RETRIES) {
        console.error('No se pudo conectar a MongoDB tras varios intentos.');
        process.exit(1);
      }
      console.log(`Reintentando en ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

export default connectDB;
