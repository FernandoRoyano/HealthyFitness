# 🚀 Guía de Deployment

## 📋 Prerequisitos

1. Cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (gratis)
2. Cuenta en [Vercel](https://vercel.com) (gratis)
3. Cuenta en [Render](https://render.com) (gratis) - Para el backend

## 1️⃣ Configurar MongoDB Atlas

### Crear Base de Datos

1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto llamado "HealthyFitness"
4. Build a Database → M0 (Free)
5. Provider: AWS, Region: más cercana a ti
6. Cluster Name: `healthyfitness-cluster`

### Configurar Acceso

1. **Database Access** → Add New Database User
   - Username: `healthyfitness-admin`
   - Password: Genera una contraseña segura (guárdala)
   - Database User Privileges: `Atlas admin`

2. **Network Access** → Add IP Address
   - Allow Access from Anywhere: `0.0.0.0/0`
   - (Nota: En producción, restringe esto a las IPs de tus servidores)

3. **Connect** → Connect your application
   - Driver: Node.js
   - Version: 5.5 or later
   - Copia la connection string:
   ```
   mongodb+srv://healthyfitness-admin:<password>@healthyfitness-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Reemplaza `<password>` con tu contraseña

### Inicializar Datos

Conecta tu aplicación local a Atlas temporalmente para crear los datos iniciales:

```bash
# En backend/.env temporal
MONGODB_URI=mongodb+srv://healthyfitness-admin:TU_PASSWORD@healthyfitness-cluster.xxxxx.mongodb.net/personal-training-center?retryWrites=true&w=majority

# Ejecutar script de entrenadores
cd backend
node crear-entrenadores-reales.js
```

## 2️⃣ Desplegar Backend en Render

### Preparar el Backend

1. Ve a [render.com](https://render.com)
2. Sign up / Login con GitHub
3. New → Web Service
4. Connect tu repositorio: `FernandoRoyano/HealthyFitness`
5. Configuración:
   - **Name**: `healthyfitness-api`
   - **Region**: Oregon (o la más cercana)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`

### Variables de Entorno en Render

En Environment Variables, agrega:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://healthyfitness-admin:TU_PASSWORD@healthyfitness-cluster.xxxxx.mongodb.net/personal-training-center?retryWrites=true&w=majority
JWT_SECRET=tu_secreto_jwt_super_seguro_produccion_2024
```

### Deploy

- Click "Create Web Service"
- Espera a que termine el deployment (5-10 min)
- Tu API estará en: `https://healthyfitness-api.onrender.com`

## 3️⃣ Desplegar Frontend en Vercel

### Configurar el Frontend

Primero, actualiza la URL del API en el frontend.

### Deployment en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Sign up / Login con GitHub
3. Import Project → `FernandoRoyano/HealthyFitness`
4. Configuración:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Variables de Entorno en Vercel

En Environment Variables:

```
VITE_API_URL=https://healthyfitness-api.onrender.com
```

### Deploy

- Click "Deploy"
- Espera 2-3 minutos
- Tu app estará en: `https://healthyfitness-xxx.vercel.app`

## 4️⃣ Actualizar CORS en Backend

Después del deployment, actualiza el backend para permitir tu dominio de Vercel:

En `backend/server.js`, actualiza CORS:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://healthyfitness-xxx.vercel.app' // Tu URL de Vercel
  ],
  credentials: true
}));
```

Haz commit y push:

```bash
git add .
git commit -m "Configure CORS for production"
git push
```

Render automáticamente redesplegará.

## 📖 Cómo se usa

La aplicación tiene **dos portales** independientes: el **Panel de Gestión** (para gerentes y entrenadores) y el **Portal del Cliente**.

---

### Panel de Gestión (Gerente / Entrenador)

**Acceso:** `/login`

El menú lateral está organizado en las siguientes secciones:

#### 🏠 Inicio (Dashboard)
- Resumen general del centro: sesiones del día, clientes activos, ingresos, etc.
- Vista rápida de la actividad reciente.

#### 👥 Clientes
| Apartado | Qué contiene | Funciones principales |
|----------|-------------|----------------------|
| **Clientes** | Listado completo de clientes del centro | Crear, editar, eliminar clientes. Ver ficha detallada con historial de sesiones, mediciones y suscripción. Importar/exportar datos. |
| **Leads** | Clientes potenciales (contactos interesados) | Registrar leads, hacer seguimiento, convertir a cliente activo. |

#### 📆 Agenda
| Apartado | Qué contiene | Funciones principales |
|----------|-------------|----------------------|
| **Agenda** | Calendario visual con todas las reservas | Ver por día/semana. Crear, mover y cancelar sesiones. Filtrar por entrenador. *(Gerente ve todos los entrenadores, entrenador ve solo los suyos)* |
| **Horario Base** | Plantillas semanales de disponibilidad | Definir franjas horarias recurrentes por entrenador. Sirve como base para generar la agenda semanal automáticamente. |

#### 🏋️ Equipo
| Apartado | Qué contiene | Funciones principales |
|----------|-------------|----------------------|
| **Entrenadores** | Listado del equipo de entrenadores | Ver perfil, horarios y carga de trabajo de cada entrenador. |
| **Solicitudes** | Solicitudes de cambio de horario/sesión | Los entrenadores crean solicitudes; el gerente las aprueba o rechaza. Badge con contador de pendientes. |
| **Vacaciones** | Gestión de vacaciones del equipo | Solicitar, aprobar y consultar períodos de vacaciones. Badge con contador de pendientes. |

#### 💶 Finanzas
| Apartado | Qué contiene | Funciones principales |
|----------|-------------|----------------------|
| **Facturación** | Facturas mensuales por cliente | Generar facturas, marcar como pagadas, exportar a PDF. Control de ingresos por mes. |
| **Tarifas** | Productos y tarifas del centro | Crear y editar tipos de suscripción, precios, bonos de sesiones. |

#### ⚙️ Configuración
- Datos del centro (nombre, dirección, horario de apertura).
- Configuraciones generales de la aplicación.

> **Nota sobre roles:**
> - **Gerente:** Acceso completo a todas las secciones. Ve todos los entrenadores y clientes.
> - **Entrenador:** Ve solo sus propios clientes, su propia agenda y su facturación. Puede crear solicitudes de cambio pero no aprobarlas.

---

### Portal del Cliente

**Acceso:** `/cliente/login`

Portal independiente donde los clientes acceden con sus propias credenciales.

| Apartado | Icono | Qué contiene |
|----------|-------|-------------|
| **Mi Panel** | 🏠 | Dashboard personal: próximas sesiones, resumen de actividad. |
| **Mi Calendario** | 📆 | Ver su calendario de sesiones programadas. |
| **Mis Sesiones** | 🏋️ | Historial completo de sesiones realizadas y pendientes. |
| **Mi Progreso** | 📊 | Evolución de mediciones corporales (peso, medidas, etc.) con gráficas. |
| **Mi Suscripción** | 💳 | Estado de su suscripción actual, sesiones restantes, próxima renovación. |

---

### Notificaciones (🔔)
- Icono en la barra superior del Panel de Gestión.
- Muestra alertas en tiempo real: nuevas solicitudes, cambios en reservas, etc.
- Contador de notificaciones no leídas.

---

## ✅ Verificación

1. Visita tu app en Vercel
2. Intenta hacer login con las credenciales del gerente
3. Verifica que puedas ver entrenadores y crear reservas

## 🔧 Troubleshooting

### Backend no responde
- Revisa los logs en Render Dashboard
- Verifica que MONGODB_URI esté correcta
- Verifica que JWT_SECRET esté configurado

### Frontend no conecta con Backend
- Revisa VITE_API_URL en Vercel
- Verifica CORS en backend
- Abre Developer Tools → Network para ver errores

### Base de datos vacía
- Ejecuta el script de inicialización conectado a Atlas
- Verifica que la connection string incluya el nombre de la base de datos

## 💰 Costos

- **MongoDB Atlas**: Gratis (512MB)
- **Render**: Gratis (instancia duerme después de 15 min de inactividad)
- **Vercel**: Gratis (bandwidth limitado)

## 📝 Notas

- Render Free tier duerme después de 15 min sin uso
- Primera request después de dormir tarda 30-60 segundos
- Para evitar esto, considera Render Paid ($7/mes) o Railway
