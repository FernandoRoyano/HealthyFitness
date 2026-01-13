import Cliente from '../models/Cliente.js';

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
