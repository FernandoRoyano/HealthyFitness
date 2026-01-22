import FacturaMensual from '../models/FacturaMensual.js';
import SuscripcionCliente from '../models/SuscripcionCliente.js';
import Asistencia from '../models/Asistencia.js';
import Cliente from '../models/Cliente.js';
import Producto from '../models/Producto.js';
import TarifaProducto from '../models/TarifaProducto.js';
import { generarPDFFactura } from '../services/pdfService.js';
import { enviarFacturaPorEmail, verificarConfiguracionEmail } from '../services/emailService.js';

// ==================== SUSCRIPCIONES ====================

// Obtener todas las suscripciones
export const obtenerSuscripciones = async (req, res) => {
  try {
    const { estado, entrenador } = req.query;
    const filtro = {};

    if (estado) filtro.estado = estado;

    let suscripciones = await SuscripcionCliente.find(filtro)
      .populate('cliente', 'nombre apellido email telefono entrenador activo')
      .populate('producto', 'nombre tipo')
      .populate('creadoPor', 'nombre')
      .sort({ createdAt: -1 });

    // Filtrar por entrenador si se especifica
    if (entrenador) {
      suscripciones = suscripciones.filter(s =>
        s.cliente?.entrenador?.toString() === entrenador
      );
    }

    // Si es entrenador, solo mostrar sus clientes
    if (req.usuario.rol === 'entrenador') {
      suscripciones = suscripciones.filter(s =>
        s.cliente?.entrenador?.toString() === req.usuario._id.toString()
      );
    }

    res.json(suscripciones);
  } catch (error) {
    console.error('Error al obtener suscripciones:', error);
    res.status(500).json({ mensaje: 'Error al obtener suscripciones' });
  }
};

// Obtener suscripción por cliente
export const obtenerSuscripcionPorCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;

    const suscripcion = await SuscripcionCliente.findOne({ cliente: clienteId })
      .populate('cliente', 'nombre apellido email entrenador')
      .populate('producto', 'nombre tipo descripcion');

    if (!suscripcion) {
      return res.status(404).json({ mensaje: 'El cliente no tiene suscripción', existe: false });
    }

    res.json({ ...suscripcion.toObject(), existe: true });
  } catch (error) {
    console.error('Error al obtener suscripción:', error);
    res.status(500).json({ mensaje: 'Error al obtener suscripción' });
  }
};

// Crear o actualizar suscripción
export const guardarSuscripcion = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { productoId, diasPorSemana, diasEntrenamiento, fechaInicio, notas } = req.body;

    // Validar cliente existe
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    // Validar producto existe
    const producto = await Producto.findById(productoId);
    if (!producto || !producto.activo) {
      return res.status(400).json({ mensaje: 'Producto no válido o inactivo' });
    }

    // Obtener precio según días por semana
    const precioInfo = await TarifaProducto.obtenerPrecio(productoId, diasPorSemana);
    if (!precioInfo) {
      return res.status(400).json({ mensaje: 'No se encontró tarifa para este producto' });
    }

    // Buscar suscripción existente
    let suscripcion = await SuscripcionCliente.findOne({ cliente: clienteId });

    if (suscripcion) {
      // Actualizar existente
      suscripcion.producto = productoId;
      suscripcion.diasPorSemana = diasPorSemana;
      suscripcion.diasEntrenamiento = diasEntrenamiento || [];
      suscripcion.precioUnitarioFijado = precioInfo.precio;
      suscripcion.rangoTarifaAplicado = precioInfo.rango_aplicado;
      suscripcion.estado = 'activa';
      if (notas !== undefined) suscripcion.notas = notas;
      suscripcion.actualizadoPor = req.usuario._id;
    } else {
      // Crear nueva
      suscripcion = new SuscripcionCliente({
        cliente: clienteId,
        producto: productoId,
        diasPorSemana,
        diasEntrenamiento: diasEntrenamiento || [],
        fechaInicio: fechaInicio || new Date(),
        precioUnitarioFijado: precioInfo.precio,
        rangoTarifaAplicado: precioInfo.rango_aplicado,
        notas,
        creadoPor: req.usuario._id
      });
    }

    await suscripcion.save();

    const suscripcionPopulada = await SuscripcionCliente.findById(suscripcion._id)
      .populate('cliente', 'nombre apellido')
      .populate('producto', 'nombre tipo');

    res.json(suscripcionPopulada);
  } catch (error) {
    console.error('Error al guardar suscripción:', error);
    res.status(500).json({ mensaje: error.message || 'Error al guardar suscripción' });
  }
};

// Pausar/Reactivar/Cancelar suscripción
export const cambiarEstadoSuscripcion = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { estado } = req.body;

    if (!['activa', 'pausada', 'cancelada'].includes(estado)) {
      return res.status(400).json({ mensaje: 'Estado no válido' });
    }

    const suscripcion = await SuscripcionCliente.findOne({ cliente: clienteId });
    if (!suscripcion) {
      return res.status(404).json({ mensaje: 'Suscripción no encontrada' });
    }

    suscripcion.estado = estado;
    suscripcion.actualizadoPor = req.usuario._id;

    if (estado === 'cancelada') {
      suscripcion.fechaFin = new Date();
    }

    await suscripcion.save();

    res.json({ mensaje: `Suscripción ${estado}`, suscripcion });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ mensaje: 'Error al cambiar estado' });
  }
};

// ==================== ASISTENCIAS ====================

// Registrar asistencia
export const registrarAsistencia = async (req, res) => {
  try {
    const { reservaId, clienteId, entrenadorId, fecha, horaInicio, estado, tipoSesion, notas } = req.body;

    if (!clienteId || !fecha || !horaInicio || !estado) {
      return res.status(400).json({ mensaje: 'Faltan campos requeridos' });
    }

    const fechaObj = new Date(fecha);
    fechaObj.setHours(0, 0, 0, 0);

    // Verificar si ya existe registro para esta sesión
    let asistencia = await Asistencia.findOne({
      cliente: clienteId,
      fecha: fechaObj,
      horaInicio
    });

    if (asistencia) {
      // Actualizar existente
      asistencia.estado = estado;
      if (notas !== undefined) asistencia.notas = notas;
      asistencia.registradoPor = req.usuario._id;
    } else {
      // Crear nuevo
      asistencia = new Asistencia({
        reserva: reservaId || null,
        cliente: clienteId,
        entrenador: entrenadorId || req.usuario._id,
        fecha: fechaObj,
        horaInicio,
        estado,
        tipoSesion: tipoSesion || 'personal',
        notas,
        registradoPor: req.usuario._id
      });
    }

    await asistencia.save();

    const asistenciaPopulada = await Asistencia.findById(asistencia._id)
      .populate('cliente', 'nombre apellido')
      .populate('entrenador', 'nombre');

    res.json(asistenciaPopulada);
  } catch (error) {
    console.error('Error al registrar asistencia:', error);
    res.status(500).json({ mensaje: error.message || 'Error al registrar asistencia' });
  }
};

// Obtener asistencias de un cliente en un mes
export const obtenerAsistenciasMes = async (req, res) => {
  try {
    const { clienteId, mes, anio } = req.params;

    const asistencias = await Asistencia.find({
      cliente: clienteId,
      mes: parseInt(mes),
      anio: parseInt(anio)
    })
      .populate('reserva')
      .populate('entrenador', 'nombre')
      .populate('recuperacion.reservaRecuperacion')
      .sort({ fecha: 1 });

    const resumen = await Asistencia.obtenerResumenMensual(
      clienteId,
      parseInt(mes),
      parseInt(anio)
    );

    const resumenRecuperacion = await Asistencia.contarPorRecuperacion(
      clienteId,
      parseInt(mes),
      parseInt(anio)
    );

    res.json({ asistencias, resumen, resumenRecuperacion });
  } catch (error) {
    console.error('Error al obtener asistencias:', error);
    res.status(500).json({ mensaje: 'Error al obtener asistencias' });
  }
};

// Marcar sesión como recuperada o acumulada
export const marcarRecuperacion = async (req, res) => {
  try {
    const { asistenciaId } = req.params;
    const { accion, reservaRecuperacionId } = req.body; // accion: 'recuperar' o 'acumular'

    const asistencia = await Asistencia.findById(asistenciaId);
    if (!asistencia) {
      return res.status(404).json({ mensaje: 'Asistencia no encontrada' });
    }

    if (asistencia.estado !== 'no_asistio') {
      return res.status(400).json({ mensaje: 'Solo se pueden gestionar inasistencias' });
    }

    if (asistencia.recuperacion?.estado !== 'pendiente') {
      return res.status(400).json({ mensaje: 'Esta sesión ya fue gestionada' });
    }

    if (accion === 'acumular') {
      // Acumular para el siguiente mes
      const siguienteMes = asistencia.mes === 12 ? 1 : asistencia.mes + 1;
      const siguienteAnio = asistencia.mes === 12 ? asistencia.anio + 1 : asistencia.anio;

      asistencia.recuperacion.estado = 'acumulada';
      asistencia.recuperacion.acumuladaParaMes = siguienteMes;
      asistencia.recuperacion.acumuladaParaAnio = siguienteAnio;

      // Actualizar contador en suscripción
      await SuscripcionCliente.findOneAndUpdate(
        { cliente: asistencia.cliente },
        { $inc: { sesionesAcumuladas: 1 } }
      );
    } else if (accion === 'recuperar') {
      // Programar recuperación
      if (!reservaRecuperacionId) {
        return res.status(400).json({ mensaje: 'Se requiere la reserva de recuperación' });
      }
      asistencia.recuperacion.estado = 'programada';
      asistencia.recuperacion.reservaRecuperacion = reservaRecuperacionId;
    } else if (accion === 'completar') {
      // Marcar como recuperación completada
      asistencia.recuperacion.estado = 'completada';
    } else {
      return res.status(400).json({ mensaje: 'Acción no válida' });
    }

    await asistencia.save();

    res.json(asistencia);
  } catch (error) {
    console.error('Error al marcar recuperación:', error);
    res.status(500).json({ mensaje: 'Error al marcar recuperación' });
  }
};

// Obtener inasistencias pendientes de recuperar
export const obtenerInasistenciasPendientes = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { mes, anio } = req.query;

    const inasistencias = await Asistencia.obtenerInasistenciasPendientes(
      clienteId,
      mes ? parseInt(mes) : null,
      anio ? parseInt(anio) : null
    );

    res.json(inasistencias);
  } catch (error) {
    console.error('Error al obtener inasistencias:', error);
    res.status(500).json({ mensaje: 'Error al obtener inasistencias' });
  }
};

// ==================== FACTURAS ====================

// Generar factura para un cliente
export const generarFactura = async (req, res) => {
  try {
    const { clienteId, mes, anio } = req.body;

    if (!clienteId || !mes || !anio) {
      return res.status(400).json({ mensaje: 'Faltan campos requeridos' });
    }

    const factura = await FacturaMensual.generarFactura(
      clienteId,
      parseInt(mes),
      parseInt(anio),
      req.usuario._id
    );

    await factura.save();

    // Actualizar sesiones acumuladas en la suscripción
    if (factura.sesionesAcumuladasSiguiente > 0) {
      await SuscripcionCliente.findOneAndUpdate(
        { cliente: clienteId },
        { sesionesAcumuladas: factura.sesionesAcumuladasSiguiente }
      );
    } else {
      // Resetear acumuladas si ya se usaron
      await SuscripcionCliente.findOneAndUpdate(
        { cliente: clienteId },
        { sesionesAcumuladas: 0 }
      );
    }

    const facturaPopulada = await FacturaMensual.findById(factura._id)
      .populate('cliente', 'nombre apellido email telefono numeroCuenta')
      .populate('generadaPor', 'nombre');

    res.status(201).json(facturaPopulada);
  } catch (error) {
    console.error('Error al generar factura:', error);
    res.status(400).json({ mensaje: error.message });
  }
};

// Generar facturas masivas (todos los clientes activos)
export const generarFacturasMasivas = async (req, res) => {
  try {
    const { mes, anio } = req.body;

    if (!mes || !anio) {
      return res.status(400).json({ mensaje: 'Mes y año son requeridos' });
    }

    // Obtener todas las suscripciones activas
    const suscripciones = await SuscripcionCliente.find({ estado: 'activa' })
      .populate('cliente', 'nombre apellido activo');

    const resultados = {
      exitosas: [],
      errores: [],
      omitidas: []
    };

    for (const suscripcion of suscripciones) {
      // Solo clientes activos
      if (!suscripcion.cliente?.activo) {
        resultados.omitidas.push({
          cliente: suscripcion.cliente ? `${suscripcion.cliente.nombre} ${suscripcion.cliente.apellido}` : 'Desconocido',
          motivo: 'Cliente inactivo'
        });
        continue;
      }

      try {
        // Verificar si ya existe factura
        const existe = await FacturaMensual.findOne({
          cliente: suscripcion.cliente._id,
          mes: parseInt(mes),
          anio: parseInt(anio)
        });

        if (existe) {
          resultados.omitidas.push({
            cliente: `${suscripcion.cliente.nombre} ${suscripcion.cliente.apellido}`,
            motivo: 'Ya existe factura'
          });
          continue;
        }

        const factura = await FacturaMensual.generarFactura(
          suscripcion.cliente._id,
          parseInt(mes),
          parseInt(anio),
          req.usuario._id
        );

        await factura.save();

        // Actualizar sesiones acumuladas
        await SuscripcionCliente.findByIdAndUpdate(
          suscripcion._id,
          { sesionesAcumuladas: factura.sesionesAcumuladasSiguiente || 0 }
        );

        resultados.exitosas.push({
          cliente: `${suscripcion.cliente.nombre} ${suscripcion.cliente.apellido}`,
          total: factura.totalAPagar,
          sesiones: factura.totalSesionesACobrar
        });
      } catch (err) {
        resultados.errores.push({
          cliente: `${suscripcion.cliente.nombre} ${suscripcion.cliente.apellido}`,
          error: err.message
        });
      }
    }

    res.json({
      mensaje: `Proceso completado. ${resultados.exitosas.length} facturas generadas.`,
      ...resultados
    });
  } catch (error) {
    console.error('Error en generación masiva:', error);
    res.status(500).json({ mensaje: 'Error al generar facturas' });
  }
};

// Obtener facturas con filtros
export const obtenerFacturas = async (req, res) => {
  try {
    const { mes, anio, estado, clienteId, entrenadorId } = req.query;
    const filtro = {};

    if (mes) filtro.mes = parseInt(mes);
    if (anio) filtro.anio = parseInt(anio);
    if (estado) filtro.estado = estado;
    if (clienteId) filtro.cliente = clienteId;

    let facturas = await FacturaMensual.find(filtro)
      .populate('cliente', 'nombre apellido email telefono numeroCuenta entrenador')
      .populate('generadaPor', 'nombre')
      .sort({ fechaGeneracion: -1 });

    // Filtrar por entrenador si se especifica
    if (entrenadorId) {
      facturas = facturas.filter(f =>
        f.cliente?.entrenador?.toString() === entrenadorId
      );
    }

    // Si es entrenador, solo mostrar facturas de sus clientes
    if (req.usuario.rol === 'entrenador') {
      facturas = facturas.filter(f =>
        f.cliente?.entrenador?.toString() === req.usuario._id.toString()
      );
    }

    res.json(facturas);
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({ mensaje: 'Error al obtener facturas' });
  }
};

// Obtener factura por ID con detalles completos
export const obtenerFacturaPorId = async (req, res) => {
  try {
    const factura = await FacturaMensual.findById(req.params.id)
      .populate('cliente', 'nombre apellido email telefono direccion numeroCuenta')
      .populate('suscripcion')
      .populate('generadaPor', 'nombre')
      .populate('modificadaPor', 'nombre')
      .populate('pagos.registradoPor', 'nombre');

    if (!factura) {
      return res.status(404).json({ mensaje: 'Factura no encontrada' });
    }

    res.json(factura);
  } catch (error) {
    console.error('Error al obtener factura:', error);
    res.status(500).json({ mensaje: 'Error al obtener factura' });
  }
};

// Actualizar factura (ajustes manuales)
export const actualizarFactura = async (req, res) => {
  try {
    const {
      descuentos,
      notasInternas,
      notasCliente,
      sesionesAcumuladasSiguiente,
      totalSesionesACobrar,
      subtotal,
      totalDescuentos,
      totalAPagar,
      diasAsistencia
    } = req.body;

    const factura = await FacturaMensual.findById(req.params.id);
    if (!factura) {
      return res.status(404).json({ mensaje: 'Factura no encontrada' });
    }

    if (factura.estado === 'pagada' || factura.estado === 'anulada') {
      return res.status(400).json({ mensaje: 'No se puede modificar una factura pagada o anulada' });
    }

    // Campos originales
    if (descuentos !== undefined) factura.descuentos = descuentos;
    if (notasInternas !== undefined) factura.notasInternas = notasInternas;
    if (notasCliente !== undefined) factura.notasCliente = notasCliente;
    if (sesionesAcumuladasSiguiente !== undefined) {
      factura.sesionesAcumuladasSiguiente = sesionesAcumuladasSiguiente;
    }

    // Campos nuevos para edición manual
    if (totalSesionesACobrar !== undefined) {
      factura.totalSesionesACobrar = totalSesionesACobrar;
      factura.sesionesProgramadas = totalSesionesACobrar;
      factura.sesionesAsistidas = totalSesionesACobrar;
    }
    if (subtotal !== undefined) factura.subtotal = subtotal;
    if (totalDescuentos !== undefined) factura.totalDescuentos = totalDescuentos;
    if (totalAPagar !== undefined) factura.totalAPagar = totalAPagar;
    if (diasAsistencia !== undefined) factura.diasAsistencia = diasAsistencia;

    // Actualizar precio unitario si viene en el body
    if (req.body['datosSuscripcion.precioUnitario'] !== undefined) {
      if (!factura.datosSuscripcion) {
        factura.datosSuscripcion = {};
      }
      factura.datosSuscripcion.precioUnitario = req.body['datosSuscripcion.precioUnitario'];
    }

    factura.modificadaPor = req.usuario._id;

    await factura.save();

    res.json(factura);
  } catch (error) {
    console.error('Error al actualizar factura:', error);
    res.status(500).json({ mensaje: 'Error al actualizar factura' });
  }
};

// Registrar pago
export const registrarPago = async (req, res) => {
  try {
    const { monto, metodoPago, referencia } = req.body;

    if (!monto || !metodoPago) {
      return res.status(400).json({ mensaje: 'Monto y método de pago son requeridos' });
    }

    const factura = await FacturaMensual.findById(req.params.id);
    if (!factura) {
      return res.status(404).json({ mensaje: 'Factura no encontrada' });
    }

    if (factura.estado === 'anulada') {
      return res.status(400).json({ mensaje: 'No se puede pagar una factura anulada' });
    }

    factura.pagos.push({
      monto: parseFloat(monto),
      metodoPago,
      referencia,
      registradoPor: req.usuario._id
    });

    factura.calcularTotales();
    await factura.save();

    const facturaActualizada = await FacturaMensual.findById(factura._id)
      .populate('pagos.registradoPor', 'nombre');

    res.json(facturaActualizada);
  } catch (error) {
    console.error('Error al registrar pago:', error);
    res.status(500).json({ mensaje: 'Error al registrar pago' });
  }
};

// Emitir factura (cambiar estado a 'enviada')
export const emitirFactura = async (req, res) => {
  try {
    const factura = await FacturaMensual.findById(req.params.id);
    if (!factura) {
      return res.status(404).json({ mensaje: 'Factura no encontrada' });
    }

    if (factura.estado !== 'borrador' && factura.estado !== 'generada') {
      return res.status(400).json({ mensaje: 'La factura ya fue emitida' });
    }

    factura.estado = 'enviada';
    factura.fechaEmision = new Date();

    // Fecha vencimiento: último día del mes de la factura
    factura.fechaVencimiento = new Date(factura.anio, factura.mes, 0);

    await factura.save();

    res.json(factura);
  } catch (error) {
    console.error('Error al emitir factura:', error);
    res.status(500).json({ mensaje: 'Error al emitir factura' });
  }
};

// Anular factura
export const anularFactura = async (req, res) => {
  try {
    const { motivo } = req.body;

    const factura = await FacturaMensual.findById(req.params.id);
    if (!factura) {
      return res.status(404).json({ mensaje: 'Factura no encontrada' });
    }

    factura.estado = 'anulada';
    factura.notasInternas = `${factura.notasInternas || ''}\n[ANULADA] ${motivo || 'Sin motivo especificado'}`;
    factura.modificadaPor = req.usuario._id;

    await factura.save();

    res.json({ mensaje: 'Factura anulada', factura });
  } catch (error) {
    console.error('Error al anular factura:', error);
    res.status(500).json({ mensaje: 'Error al anular factura' });
  }
};

// Obtener resumen de facturación del mes
export const obtenerResumenMes = async (req, res) => {
  try {
    const { mes, anio } = req.params;

    const resumen = await FacturaMensual.obtenerResumenMes(parseInt(mes), parseInt(anio));

    res.json(resumen);
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({ mensaje: 'Error al obtener resumen' });
  }
};

// Preview de factura (sin guardar)
export const previewFactura = async (req, res) => {
  try {
    const { clienteId, mes, anio } = req.query;

    if (!clienteId || !mes || !anio) {
      return res.status(400).json({ mensaje: 'clienteId, mes y anio son requeridos' });
    }

    // Verificar si ya existe
    const existente = await FacturaMensual.findOne({
      cliente: clienteId,
      mes: parseInt(mes),
      anio: parseInt(anio)
    }).populate('cliente', 'nombre apellido');

    if (existente) {
      return res.json({ existente: true, factura: existente });
    }

    const factura = await FacturaMensual.generarFactura(
      clienteId,
      parseInt(mes),
      parseInt(anio),
      req.usuario._id
    );

    // Poblar datos para preview sin guardar
    await factura.populate('cliente', 'nombre apellido email');
    await factura.populate('suscripcion');

    res.json({ existente: false, preview: factura });
  } catch (error) {
    console.error('Error en preview:', error);
    res.status(400).json({ mensaje: error.message });
  }
};

// Obtener clientes sin suscripción
export const obtenerClientesSinSuscripcion = async (req, res) => {
  try {
    // Obtener IDs de clientes con suscripción
    const suscripciones = await SuscripcionCliente.find({}, 'cliente');
    const clientesConSuscripcion = suscripciones.map(s => s.cliente.toString());

    // Obtener clientes activos sin suscripción
    const filtro = {
      activo: true,
      _id: { $nin: clientesConSuscripcion }
    };

    // Si es entrenador, solo sus clientes
    if (req.usuario.rol === 'entrenador') {
      filtro.entrenador = req.usuario._id;
    }

    const clientes = await Cliente.find(filtro)
      .select('nombre apellido email entrenador')
      .populate('entrenador', 'nombre')
      .sort({ nombre: 1 });

    res.json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ mensaje: 'Error al obtener clientes' });
  }
};

// Crear factura manual (sin necesidad de suscripción)
export const crearFacturaManual = async (req, res) => {
  try {
    const { clienteId, mes, anio, sesiones, precioUnitario, descuento, notas, diasAsistencia } = req.body;

    // Validaciones
    if (!clienteId || !mes || !anio || !sesiones || !precioUnitario) {
      return res.status(400).json({
        mensaje: 'Faltan campos requeridos: clienteId, mes, anio, sesiones, precioUnitario'
      });
    }

    // Validar cliente existe
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    // Verificar si ya existe factura para este cliente/mes/año
    const facturaExistente = await FacturaMensual.findOne({
      cliente: clienteId,
      mes: parseInt(mes),
      anio: parseInt(anio)
    });

    if (facturaExistente) {
      return res.status(400).json({
        mensaje: `Ya existe una factura para este cliente en ${mes}/${anio}`
      });
    }

    // Calcular totales
    const totalSesiones = parseInt(sesiones);
    const precio = parseFloat(precioUnitario);
    const subtotal = totalSesiones * precio;
    const descuentoMonto = descuento ? parseFloat(descuento) : 0;
    const totalAPagar = subtotal - descuentoMonto;

    // Crear la factura
    const factura = new FacturaMensual({
      cliente: clienteId,
      mes: parseInt(mes),
      anio: parseInt(anio),
      // Datos manuales (sin suscripción)
      suscripcion: null,
      datosSuscripcion: {
        producto: null,
        nombreProducto: 'Factura Manual',
        precioUnitario: precio,
        diasPorSemana: null,
        diasEntrenamiento: []
      },
      // Sesiones
      sesionesProgramadas: totalSesiones,
      sesionesAcumuladasAnterior: 0,
      sesionesAsistidas: totalSesiones,
      sesionesNoAsistidas: 0,
      sesionesCanceladasCentro: 0,
      sesionesRecuperadas: 0,
      sesionesAcumuladasSiguiente: 0,
      totalSesionesACobrar: totalSesiones,
      // Totales
      subtotal: subtotal,
      descuentos: descuentoMonto > 0 ? [{ concepto: 'Descuento', monto: descuentoMonto }] : [],
      totalDescuentos: descuentoMonto,
      totalAPagar: totalAPagar,
      totalPagado: 0,
      // Estado
      estado: 'generada',
      fechaGeneracion: new Date(),
      // Notas
      notasInternas: notas || '',
      notasCliente: '',
      // Días de asistencia marcados
      diasAsistencia: diasAsistencia || [],
      // Registro
      generadaPor: req.usuario._id,
      esManual: true
    });

    await factura.save();

    const facturaPopulada = await FacturaMensual.findById(factura._id)
      .populate('cliente', 'nombre apellido email telefono numeroCuenta')
      .populate('generadaPor', 'nombre');

    res.status(201).json(facturaPopulada);
  } catch (error) {
    console.error('Error al crear factura manual:', error);
    res.status(500).json({ mensaje: error.message || 'Error al crear factura manual' });
  }
};

// ==================== PDF Y EMAIL ====================

// Descargar PDF de factura
export const descargarPDFFactura = async (req, res) => {
  try {
    const factura = await FacturaMensual.findById(req.params.id)
      .populate('cliente', 'nombre apellido email telefono direccion');

    if (!factura) {
      return res.status(404).json({ mensaje: 'Factura no encontrada' });
    }

    const pdfBuffer = await generarPDFFactura(factura);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Factura_${factura.numeroFactura}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({ mensaje: 'Error al generar PDF: ' + error.message });
  }
};

// Enviar factura por email
export const enviarFacturaEmail = async (req, res) => {
  try {
    const factura = await FacturaMensual.findById(req.params.id)
      .populate('cliente', 'nombre apellido email telefono direccion');

    if (!factura) {
      return res.status(404).json({ mensaje: 'Factura no encontrada' });
    }

    if (!factura.cliente?.email) {
      return res.status(400).json({ mensaje: 'El cliente no tiene email registrado' });
    }

    // Generar PDF
    const pdfBuffer = await generarPDFFactura(factura);

    // Enviar email
    await enviarFacturaPorEmail(factura, pdfBuffer);

    // Actualizar estado a 'enviada' si estaba en 'generada'
    if (factura.estado === 'generada') {
      factura.estado = 'enviada';
      factura.fechaEmision = new Date();
      await factura.save();
    }

    res.json({ mensaje: 'Factura enviada correctamente por email' });
  } catch (error) {
    console.error('Error al enviar factura por email:', error);
    res.status(500).json({ mensaje: 'Error al enviar factura: ' + error.message });
  }
};

// Verificar configuracion de email
export const verificarEmail = async (req, res) => {
  try {
    const resultado = await verificarConfiguracionEmail();
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ configurado: false, mensaje: error.message });
  }
};
