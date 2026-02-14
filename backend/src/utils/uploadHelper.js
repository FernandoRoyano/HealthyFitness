import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.join(__dirname, '../../uploads');

// Crear directorio de uploads si no existe
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

/**
 * Crea un middleware de multer para subir imágenes con un prefijo dado.
 * @param {string} prefix - Prefijo para el nombre del archivo (ej: 'cliente', 'user')
 */
export const createImageUpload = (prefix) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(uploadsPath)) {
        fs.mkdirSync(uploadsPath, { recursive: true });
      }
      cb(null, uploadsPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });

  return multer({
    storage,
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten imágenes (JPEG, PNG, WebP)'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB máximo
    }
  }).single('foto');
};

/**
 * Elimina un archivo de foto anterior si existe.
 * @param {string} fotoUrl - URL relativa de la foto (ej: /uploads/cliente-123.jpg)
 */
export const eliminarFotoAnterior = (fotoUrl) => {
  if (!fotoUrl) return;
  const photoPath = path.join(uploadsPath, path.basename(fotoUrl));
  if (fs.existsSync(photoPath)) {
    fs.unlinkSync(photoPath);
  }
};

export { uploadsPath };
