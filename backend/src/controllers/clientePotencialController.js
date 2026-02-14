import ClientePotencial from '../models/ClientePotencial.js';
import Cliente from '../models/Cliente.js';

// Obtener todos los clientes potenciales
export const obtenerTodos = async (req, res) => {
  try {
    const { estado, buscar } = req.query;
    const filtro = {};

    if (estado && estado !== 'todos') {
      filtro.estado = estado;
    }

    if (buscar) {
      // Escapar caracteres especiales de regex para prevenir ReDoS
      const buscarSafe = buscar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filtro.$or = [
        { nombre: { $regex: buscarSafe, $options: 'i' } },
        { telefono: { $regex: buscarSafe, $options: 'i' } },
        { email: { $regex: buscarSafe, $options: 'i' } },
        { busca: { $regex: buscarSafe, $options: 'i' } }
      ];
    }

    const leads = await ClientePotencial.find(filtro)
      .populate('creadoPor', 'nombre')
      .populate('clienteConvertido', 'nombre apellido')
      .sort({ createdAt: -1 });

    res.json(leads);
  } catch (error) {
    console.error('Error al obtener clientes potenciales:', error);
    res.status(500).json({ mensaje: 'Error al obtener clientes potenciales' });
  }
};

// Obtener uno por ID
export const obtenerPorId = async (req, res) => {
  try {
    const lead = await ClientePotencial.findById(req.params.id)
      .populate('creadoPor', 'nombre')
      .populate('clienteConvertido', 'nombre apellido');

    if (!lead) {
      return res.status(404).json({ mensaje: 'Cliente potencial no encontrado' });
    }

    res.json(lead);
  } catch (error) {
    console.error('Error al obtener cliente potencial:', error);
    res.status(500).json({ mensaje: 'Error al obtener cliente potencial' });
  }
};

// Crear nuevo
export const crear = async (req, res) => {
  try {
    const { nombre, email, telefono, busca, notas } = req.body;

    const lead = new ClientePotencial({
      nombre,
      email,
      telefono,
      busca,
      notas,
      estado: 'pendiente',
      creadoPor: req.usuario._id
    });

    await lead.save();

    const leadPopulado = await ClientePotencial.findById(lead._id)
      .populate('creadoPor', 'nombre');

    res.status(201).json(leadPopulado);
  } catch (error) {
    console.error('Error al crear cliente potencial:', error);
    res.status(500).json({ mensaje: 'Error al crear cliente potencial' });
  }
};

// Actualizar
export const actualizar = async (req, res) => {
  try {
    const { nombre, email, telefono, busca, estado, notas, fechaUltimoContacto } = req.body;

    const lead = await ClientePotencial.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ mensaje: 'Cliente potencial no encontrado' });
    }

    // Actualizar campos
    if (nombre !== undefined) lead.nombre = nombre;
    if (email !== undefined) lead.email = email;
    if (telefono !== undefined) lead.telefono = telefono;
    if (busca !== undefined) lead.busca = busca;
    if (estado !== undefined) lead.estado = estado;
    if (notas !== undefined) lead.notas = notas;
    if (fechaUltimoContacto !== undefined) lead.fechaUltimoContacto = fechaUltimoContacto;

    await lead.save();

    const leadPopulado = await ClientePotencial.findById(lead._id)
      .populate('creadoPor', 'nombre')
      .populate('clienteConvertido', 'nombre apellido');

    res.json(leadPopulado);
  } catch (error) {
    console.error('Error al actualizar cliente potencial:', error);
    res.status(500).json({ mensaje: 'Error al actualizar cliente potencial' });
  }
};

// Cambiar solo estado
export const cambiarEstado = async (req, res) => {
  try {
    const { estado } = req.body;

    if (!['pendiente', 'contactado', 'interesado', 'apuntado', 'no_interesado'].includes(estado)) {
      return res.status(400).json({ mensaje: 'Estado no válido' });
    }

    const lead = await ClientePotencial.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ mensaje: 'Cliente potencial no encontrado' });
    }

    lead.estado = estado;

    // Si se marca como contactado, actualizar fecha de último contacto
    if (estado === 'contactado' || estado === 'interesado') {
      lead.fechaUltimoContacto = new Date();
    }

    await lead.save();

    const leadPopulado = await ClientePotencial.findById(lead._id)
      .populate('creadoPor', 'nombre')
      .populate('clienteConvertido', 'nombre apellido');

    res.json(leadPopulado);
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ mensaje: 'Error al cambiar estado' });
  }
};

// Eliminar
export const eliminar = async (req, res) => {
  try {
    const lead = await ClientePotencial.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ mensaje: 'Cliente potencial no encontrado' });
    }

    await ClientePotencial.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Cliente potencial eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar cliente potencial:', error);
    res.status(500).json({ mensaje: 'Error al eliminar cliente potencial' });
  }
};

// Convertir a cliente
export const convertirACliente = async (req, res) => {
  try {
    const lead = await ClientePotencial.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ mensaje: 'Cliente potencial no encontrado' });
    }

    if (lead.clienteConvertido) {
      return res.status(400).json({ mensaje: 'Este lead ya fue convertido a cliente' });
    }

    // Datos adicionales del body (entrenador, etc.)
    const { entrenador, ...datosAdicionales } = req.body;

    // Separar nombre en nombre y apellido si es posible
    const partes = lead.nombre.trim().split(' ');
    const nombre = partes[0] || lead.nombre;
    const apellido = partes.slice(1).join(' ') || '';

    // Crear el cliente
    const cliente = new Cliente({
      nombre,
      apellido,
      email: lead.email || '',
      telefono: lead.telefono,
      entrenador: entrenador || null,
      notas: `Convertido desde lead. Buscaba: ${lead.busca}${lead.notas ? `. Notas: ${lead.notas}` : ''}`,
      activo: true,
      ...datosAdicionales
    });

    await cliente.save();

    // Actualizar el lead
    lead.estado = 'apuntado';
    lead.clienteConvertido = cliente._id;
    await lead.save();

    const leadPopulado = await ClientePotencial.findById(lead._id)
      .populate('creadoPor', 'nombre')
      .populate('clienteConvertido', 'nombre apellido');

    res.json({
      mensaje: 'Lead convertido a cliente correctamente',
      lead: leadPopulado,
      cliente
    });
  } catch (error) {
    console.error('Error al convertir a cliente:', error);
    res.status(500).json({ mensaje: 'Error al convertir a cliente' });
  }
};

// Obtener estadísticas
export const obtenerEstadisticas = async (req, res) => {
  try {
    const stats = await ClientePotencial.obtenerEstadisticas();
    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ mensaje: 'Error al obtener estadísticas' });
  }
};
