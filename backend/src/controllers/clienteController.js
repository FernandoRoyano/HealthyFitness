import Cliente from '../models/Cliente.js';
import User from '../models/User.js';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';

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
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
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

export const importarClientes = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: 'No se proporcionó ningún archivo' });
    }

    const { entrenadorId } = req.body;

    if (!entrenadorId) {
      return res.status(400).json({ mensaje: 'Debe especificar un entrenador para asignar los clientes' });
    }

    // Verificar que el entrenador existe
    const entrenador = await User.findById(entrenadorId);
    if (!entrenador) {
      return res.status(404).json({ mensaje: 'Entrenador no encontrado' });
    }

    const results = [];
    const errors = [];
    const clientesImportados = [];

    // Convertir buffer a stream
    const stream = Readable.from(req.file.buffer.toString('utf-8'));

    // Procesar CSV
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
          entrenador: entrenadorId,
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
