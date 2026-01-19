import Cliente from '../models/Cliente.js';
import User from '../models/User.js';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.join(__dirname, '../../uploads');

export const obtenerClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find()
      .populate('entrenador', 'nombre email')
      .sort({ createdAt: -1 });
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener clientes', error: error.message });
  }
};

export const obtenerClientePorId = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id)
      .populate('entrenador', 'nombre email');
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener cliente', error: error.message });
  }
};

export const crearCliente = async (req, res) => {
  try {
    const clienteExiste = await Cliente.findOne({ email: req.body.email });
    if (clienteExiste) {
      return res.status(400).json({ mensaje: 'El email ya está registrado' });
    }

    const cliente = await Cliente.create(req.body);
    res.status(201).json(cliente);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear cliente', error: error.message });
  }
};

export const actualizarCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    if (req.body.email && req.body.email !== cliente.email) {
      const emailExiste = await Cliente.findOne({ email: req.body.email });
      if (emailExiste) {
        return res.status(400).json({ mensaje: 'El email ya está registrado' });
      }
    }

    const clienteActualizado = await Cliente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('entrenador', 'nombre email');
    res.json(clienteActualizado);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al actualizar cliente', error: error.message });
  }
};

export const eliminarCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    await Cliente.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Cliente eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar cliente', error: error.message });
  }
};

// Configuración de Multer para manejar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV o Excel (.csv, .xls, .xlsx)'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
});

export const uploadMiddleware = upload.single('archivo');

// Función helper para parsear fechas en diferentes formatos
const parseFecha = (fechaStr) => {
  if (!fechaStr || fechaStr.trim() === '') return null;

  // Intentar diferentes formatos de fecha
  const formatos = [
    // dd/mm/yyyy
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // yyyy-mm-dd
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // dd-mm-yyyy
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/
  ];

  for (const formato of formatos) {
    const match = fechaStr.trim().match(formato);
    if (match) {
      if (formato.source.startsWith('^(\\d{4})')) {
        // yyyy-mm-dd
        return new Date(match[1], match[2] - 1, match[3]);
      } else {
        // dd/mm/yyyy o dd-mm-yyyy
        return new Date(match[3], match[2] - 1, match[1]);
      }
    }
  }

  // Intentar parsear directamente
  const fecha = new Date(fechaStr);
  return isNaN(fecha.getTime()) ? null : fecha;
};

// Función helper para mapear género
const mapearGenero = (generoStr) => {
  if (!generoStr) return 'otro';
  const genero = generoStr.toLowerCase().trim();
  if (genero.includes('masc') || genero === 'm' || genero === 'hombre') return 'masculino';
  if (genero.includes('fem') || genero === 'f' || genero === 'mujer') return 'femenino';
  return 'otro';
};

// Función helper para mapear nivel de actividad
const mapearNivelActividad = (nivelStr) => {
  if (!nivelStr) return 'sedentario';
  const nivel = nivelStr.toLowerCase().trim();
  if (nivel.includes('sedentario') || nivel.includes('ninguno')) return 'sedentario';
  if (nivel.includes('ligero') || nivel.includes('bajo')) return 'ligero';
  if (nivel.includes('moderado') || nivel.includes('medio')) return 'moderado';
  if (nivel.includes('activo') && !nivel.includes('muy')) return 'activo';
  if (nivel.includes('muy') || nivel.includes('alto')) return 'muy-activo';
  return 'sedentario';
};

// Función helper para parsear archivo Excel
const parseExcelFile = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  // Normalizar headers a minúsculas
  return data.map(row => {
    const normalizedRow = {};
    Object.keys(row).forEach(key => {
      normalizedRow[key.trim().toLowerCase()] = row[key];
    });
    return normalizedRow;
  });
};

// Función helper para parsear archivo CSV
const parseCSVFile = async (buffer) => {
  const results = [];
  const stream = Readable.from(buffer.toString('utf-8'));

  await new Promise((resolve, reject) => {
    stream
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim().toLowerCase(),
        skipEmptyLines: true
      }))
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  return results;
};

export const importarClientes = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: 'No se proporcionó ningún archivo' });
    }

    const { entrenadorId } = req.body;

    // Solo verificar entrenador si se proporcionó uno (es opcional)
    if (entrenadorId) {
      const entrenador = await User.findById(entrenadorId);
      if (!entrenador) {
        return res.status(404).json({ mensaje: 'Entrenador no encontrado' });
      }
    }

    const errors = [];
    const clientesImportados = [];

    // Determinar tipo de archivo y parsear
    const fileName = req.file.originalname.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    let results;
    if (isExcel) {
      results = parseExcelFile(req.file.buffer);
    } else {
      results = await parseCSVFile(req.file.buffer);
    }

    // Procesar cada fila
    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const lineNumber = i + 2; // +2 porque la primera línea es el header

      try {
        // Validar campos requeridos
        if (!row.nombre && !row.name) {
          errors.push({ linea: lineNumber, error: 'Falta el nombre' });
          continue;
        }
        if (!row.apellido && !row.lastname && !row.surname) {
          errors.push({ linea: lineNumber, error: 'Falta el apellido' });
          continue;
        }
        if (!row.email && !row.correo) {
          errors.push({ linea: lineNumber, error: 'Falta el email' });
          continue;
        }
        if (!row.telefono && !row.phone && !row.teléfono) {
          errors.push({ linea: lineNumber, error: 'Falta el teléfono' });
          continue;
        }

        // Verificar si el email ya existe
        const emailValue = (row.email || row.correo || '').toLowerCase().trim();
        const clienteExiste = await Cliente.findOne({ email: emailValue });
        if (clienteExiste) {
          errors.push({ linea: lineNumber, error: `El email ${emailValue} ya está registrado` });
          continue;
        }

        // Construir objeto cliente
        const clienteData = {
          nombre: (row.nombre || row.name || '').trim(),
          apellido: (row.apellido || row.lastname || row.surname || '').trim(),
          email: emailValue,
          telefono: (row.telefono || row.phone || row.teléfono || '').trim(),
          fechaNacimiento: parseFecha(row.fechanacimiento || row.fecha_nacimiento || row.birthdate || row.dateofbirth),
          genero: mapearGenero(row.genero || row.gender || row.sexo),
          direccion: (row.direccion || row.address || '').trim(),
          objetivos: (row.objetivos || row.goals || row.objetivo || '').trim(),
          condicionesMedicas: (row.condicionesmedicas || row.condiciones_medicas || row.medical_conditions || '').trim(),
          peso: parseFloat(row.peso || row.weight) || undefined,
          altura: parseFloat(row.altura || row.height) || undefined,
          nivelActividad: mapearNivelActividad(row.nivelactividad || row.nivel_actividad || row.activity_level),
          notas: (row.notas || row.notes || row.comentarios || '').trim(),
          entrenador: entrenadorId || undefined,
          activo: true
        };

        // Limpiar campos undefined
        Object.keys(clienteData).forEach(key => {
          if (clienteData[key] === undefined || clienteData[key] === '') {
            delete clienteData[key];
          }
        });

        // Crear cliente
        const cliente = await Cliente.create(clienteData);
        clientesImportados.push({
          nombre: cliente.nombre,
          apellido: cliente.apellido,
          email: cliente.email
        });

      } catch (error) {
        errors.push({
          linea: lineNumber,
          error: error.message || 'Error al procesar esta línea'
        });
      }
    }

    res.json({
      mensaje: `Importación completada. ${clientesImportados.length} clientes importados, ${errors.length} errores`,
      clientesImportados,
      errores: errors,
      total: results.length
    });

  } catch (error) {
    console.error('Error al importar clientes:', error);
    res.status(500).json({
      mensaje: 'Error al importar clientes',
      error: error.message
    });
  }
};

// Configuración de Multer para imágenes
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `cliente-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const imageUpload = multer({
  storage: imageStorage,
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
});

export const imageUploadMiddleware = imageUpload.single('foto');

export const subirFotoCliente = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: 'No se proporcionó ninguna imagen' });
    }

    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      // Eliminar archivo subido si el cliente no existe
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    // Si el cliente ya tiene una foto, eliminar la anterior
    if (cliente.foto) {
      const oldPhotoPath = path.join(uploadsPath, path.basename(cliente.foto));
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Guardar la URL de la nueva foto
    const fotoUrl = `/uploads/${req.file.filename}`;
    cliente.foto = fotoUrl;
    await cliente.save();

    res.json({
      mensaje: 'Foto subida correctamente',
      foto: fotoUrl
    });
  } catch (error) {
    console.error('Error al subir foto:', error);
    res.status(500).json({
      mensaje: 'Error al subir la foto',
      error: error.message
    });
  }
};

export const eliminarFotoCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    if (cliente.foto) {
      const photoPath = path.join(uploadsPath, path.basename(cliente.foto));
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
      cliente.foto = undefined;
      await cliente.save();
    }

    res.json({ mensaje: 'Foto eliminada correctamente' });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar la foto',
      error: error.message
    });
  }
};
