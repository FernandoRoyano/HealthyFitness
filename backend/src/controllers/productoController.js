import Producto from '../models/Producto.js';
import TarifaProducto from '../models/TarifaProducto.js';

// ==================== PRODUCTOS ====================

// Obtener todos los productos
export const obtenerProductos = async (req, res) => {
  try {
    const { activo } = req.query;
    const filtro = {};

    if (activo !== undefined) {
      filtro.activo = activo === 'true';
    }

    const productos = await Producto.find(filtro).sort({ tipo: 1 });
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ mensaje: 'Error al obtener productos' });
  }
};

// Obtener producto por ID con sus tarifas
export const obtenerProductoPorId = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    // Obtener tarifas asociadas
    const tarifas = await TarifaProducto.find({ producto: producto._id })
      .sort({ rangoDias: 1 });

    res.json({
      ...producto.toObject(),
      tarifas
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ mensaje: 'Error al obtener producto' });
  }
};

// Crear nuevo producto
export const crearProducto = async (req, res) => {
  try {
    const { nombre, tipo, descripcion, activo } = req.body;

    // Verificar si ya existe un producto con ese tipo
    const existente = await Producto.findOne({ tipo });
    if (existente) {
      return res.status(400).json({
        mensaje: `Ya existe un producto del tipo "${tipo}"`
      });
    }

    const producto = new Producto({
      nombre,
      tipo,
      descripcion,
      activo: activo !== undefined ? activo : true
    });

    await producto.save();
    res.status(201).json(producto);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ mensaje: 'Error al crear producto' });
  }
};

// Actualizar producto
export const actualizarProducto = async (req, res) => {
  try {
    const { nombre, descripcion, activo } = req.body;

    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    if (nombre) producto.nombre = nombre;
    if (descripcion !== undefined) producto.descripcion = descripcion;
    if (activo !== undefined) producto.activo = activo;

    await producto.save();
    res.json(producto);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ mensaje: 'Error al actualizar producto' });
  }
};

// Eliminar producto (y sus tarifas)
export const eliminarProducto = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    // Eliminar tarifas asociadas
    await TarifaProducto.deleteMany({ producto: producto._id });

    // Eliminar producto
    await Producto.findByIdAndDelete(req.params.id);

    res.json({ mensaje: 'Producto y tarifas eliminados correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ mensaje: 'Error al eliminar producto' });
  }
};

// ==================== TARIFAS ====================

// Obtener todas las tarifas de un producto
export const obtenerTarifasProducto = async (req, res) => {
  try {
    const tarifas = await TarifaProducto.find({ producto: req.params.id })
      .sort({ rangoDias: 1 });

    res.json(tarifas);
  } catch (error) {
    console.error('Error al obtener tarifas:', error);
    res.status(500).json({ mensaje: 'Error al obtener tarifas' });
  }
};

// Crear o actualizar tarifa
export const guardarTarifa = async (req, res) => {
  try {
    const { rangoDias, precio } = req.body;
    const productoId = req.params.id;

    // Verificar que el producto existe
    const producto = await Producto.findById(productoId);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    // Validar rango
    if (!['1', '2', '3+'].includes(rangoDias)) {
      return res.status(400).json({
        mensaje: 'Rango de días inválido. Usar: "1", "2" o "3+"'
      });
    }

    // Buscar tarifa existente o crear nueva
    let tarifa = await TarifaProducto.findOne({
      producto: productoId,
      rangoDias
    });

    if (tarifa) {
      // Actualizar precio existente
      tarifa.precio = precio;
      await tarifa.save();
    } else {
      // Crear nueva tarifa
      tarifa = new TarifaProducto({
        producto: productoId,
        rangoDias,
        precio
      });
      await tarifa.save();
    }

    res.json(tarifa);
  } catch (error) {
    console.error('Error al guardar tarifa:', error);
    res.status(500).json({ mensaje: 'Error al guardar tarifa' });
  }
};

// Guardar todas las tarifas de un producto de una vez
export const guardarTodasTarifas = async (req, res) => {
  try {
    const { tarifas } = req.body; // Array de { rangoDias, precio }
    const productoId = req.params.id;

    // Verificar que el producto existe
    const producto = await Producto.findById(productoId);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    const tarifasValidas = tarifas.filter(t => ['1', '2', '3+'].includes(t.rangoDias));

    const ops = tarifasValidas.map(({ rangoDias, precio }) => ({
      updateOne: {
        filter: { producto: productoId, rangoDias },
        update: { $set: { precio } },
        upsert: true
      }
    }));

    if (ops.length > 0) {
      await TarifaProducto.bulkWrite(ops);
    }

    const resultados = await TarifaProducto.find({ producto: productoId })
      .sort({ rangoDias: 1 });

    res.json(resultados);
  } catch (error) {
    console.error('Error al guardar tarifas:', error);
    res.status(500).json({ mensaje: 'Error al guardar tarifas' });
  }
};

// Eliminar tarifa
export const eliminarTarifa = async (req, res) => {
  try {
    const { tarifaId } = req.params;

    const tarifa = await TarifaProducto.findByIdAndDelete(tarifaId);

    if (!tarifa) {
      return res.status(404).json({ mensaje: 'Tarifa no encontrada' });
    }

    res.json({ mensaje: 'Tarifa eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar tarifa:', error);
    res.status(500).json({ mensaje: 'Error al eliminar tarifa' });
  }
};

// ==================== CONSULTA DE PRECIOS ====================

// Obtener precio por producto_id y días/semana
export const obtenerPrecio = async (req, res) => {
  try {
    const { producto_id, tipo, dias_semana } = req.query;

    if (!dias_semana) {
      return res.status(400).json({
        mensaje: 'Se requiere el parámetro dias_semana'
      });
    }

    const dias = parseInt(dias_semana);
    if (isNaN(dias) || dias < 1 || dias > 7) {
      return res.status(400).json({
        mensaje: 'dias_semana debe ser un número entre 1 y 7'
      });
    }

    let resultado;

    if (producto_id) {
      resultado = await TarifaProducto.obtenerPrecio(producto_id, dias);
    } else if (tipo) {
      resultado = await TarifaProducto.obtenerPrecioPorTipo(tipo, dias);
    } else {
      return res.status(400).json({
        mensaje: 'Se requiere producto_id o tipo'
      });
    }

    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener precio:', error);
    res.status(400).json({ mensaje: error.message });
  }
};

// Obtener tabla de precios completa (todos los productos con todas las tarifas)
export const obtenerTablaPreciosCompleta = async (req, res) => {
  try {
    const { soloActivos } = req.query;
    const filtroProducto = soloActivos === 'true' ? { activo: true } : {};

    const productos = await Producto.find(filtroProducto).sort({ tipo: 1 });
    const productoIds = productos.map(p => p._id);

    // Una sola query para todas las tarifas
    const todasTarifas = await TarifaProducto.find({ producto: { $in: productoIds } })
      .sort({ rangoDias: 1 });

    // Agrupar tarifas por producto
    const tarifasPorProducto = {};
    for (const tarifa of todasTarifas) {
      const pid = tarifa.producto.toString();
      if (!tarifasPorProducto[pid]) tarifasPorProducto[pid] = [];
      tarifasPorProducto[pid].push(tarifa);
    }

    const tablaPrecios = productos.map(producto => {
      const tarifas = tarifasPorProducto[producto._id.toString()] || [];
      const preciosPorRango = {};
      tarifas.forEach(t => {
        preciosPorRango[t.rangoDias] = t.precio;
      });

      return {
        _id: producto._id,
        nombre: producto.nombre,
        tipo: producto.tipo,
        descripcion: producto.descripcion,
        activo: producto.activo,
        precios: {
          '1': preciosPorRango['1'] || null,
          '2': preciosPorRango['2'] || null,
          '3+': preciosPorRango['3+'] || null
        },
        tarifas
      };
    });

    res.json(tablaPrecios);
  } catch (error) {
    console.error('Error al obtener tabla de precios:', error);
    res.status(500).json({ mensaje: 'Error al obtener tabla de precios' });
  }
};

// ==================== SEED / INICIALIZACIÓN ====================

// Inicializar productos y tarifas por defecto
export const inicializarProductos = async (req, res) => {
  try {
    // Verificar si ya hay productos
    const productosExistentes = await Producto.countDocuments();
    if (productosExistentes > 0) {
      return res.status(400).json({
        mensaje: 'Ya existen productos en la base de datos. Use esta función solo para inicialización.'
      });
    }

    // Datos de productos y tarifas por defecto
    const datosIniciales = [
      {
        nombre: 'Sesión Individual',
        tipo: 'individual',
        descripcion: 'Sesión de entrenamiento personal individual (60 min)',
        tarifas: { '1': 48, '2': 46, '3+': 43 }
      },
      {
        nombre: 'Sesión Individual Express',
        tipo: 'individual_express',
        descripcion: 'Sesión de entrenamiento personal individual reducida (30 min)',
        tarifas: { '1': 28, '2': 27, '3+': 25 }
      },
      {
        nombre: 'Sesión en Pareja',
        tipo: 'pareja',
        descripcion: 'Sesión de entrenamiento para dos personas (60 min)',
        tarifas: { '1': 72, '2': 68, '3+': 64 }
      },
      {
        nombre: 'Sesión en Pareja Express',
        tipo: 'pareja_express',
        descripcion: 'Sesión de entrenamiento para dos personas reducida (30 min)',
        tarifas: { '1': 39, '2': 37, '3+': 35 }
      }
    ];

    const productosCreados = [];

    for (const datos of datosIniciales) {
      // Crear producto
      const producto = new Producto({
        nombre: datos.nombre,
        tipo: datos.tipo,
        descripcion: datos.descripcion,
        activo: true
      });
      await producto.save();

      // Crear tarifas
      for (const [rango, precio] of Object.entries(datos.tarifas)) {
        const tarifa = new TarifaProducto({
          producto: producto._id,
          rangoDias: rango,
          precio
        });
        await tarifa.save();
      }

      productosCreados.push(producto);
    }

    res.status(201).json({
      mensaje: 'Productos y tarifas inicializados correctamente',
      productos: productosCreados
    });
  } catch (error) {
    console.error('Error al inicializar productos:', error);
    res.status(500).json({ mensaje: 'Error al inicializar productos' });
  }
};
