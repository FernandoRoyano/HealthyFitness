import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Ejercicio from './src/models/Ejercicio.js';

dotenv.config();

const ejercicios = [
  // ==================== PECHO ====================
  { nombre: 'Press de banca con barra', grupoMuscular: 'pecho', grupoMuscularSecundario: ['triceps', 'hombros'], categoria: 'fuerza', dificultad: 'intermedio', equipamiento: 'Barra y banco', instrucciones: 'Acostado en banco plano, bajar la barra al pecho y empujar hacia arriba.' },
  { nombre: 'Press de banca inclinado con mancuernas', grupoMuscular: 'pecho', grupoMuscularSecundario: ['hombros', 'triceps'], categoria: 'fuerza', dificultad: 'intermedio', equipamiento: 'Mancuernas y banco inclinado', instrucciones: 'En banco a 30-45 grados, presionar mancuernas hacia arriba.' },
  { nombre: 'Press de banca declinado', grupoMuscular: 'pecho', grupoMuscularSecundario: ['triceps'], categoria: 'fuerza', dificultad: 'intermedio', equipamiento: 'Barra y banco declinado', instrucciones: 'En banco declinado, bajar la barra al pecho inferior y empujar.' },
  { nombre: 'Aperturas con mancuernas', grupoMuscular: 'pecho', categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Mancuernas y banco', instrucciones: 'Acostado en banco, abrir brazos con codos ligeramente flexionados y cerrar.' },
  { nombre: 'Aperturas en polea (crossover)', grupoMuscular: 'pecho', categoria: 'fuerza', dificultad: 'intermedio', equipamiento: 'Poleas', instrucciones: 'De pie entre poleas altas, llevar las manos al frente cruzando ligeramente.' },
  { nombre: 'Flexiones (push-ups)', grupoMuscular: 'pecho', grupoMuscularSecundario: ['triceps', 'hombros', 'core'], categoria: 'peso_corporal', dificultad: 'principiante', equipamiento: 'Ninguno', instrucciones: 'Posición de plancha, bajar el cuerpo flexionando codos y empujar.' },
  { nombre: 'Press en máquina de pecho', grupoMuscular: 'pecho', grupoMuscularSecundario: ['triceps'], categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Máquina de press', instrucciones: 'Sentado en la máquina, empujar las asas hacia adelante.' },
  { nombre: 'Fondos en paralelas (pecho)', grupoMuscular: 'pecho', grupoMuscularSecundario: ['triceps', 'hombros'], categoria: 'peso_corporal', dificultad: 'avanzado', equipamiento: 'Barras paralelas', instrucciones: 'Inclinarse hacia adelante y bajar el cuerpo flexionando los codos.' },
  { nombre: 'Pullover con mancuerna', grupoMuscular: 'pecho', grupoMuscularSecundario: ['espalda'], categoria: 'fuerza', dificultad: 'intermedio', equipamiento: 'Mancuerna y banco', instrucciones: 'Acostado en banco, llevar mancuerna por detrás de la cabeza y volver.' },

  // ==================== ESPALDA ====================
  { nombre: 'Dominadas (pull-ups)', grupoMuscular: 'espalda', grupoMuscularSecundario: ['biceps'], categoria: 'peso_corporal', dificultad: 'avanzado', equipamiento: 'Barra de dominadas', instrucciones: 'Colgado de la barra con agarre prono, subir hasta que la barbilla supere la barra.' },
  { nombre: 'Remo con barra', grupoMuscular: 'espalda', grupoMuscularSecundario: ['biceps'], categoria: 'fuerza', dificultad: 'intermedio', equipamiento: 'Barra', instrucciones: 'Inclinado a 45 grados, tirar de la barra hacia el abdomen.' },
  { nombre: 'Remo con mancuerna a una mano', grupoMuscular: 'espalda', grupoMuscularSecundario: ['biceps'], categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Mancuerna y banco', instrucciones: 'Apoyar rodilla y mano en banco, tirar mancuerna hacia la cadera.' },
  { nombre: 'Jalón al pecho (lat pulldown)', grupoMuscular: 'espalda', grupoMuscularSecundario: ['biceps'], categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Máquina de jalones', instrucciones: 'Sentado, tirar la barra hacia el pecho con agarre amplio.' },
  { nombre: 'Remo en polea baja', grupoMuscular: 'espalda', grupoMuscularSecundario: ['biceps'], categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Polea baja', instrucciones: 'Sentado, tirar del agarre hacia el abdomen manteniendo espalda recta.' },
  { nombre: 'Peso muerto convencional', grupoMuscular: 'espalda', grupoMuscularSecundario: ['piernas', 'gluteos', 'core'], categoria: 'fuerza', dificultad: 'avanzado', equipamiento: 'Barra', instrucciones: 'De pie, levantar la barra del suelo manteniendo espalda neutra.' },
  { nombre: 'Remo en máquina T', grupoMuscular: 'espalda', grupoMuscularSecundario: ['biceps'], categoria: 'fuerza', dificultad: 'intermedio', equipamiento: 'Máquina T-bar', instrucciones: 'Inclinado sobre la máquina, tirar del peso hacia el pecho.' },
  { nombre: 'Face pull con polea', grupoMuscular: 'espalda', grupoMuscularSecundario: ['hombros'], categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Polea alta con cuerda', instrucciones: 'Tirar la cuerda hacia la cara, abriendo los codos hacia afuera.' },
  { nombre: 'Remo invertido (australian pull-up)', grupoMuscular: 'espalda', grupoMuscularSecundario: ['biceps', 'core'], categoria: 'peso_corporal', dificultad: 'principiante', equipamiento: 'Barra baja o Smith', instrucciones: 'Colgarse bajo una barra baja y tirar del pecho hacia ella.' },

  // ==================== HOMBROS ====================
  { nombre: 'Press militar con barra', grupoMuscular: 'hombros', grupoMuscularSecundario: ['triceps'], categoria: 'fuerza', dificultad: 'intermedio', equipamiento: 'Barra', instrucciones: 'De pie o sentado, empujar la barra desde los hombros hacia arriba.' },
  { nombre: 'Press de hombros con mancuernas', grupoMuscular: 'hombros', grupoMuscularSecundario: ['triceps'], categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Mancuernas', instrucciones: 'Sentado o de pie, presionar mancuernas desde los hombros hacia arriba.' },
  { nombre: 'Elevaciones laterales', grupoMuscular: 'hombros', categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Mancuernas', instrucciones: 'De pie, elevar mancuernas a los lados hasta la altura de los hombros.' },
  { nombre: 'Elevaciones frontales', grupoMuscular: 'hombros', categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Mancuernas', instrucciones: 'De pie, elevar mancuernas al frente hasta la altura de los hombros.' },
  { nombre: 'Pájaros (elevaciones posteriores)', grupoMuscular: 'hombros', grupoMuscularSecundario: ['espalda'], categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Mancuernas', instrucciones: 'Inclinado hacia adelante, elevar mancuernas a los lados.' },
  { nombre: 'Press Arnold', grupoMuscular: 'hombros', grupoMuscularSecundario: ['triceps'], categoria: 'fuerza', dificultad: 'intermedio', equipamiento: 'Mancuernas', instrucciones: 'Sentado, rotar mancuernas de posición supina a prona mientras presionas.' },
  { nombre: 'Elevaciones laterales en polea', grupoMuscular: 'hombros', categoria: 'fuerza', dificultad: 'intermedio', equipamiento: 'Polea baja', instrucciones: 'De pie junto a una polea baja, elevar el brazo lateralmente.' },
  { nombre: 'Encogimientos de hombros (shrugs)', grupoMuscular: 'hombros', grupoMuscularSecundario: ['espalda'], categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Mancuernas o barra', instrucciones: 'De pie, elevar los hombros hacia las orejas y bajar controladamente.' },

  // ==================== BICEPS ====================
  { nombre: 'Curl de bíceps con barra', grupoMuscular: 'biceps', categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Barra recta o Z', instrucciones: 'De pie, flexionar los codos levantando la barra hacia los hombros.' },
  { nombre: 'Curl de bíceps con mancuernas', grupoMuscular: 'biceps', categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Mancuernas', instrucciones: 'De pie o sentado, flexionar codos alternando o simultáneamente.' },
  { nombre: 'Curl martillo', grupoMuscular: 'biceps', categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Mancuernas', instrucciones: 'De pie, flexionar codos con agarre neutro (palmas enfrentadas).' },
  { nombre: 'Curl en banco predicador', grupoMuscular: 'biceps', categoria: 'fuerza', dificultad: 'intermedio', equipamiento: 'Barra y banco predicador', instrucciones: 'Apoyar brazos en el banco predicador y flexionar con barra o mancuerna.' },
  { nombre: 'Curl concentrado', grupoMuscular: 'biceps', categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Mancuerna', instrucciones: 'Sentado, apoyar codo en el muslo interno y flexionar.' },
  { nombre: 'Curl en polea baja', grupoMuscular: 'biceps', categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Polea baja', instrucciones: 'De pie frente a la polea baja, flexionar los codos tirando del cable.' },
  { nombre: 'Curl inclinado con mancuernas', grupoMuscular: 'biceps', categoria: 'fuerza', dificultad: 'intermedio', equipamiento: 'Mancuernas y banco inclinado', instrucciones: 'Tumbado en banco inclinado a 45 grados, curl con estiramiento completo.' },

  // ==================== TRICEPS ====================
  { nombre: 'Extensiones de tríceps en polea (pushdown)', grupoMuscular: 'triceps', categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Polea alta', instrucciones: 'De pie, extender los codos empujando la barra o cuerda hacia abajo.' },
  { nombre: 'Press francés (skull crushers)', grupoMuscular: 'triceps', categoria: 'fuerza', dificultad: 'intermedio', equipamiento: 'Barra Z y banco', instrucciones: 'Acostado en banco, bajar la barra hacia la frente flexionando codos y extender.' },
  { nombre: 'Extensiones de tríceps sobre la cabeza', grupoMuscular: 'triceps', categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Mancuerna', instrucciones: 'Sentado o de pie, extender mancuerna por encima de la cabeza.' },
  { nombre: 'Fondos en banco (dips de tríceps)', grupoMuscular: 'triceps', grupoMuscularSecundario: ['pecho'], categoria: 'peso_corporal', dificultad: 'principiante', equipamiento: 'Banco', instrucciones: 'Manos apoyadas en banco, bajar el cuerpo flexionando codos y subir.' },
  { nombre: 'Patada de tríceps (kickback)', grupoMuscular: 'triceps', categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Mancuerna', instrucciones: 'Inclinado, extender el codo hacia atrás manteniendo el brazo fijo.' },
  { nombre: 'Press cerrado con barra', grupoMuscular: 'triceps', grupoMuscularSecundario: ['pecho'], categoria: 'fuerza', dificultad: 'intermedio', equipamiento: 'Barra y banco', instrucciones: 'Press de banca con agarre estrecho para enfatizar tríceps.' },
  { nombre: 'Extensiones con cuerda en polea', grupoMuscular: 'triceps', categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Polea alta con cuerda', instrucciones: 'Extensión en polea usando cuerda, abrir al final del movimiento.' },

  // ==================== PIERNAS ====================
  { nombre: 'Sentadilla con barra (squat)', grupoMuscular: 'piernas', grupoMuscularSecundario: ['gluteos', 'core'], categoria: 'fuerza', dificultad: 'intermedio', equipamiento: 'Barra y rack', instrucciones: 'Barra en trapecio, bajar en cuclillas hasta paralelo o más y subir.' },
  { nombre: 'Prensa de piernas', grupoMuscular: 'piernas', grupoMuscularSecundario: ['gluteos'], categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Máquina de prensa', instrucciones: 'Sentado en la prensa, empujar la plataforma con los pies.' },
  { nombre: 'Extensiones de cuádriceps', grupoMuscular: 'piernas', categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Máquina de extensiones', instrucciones: 'Sentado, extender las rodillas levantando el peso.' },
  { nombre: 'Curl de isquiotibiales', grupoMuscular: 'piernas', categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Máquina de curl', instrucciones: 'Tumbado o sentado, flexionar las rodillas hacia los glúteos.' },
  { nombre: 'Sentadilla búlgara', grupoMuscular: 'piernas', grupoMuscularSecundario: ['gluteos'], categoria: 'fuerza', dificultad: 'intermedio', equipamiento: 'Mancuernas y banco', instrucciones: 'Pie trasero elevado en banco, bajar en sentadilla con pierna delantera.' },
  { nombre: 'Zancadas (lunges)', grupoMuscular: 'piernas', grupoMuscularSecundario: ['gluteos'], categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Mancuernas (opcional)', instrucciones: 'Dar un paso al frente y bajar hasta que ambas rodillas estén a 90 grados.' },
  { nombre: 'Sentadilla goblet', grupoMuscular: 'piernas', grupoMuscularSecundario: ['gluteos', 'core'], categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Mancuerna o kettlebell', instrucciones: 'Sostener peso frente al pecho y realizar sentadilla profunda.' },
  { nombre: 'Peso muerto rumano', grupoMuscular: 'piernas', grupoMuscularSecundario: ['gluteos', 'espalda'], categoria: 'fuerza', dificultad: 'intermedio', equipamiento: 'Barra o mancuernas', instrucciones: 'Bajar el peso con piernas casi rectas, sintiendo estiramiento en isquiotibiales.' },
  { nombre: 'Elevación de talones (gemelos)', grupoMuscular: 'piernas', categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Máquina o step', instrucciones: 'De pie, elevar los talones para trabajar los gemelos.' },
  { nombre: 'Sentadilla hack', grupoMuscular: 'piernas', grupoMuscularSecundario: ['gluteos'], categoria: 'fuerza', dificultad: 'intermedio', equipamiento: 'Máquina hack', instrucciones: 'Espalda contra la almohadilla, realizar sentadilla en máquina hack.' },

  // ==================== GLUTEOS ====================
  { nombre: 'Hip thrust con barra', grupoMuscular: 'gluteos', grupoMuscularSecundario: ['piernas'], categoria: 'fuerza', dificultad: 'intermedio', equipamiento: 'Barra y banco', instrucciones: 'Espalda apoyada en banco, empujar cadera hacia arriba con barra.' },
  { nombre: 'Patada de glúteo en polea', grupoMuscular: 'gluteos', categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Polea baja', instrucciones: 'De pie frente a la polea, extender la pierna hacia atrás.' },
  { nombre: 'Puente de glúteos', grupoMuscular: 'gluteos', grupoMuscularSecundario: ['piernas'], categoria: 'peso_corporal', dificultad: 'principiante', equipamiento: 'Ninguno', instrucciones: 'Tumbado boca arriba, elevar la cadera apretando glúteos.' },
  { nombre: 'Abducción de cadera en máquina', grupoMuscular: 'gluteos', categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Máquina de abducción', instrucciones: 'Sentado, abrir las piernas contra la resistencia de la máquina.' },
  { nombre: 'Sentadilla sumo', grupoMuscular: 'gluteos', grupoMuscularSecundario: ['piernas'], categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Mancuerna o kettlebell', instrucciones: 'Pies muy separados y puntas hacia afuera, realizar sentadilla profunda.' },
  { nombre: 'Step up con mancuernas', grupoMuscular: 'gluteos', grupoMuscularSecundario: ['piernas'], categoria: 'fuerza', dificultad: 'principiante', equipamiento: 'Mancuernas y cajón', instrucciones: 'Subir a un cajón alternando piernas con mancuernas en las manos.' },

  // ==================== CORE ====================
  { nombre: 'Plancha (plank)', grupoMuscular: 'core', categoria: 'peso_corporal', dificultad: 'principiante', equipamiento: 'Ninguno', instrucciones: 'Apoyar antebrazos y pies, mantener cuerpo en línea recta.' },
  { nombre: 'Crunch abdominal', grupoMuscular: 'core', categoria: 'peso_corporal', dificultad: 'principiante', equipamiento: 'Ninguno', instrucciones: 'Tumbado, elevar hombros del suelo contrayendo abdominales.' },
  { nombre: 'Elevaciones de piernas colgado', grupoMuscular: 'core', categoria: 'peso_corporal', dificultad: 'avanzado', equipamiento: 'Barra de dominadas', instrucciones: 'Colgado de la barra, elevar las piernas hasta 90 grados o más.' },
  { nombre: 'Russian twist', grupoMuscular: 'core', categoria: 'peso_corporal', dificultad: 'intermedio', equipamiento: 'Peso (opcional)', instrucciones: 'Sentado con torso inclinado, rotar de lado a lado con o sin peso.' },
  { nombre: 'Plancha lateral', grupoMuscular: 'core', categoria: 'peso_corporal', dificultad: 'intermedio', equipamiento: 'Ninguno', instrucciones: 'De lado, apoyar antebrazo y pies, mantener cuerpo en línea recta.' },
  { nombre: 'Mountain climbers', grupoMuscular: 'core', grupoMuscularSecundario: ['piernas'], categoria: 'funcional', dificultad: 'principiante', equipamiento: 'Ninguno', instrucciones: 'En posición de plancha, llevar rodillas al pecho alternadamente.' },
  { nombre: 'Rueda abdominal (ab wheel)', grupoMuscular: 'core', categoria: 'fuerza', dificultad: 'avanzado', equipamiento: 'Rueda abdominal', instrucciones: 'De rodillas, rodar la rueda hacia adelante y volver.' },
  { nombre: 'Crunch en polea', grupoMuscular: 'core', categoria: 'fuerza', dificultad: 'intermedio', equipamiento: 'Polea alta con cuerda', instrucciones: 'De rodillas, flexionar el torso hacia abajo contra la resistencia.' },
  { nombre: 'Dead bug', grupoMuscular: 'core', categoria: 'peso_corporal', dificultad: 'principiante', equipamiento: 'Ninguno', instrucciones: 'Tumbado boca arriba, extender brazo y pierna opuestos alternadamente.' },
  { nombre: 'Bird dog', grupoMuscular: 'core', grupoMuscularSecundario: ['espalda', 'gluteos'], categoria: 'peso_corporal', dificultad: 'principiante', equipamiento: 'Ninguno', instrucciones: 'A cuatro patas, extender brazo y pierna opuestos manteniendo equilibrio.' },

  // ==================== CARDIO ====================
  { nombre: 'Carrera en cinta', grupoMuscular: 'cardio', grupoMuscularSecundario: ['piernas'], categoria: 'cardio', dificultad: 'principiante', equipamiento: 'Cinta de correr', instrucciones: 'Correr en cinta a ritmo constante o intervalos.' },
  { nombre: 'Bicicleta estática', grupoMuscular: 'cardio', grupoMuscularSecundario: ['piernas'], categoria: 'cardio', dificultad: 'principiante', equipamiento: 'Bicicleta estática', instrucciones: 'Pedalear a ritmo constante o intervalos.' },
  { nombre: 'Elíptica', grupoMuscular: 'cardio', grupoMuscularSecundario: ['piernas', 'espalda'], categoria: 'cardio', dificultad: 'principiante', equipamiento: 'Máquina elíptica', instrucciones: 'Movimiento de elíptica con brazos y piernas.' },
  { nombre: 'Remo en máquina (ergómetro)', grupoMuscular: 'cardio', grupoMuscularSecundario: ['espalda', 'piernas', 'core'], categoria: 'cardio', dificultad: 'intermedio', equipamiento: 'Máquina de remo', instrucciones: 'Realizar el movimiento de remo completo: piernas, espalda, brazos.' },
  { nombre: 'Saltar la cuerda', grupoMuscular: 'cardio', grupoMuscularSecundario: ['piernas'], categoria: 'cardio', dificultad: 'intermedio', equipamiento: 'Cuerda de saltar', instrucciones: 'Saltar a ritmo constante coordinando manos y pies.' },
  { nombre: 'Burpees', grupoMuscular: 'cardio', grupoMuscularSecundario: ['pecho', 'piernas', 'core'], categoria: 'funcional', dificultad: 'avanzado', equipamiento: 'Ninguno', instrucciones: 'Flexión, salto vertical, repetir. Ejercicio de cuerpo completo.' },
  { nombre: 'Jumping jacks', grupoMuscular: 'cardio', categoria: 'cardio', dificultad: 'principiante', equipamiento: 'Ninguno', instrucciones: 'Saltar abriendo piernas y brazos simultáneamente.' },
  { nombre: 'Battle ropes', grupoMuscular: 'cardio', grupoMuscularSecundario: ['hombros', 'core'], categoria: 'funcional', dificultad: 'intermedio', equipamiento: 'Cuerdas de batalla', instrucciones: 'Agitar las cuerdas con movimientos ondulantes de brazos.' },

  // ==================== CUERPO COMPLETO / FUNCIONAL ====================
  { nombre: 'Peso muerto sumo', grupoMuscular: 'cuerpo_completo', grupoMuscularSecundario: ['piernas', 'gluteos', 'espalda'], categoria: 'fuerza', dificultad: 'intermedio', equipamiento: 'Barra', instrucciones: 'Pies separados, puntas afuera, levantar barra del suelo.' },
  { nombre: 'Clean & press', grupoMuscular: 'cuerpo_completo', grupoMuscularSecundario: ['hombros', 'piernas', 'espalda'], categoria: 'funcional', dificultad: 'avanzado', equipamiento: 'Barra', instrucciones: 'Levantar barra del suelo a hombros y presionar por encima de la cabeza.' },
  { nombre: 'Kettlebell swing', grupoMuscular: 'cuerpo_completo', grupoMuscularSecundario: ['gluteos', 'hombros', 'core'], categoria: 'funcional', dificultad: 'intermedio', equipamiento: 'Kettlebell', instrucciones: 'Balancear kettlebell entre piernas y al frente con empuje de cadera.' },
  { nombre: 'Turkish get-up', grupoMuscular: 'cuerpo_completo', grupoMuscularSecundario: ['hombros', 'core'], categoria: 'funcional', dificultad: 'avanzado', equipamiento: 'Kettlebell', instrucciones: 'Desde tumbado, levantarse sosteniendo peso por encima de la cabeza.' },
  { nombre: 'Thruster con mancuernas', grupoMuscular: 'cuerpo_completo', grupoMuscularSecundario: ['piernas', 'hombros'], categoria: 'funcional', dificultad: 'intermedio', equipamiento: 'Mancuernas', instrucciones: 'Sentadilla frontal con press de hombros al subir.' },
  { nombre: 'Farmer walk (paseo del granjero)', grupoMuscular: 'cuerpo_completo', grupoMuscularSecundario: ['core', 'hombros'], categoria: 'funcional', dificultad: 'principiante', equipamiento: 'Mancuernas pesadas', instrucciones: 'Caminar manteniendo postura erguida con peso pesado en cada mano.' },
  { nombre: 'Man maker', grupoMuscular: 'cuerpo_completo', grupoMuscularSecundario: ['pecho', 'espalda', 'hombros', 'piernas'], categoria: 'funcional', dificultad: 'avanzado', equipamiento: 'Mancuernas', instrucciones: 'Flexión, remo, clean, press y sentadilla en un solo movimiento.' },

  // ==================== ESTIRAMIENTO ====================
  { nombre: 'Estiramiento de pectoral en pared', grupoMuscular: 'pecho', categoria: 'estiramiento', dificultad: 'principiante', equipamiento: 'Pared', instrucciones: 'Apoyar brazo en pared y girar torso para estirar pectoral.' },
  { nombre: 'Estiramiento de cuádriceps de pie', grupoMuscular: 'piernas', categoria: 'estiramiento', dificultad: 'principiante', equipamiento: 'Ninguno', instrucciones: 'De pie, llevar talón al glúteo sujetando el tobillo.' },
  { nombre: 'Estiramiento de isquiotibiales sentado', grupoMuscular: 'piernas', categoria: 'estiramiento', dificultad: 'principiante', equipamiento: 'Ninguno', instrucciones: 'Sentado con piernas extendidas, inclinar torso hacia adelante.' },
  { nombre: 'Estiramiento de dorsales', grupoMuscular: 'espalda', categoria: 'estiramiento', dificultad: 'principiante', equipamiento: 'Ninguno', instrucciones: 'De rodillas, extender brazos al frente con palmas al suelo.' },
  { nombre: 'Estiramiento de hombros (brazo cruzado)', grupoMuscular: 'hombros', categoria: 'estiramiento', dificultad: 'principiante', equipamiento: 'Ninguno', instrucciones: 'Cruzar brazo por delante del pecho y sujetar con el otro.' },
  { nombre: 'Estiramiento de tríceps sobre la cabeza', grupoMuscular: 'triceps', categoria: 'estiramiento', dificultad: 'principiante', equipamiento: 'Ninguno', instrucciones: 'Llevar mano detrás de la cabeza y empujar codo con la otra mano.' },
  { nombre: 'Cat-cow (gato-vaca)', grupoMuscular: 'core', grupoMuscularSecundario: ['espalda'], categoria: 'estiramiento', dificultad: 'principiante', equipamiento: 'Ninguno', instrucciones: 'A cuatro patas, alternar entre arquear y redondear la espalda.' },
  { nombre: 'Estiramiento de cadera (pigeon pose)', grupoMuscular: 'gluteos', grupoMuscularSecundario: ['piernas'], categoria: 'estiramiento', dificultad: 'intermedio', equipamiento: 'Ninguno', instrucciones: 'Pierna delantera flexionada, pierna trasera extendida, bajar cadera.' },
  { nombre: 'Estiramiento de flexores de cadera', grupoMuscular: 'piernas', grupoMuscularSecundario: ['gluteos'], categoria: 'estiramiento', dificultad: 'principiante', equipamiento: 'Ninguno', instrucciones: 'En posición de zancada baja, empujar cadera hacia adelante.' }
];

const seedEjercicios = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    let insertados = 0;
    let existentes = 0;

    for (const ejercicio of ejercicios) {
      const existe = await Ejercicio.findOne({ nombre: ejercicio.nombre });
      if (!existe) {
        await Ejercicio.create(ejercicio);
        insertados++;
      } else {
        existentes++;
      }
    }

    console.log(`\n=== Seed de Ejercicios ===`);
    console.log(`Total en archivo: ${ejercicios.length}`);
    console.log(`Insertados: ${insertados}`);
    console.log(`Ya existían: ${existentes}`);

    await mongoose.connection.close();
    console.log('\nSeed completado.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedEjercicios();
