// ===== DATOS =====
const DB_KEY = 'fitmacro_data';

const alimentosDB = [
  { id: 1, nombre: 'Pechuga de Pollo a la plancha', cantidad: 150, kcal: 165, proteina: 31, carbs: 0, grasas: 3.6, emoji: '🍗' },
  { id: 2, nombre: 'Arroz integral', cantidad: 195, kcal: 215, proteina: 5, carbs: 45, grasas: 1.8, emoji: '🍚', medida: '1 Taza' },
  { id: 3, nombre: 'Huevo entero', cantidad: 50, kcal: 70, proteina: 6, carbs: 0.5, grasas: 5, emoji: '🥚', medida: '1 pieza' },
  { id: 4, nombre: 'Avena cocida', cantidad: 240, kcal: 150, proteina: 5, carbs: 27, grasas: 3, emoji: '🥣', medida: '1 Taza' },
  { id: 5, nombre: 'Plátano', cantidad: 120, kcal: 105, proteina: 1.3, carbs: 27, grasas: 0.4, emoji: '🍌', medida: '1 pieza' },
  { id: 6, nombre: 'Yogur griego', cantidad: 170, kcal: 100, proteina: 17, carbs: 6, grasas: 0.7, emoji: '🥛' },
  { id: 7, nombre: 'Atún en agua', cantidad: 140, kcal: 130, proteina: 28, carbs: 0, grasas: 0.5, emoji: '🐟' },
  { id: 8, nombre: 'Almendras', cantidad: 28, kcal: 160, proteina: 6, carbs: 6, grasas: 14, emoji: '🌰' },
  { id: 9, nombre: 'Manzana', cantidad: 182, kcal: 95, proteina: 0.5, carbs: 25, grasas: 0.3, emoji: '🍎', medida: '1 pieza' },
  { id: 10, nombre: 'Espinaca cocida', cantidad: 180, kcal: 41, proteina: 5.3, carbs: 6.7, grasas: 0.5, emoji: '🥬', medida: '1 Taza' },
  { id: 11, nombre: 'Queso cottage', cantidad: 113, kcal: 90, proteina: 12, carbs: 3, grasas: 2.5, emoji: '🧀' },
  { id: 12, nombre: 'Tortilla de maíz', cantidad: 28, kcal: 60, proteina: 1.5, carbs: 12, grasas: 1, emoji: '🫓', medida: '1 pieza' },
];

// Estado de la app
let state = {
  registros: [],
  mealType: 'desayuno',
  selectedAlimento: null,
  metas: { kcal: 2000, proteina: 150, carbs: 200, grasas: 65 },
  usuario: { nombre: 'Jonathan', correo: 'Oaxaca@gmail.com' }
};

// Cargar datos del localStorage
function loadState() {
  try {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
    }
  } catch (e) { /* ignore */ }
}

function saveState() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

// ===== NAVEGACIÓN =====
function switchScreen(name) {
  // Ocultar todas
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Activar la correcta
  const screen = document.getElementById('screen-' + name);
  if (screen) screen.classList.add('active');

  const navItem = document.getElementById('nav-' + name);
  if (navItem) navItem.classList.add('active');

  // Acciones por pantalla
  if (name === 'registro') renderAlimentos('');
  if (name === 'progreso') drawChart();
  if (name === 'inicio') updateResumenInicio();
}

// ===== INICIO =====
function updateResumenInicio() {
  const consumed = calcConsumed();
  const rem = Math.max(0, state.metas.kcal - consumed.kcal);
  document.querySelector('.resumen-pill.yellow .resumen-num').textContent = rem.toLocaleString();
  document.querySelector('.resumen-pill.blue .resumen-num').textContent = consumed.proteina.toFixed(0) + ' g';
  document.querySelector('.resumen-pill.green .resumen-num').textContent = consumed.carbs.toFixed(0) + ' g';
}

// ===== REGISTRO =====
function selectMeal(type) {
  state.mealType = type;
  saveState();
  document.querySelectorAll('.meal-type').forEach(el => el.classList.remove('active'));
  document.getElementById('mt-' + type).classList.add('active');
}

let filteredAlimentos = [...alimentosDB];

function filterAlimentos(q) {
  filteredAlimentos = alimentosDB.filter(a =>
    a.nombre.toLowerCase().includes(q.toLowerCase())
  );
  renderAlimentos(q);
}

function renderAlimentos(q) {
  filteredAlimentos = q
    ? alimentosDB.filter(a => a.nombre.toLowerCase().includes(q.toLowerCase()))
    : alimentosDB;

  const list = document.getElementById('alimentosList');
  if (!list) return;

  list.innerHTML = '';

  // Mostrar primero los del tipo de comida actual, luego el resto
  const today = getTodayRegistros();
  const mealReg = today.filter(r => r.mealType === state.mealType);

  // Registros del tipo actual (arriba)
  if (mealReg.length > 0) {
    mealReg.forEach(reg => {
      const el = createAlimentoEl(reg, true);
      list.appendChild(el);
    });
  }

  // Todos los alimentos de la DB (filtrados)
  filteredAlimentos.slice(0, 8).forEach(alim => {
    const el = createAlimentoEl(alim, false);
    list.appendChild(el);
  });

  updateResumenRegistro();
}

function createAlimentoEl(alim, isRegistro) {
  const div = document.createElement('div');
  div.className = 'alimento-item';
  div.dataset.id = alim.id;

  if (state.selectedAlimento && state.selectedAlimento.id === alim.id) {
    div.classList.add('selected');
  }

  div.onclick = () => selectAlimento(alim, div);

  const medida = alim.medida ? alim.medida + ' · ' : alim.cantidad + 'g · ';

  div.innerHTML = `
    <div class="alimento-emoji">${alim.emoji}</div>
    <div class="alimento-info">
      <p class="alimento-nombre">${alim.nombre}</p>
      <p class="alimento-det">${medida}${alim.kcal} kcal</p>
    </div>
    <button class="alimento-add" onclick="event.stopPropagation(); quickAdd(${alim.id})">+</button>
  `;
  return div;
}

function selectAlimento(alim, el) {
  state.selectedAlimento = alim;
  document.querySelectorAll('.alimento-item').forEach(i => i.classList.remove('selected'));
  el.classList.add('selected');
}

function quickAdd(id) {
  const alim = alimentosDB.find(a => a.id === id);
  if (!alim) return;
  addToRegistro(alim);
}

function addToRegistro(alim) {
  const reg = {
    id: Date.now(),
    alimentoId: alim.id,
    nombre: alim.nombre,
    cantidad: alim.cantidad,
    kcal: alim.kcal,
    proteina: alim.proteina,
    carbs: alim.carbs,
    grasas: alim.grasas,
    emoji: alim.emoji,
    mealType: state.mealType,
    fecha: getToday()
  };
  state.registros.push(reg);
  saveState();
  updateResumenRegistro();
  showToast('✅ ' + alim.nombre + ' agregado');
}

function updateResumenRegistro() {
  const consumed = calcConsumed();
  const rem = Math.max(0, state.metas.kcal - consumed.kcal);

  const rrKcal = document.getElementById('rr-kcal');
  const rrProt = document.getElementById('rr-prot');
  const rrCarb = document.getElementById('rr-carb');
  if (rrKcal) rrKcal.textContent = rem.toLocaleString();
  if (rrProt) rrProt.textContent = consumed.proteina.toFixed(0) + 'g';
  if (rrCarb) rrCarb.textContent = consumed.carbs.toFixed(0) + 'g';
}

function agregarAlimento() {
  openModal('modalAgregar');
}

function editarAlimento() {
  if (!state.selectedAlimento) {
    showToast('Selecciona un alimento primero');
    return;
  }
  document.getElementById('e-nombre').value = state.selectedAlimento.nombre;
  document.getElementById('e-cantidad').value = state.selectedAlimento.cantidad;
  openModal('modalEditar');
}

function eliminarAlimento() {
  if (!state.selectedAlimento) {
    showToast('Selecciona un alimento primero');
    return;
  }
  // Eliminar del registro del día
  state.registros = state.registros.filter(r =>
    !(r.alimentoId === state.selectedAlimento.id && r.fecha === getToday())
  );
  state.selectedAlimento = null;
  saveState();
  renderAlimentos(document.getElementById('searchInput')?.value || '');
  showToast('🗑️ Alimento eliminado');
}

function confirmarAgregar() {
  const nombre = document.getElementById('m-nombre').value.trim();
  const cantidad = parseInt(document.getElementById('m-cantidad').value) || 100;
  const kcal = parseInt(document.getElementById('m-calorias').value) || 0;
  const proteina = parseInt(document.getElementById('m-proteina').value) || 0;

  if (!nombre) { showToast('Ingresa el nombre del alimento'); return; }

  const custom = {
    id: Date.now(),
    nombre,
    cantidad,
    kcal,
    proteina,
    carbs: 0,
    grasas: 0,
    emoji: '🍽️',
    mealType: state.mealType,
    fecha: getToday()
  };

  state.registros.push({ ...custom, alimentoId: custom.id });
  saveState();

  // Limpiar inputs
  ['m-nombre','m-cantidad','m-calorias','m-proteina'].forEach(id => {
    document.getElementById(id).value = '';
  });

  closeModal('modalAgregar');
  updateResumenRegistro();
  renderAlimentos('');
  showToast('✅ ' + nombre + ' registrado');
}

function confirmarEditar() {
  const nuevoNombre = document.getElementById('e-nombre').value.trim();
  const nuevaCantidad = parseInt(document.getElementById('e-cantidad').value) || state.selectedAlimento.cantidad;

  // Actualizar en registros
  state.registros.forEach(r => {
    if (r.alimentoId === state.selectedAlimento.id && r.fecha === getToday()) {
      r.nombre = nuevoNombre || r.nombre;
      r.cantidad = nuevaCantidad;
    }
  });

  saveState();
  closeModal('modalEditar');
  renderAlimentos('');
  showToast('✏️ Registro actualizado');
}

// ===== PROGRESO =====
function drawChart() {
  const canvas = document.getElementById('progressChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Datos simulados de progreso de 7 días
  const rawData = [65, 80, 55, 90, 70, 85, 60];
  const max = 100;

  // Grid lines
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = h - (i / 4) * (h - 10) - 5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Área del gráfico
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, 'rgba(212,176,0,0.4)');
  gradient.addColorStop(1, 'rgba(212,176,0,0)');

  const stepX = (w - 20) / (rawData.length - 1);
  const points = rawData.map((v, i) => ({
    x: 10 + i * stepX,
    y: h - 5 - ((v / max) * (h - 15))
  }));

  // Fill
  ctx.beginPath();
  ctx.moveTo(points[0].x, h);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length-1].x, h);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = '#d4b000';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dots
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#d4b000';
    ctx.fill();
  });
}

// ===== PERFIL =====
function guardarPerfil() {
  state.usuario.nombre = document.getElementById('p-usuario').value;
  state.usuario.correo = document.getElementById('p-correo').value;
  saveState();
  showToast('✅ Perfil guardado');
}

function cerrarSesion() {
  if (!confirm('¿Seguro que quieres cerrar sesión? Se borrarán todos los registros y volverá a valores de fábrica.')) return;

  // Borrar localStorage
  localStorage.removeItem(DB_KEY);

  // Resetear estado a valores por defecto
  state = {
    registros: [],
    mealType: 'desayuno',
    selectedAlimento: null,
    metas: { kcal: 2000, proteina: 150, carbs: 200, grasas: 65 },
    usuario: { nombre: '', correo: '' }
  };

  // === INICIO: resetear textos ===
  const comidaName = document.querySelector('.comida-name');
  const comidaKcal = document.querySelector('.comida-kcal');
  if (comidaName) comidaName.textContent = 'Sin datos';
  if (comidaKcal) comidaKcal.textContent = '';
  document.querySelector('.resumen-pill.yellow .resumen-num').textContent = '0';
  document.querySelector('.resumen-pill.blue .resumen-num').textContent = '0 g';
  document.querySelector('.resumen-pill.green .resumen-num').textContent = '0 g';

  // === REGISTRO: resetear resumen ===
  const rrKcal = document.getElementById('rr-kcal');
  const rrProt = document.getElementById('rr-prot');
  const rrCarb = document.getElementById('rr-carb');
  if (rrKcal) rrKcal.textContent = '0';
  if (rrProt) rrProt.textContent = '0g';
  if (rrCarb) rrCarb.textContent = '0g';
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  filteredAlimentos = [...alimentosDB];
  renderAlimentos('');

  // === PROGRESO: resetear macros, semanas y estadísticas ===
  // Macros
  document.querySelectorAll('.macro-meta').forEach(el => el.textContent = 'Sin meta');
  // Semanas
  document.querySelectorAll('.semana-card').forEach(card => {
    card.className = 'semana-card empty-week';
    const icon = card.querySelector('.semana-icon');
    const status = card.querySelector('.semana-status');
    if (icon) icon.textContent = '—';
    if (status) status.textContent = 'No se ha cumplido ninguna meta';
  });
  // Estadísticas
  const statValues = document.querySelectorAll('.stat-value');
  if (statValues[0]) statValues[0].textContent = '0 G';
  if (statValues[1]) statValues[1].textContent = '0 Kg';
  if (statValues[2]) { statValues[2].textContent = '0 metas cumplidas'; statValues[2].className = 'stat-value yellow-text'; }
  // Gráfico vacío
  drawChartEmpty();

  // === PERFIL: campos vacíos con placeholder ===
  document.getElementById('p-usuario').value = '';
  document.getElementById('p-correo').value = '';
  document.getElementById('p-pass').value = '';

  // Volver a inicio
  switchScreen('inicio');
  showToast('✅ Sesión cerrada. App reiniciada');
}

function drawChartEmpty() {
  const canvas = document.getElementById('progressChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Solo grid vacío
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = canvas.height - (i / 4) * (canvas.height - 10) - 5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

// ===== AYUDA =====
function toggleAyuda(el) {
  const ans = el.querySelector('.ayuda-a');
  ans.classList.toggle('hidden');
}

// ===== MODALS =====
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// ===== TOAST =====
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 2500);
}

// ===== UTILS =====
function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getTodayRegistros() {
  return state.registros.filter(r => r.fecha === getToday());
}

function calcConsumed() {
  const today = getTodayRegistros();
  return today.reduce((acc, r) => ({
    kcal: acc.kcal + (r.kcal || 0),
    proteina: acc.proteina + (r.proteina || 0),
    carbs: acc.carbs + (r.carbs || 0),
    grasas: acc.grasas + (r.grasas || 0)
  }), { kcal: 0, proteina: 0, carbs: 0, grasas: 0 });
}

// ===== INIT =====
window.addEventListener('load', () => {
  loadState();
  renderAlimentos('');
  updateResumenInicio();

  // Restaurar usuario en perfil
  if (state.usuario) {
    const pu = document.getElementById('p-usuario');
    const pc = document.getElementById('p-correo');
    if (pu) pu.value = state.usuario.nombre;
    if (pc) pc.value = state.usuario.correo;
  }
});
