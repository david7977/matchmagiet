const state = {
  users: ["Ana", "Bruno", "Carla", "Diego"],
  rows: []
};

const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const usersSelect = document.getElementById("usuarios");
const newUserInput = document.getElementById("nuevoUsuario");
const startDateInput = document.getElementById("fechaInicio");
const weeksInput = document.getElementById("semanas");
const activePostsInput = document.getElementById("puestosActivos");
const messageEl = document.getElementById("mensaje");
const tableHead = document.querySelector("#tablaRotacion thead");
const tableBody = document.querySelector("#tablaRotacion tbody");

initialize();

function initialize() {
  startDateInput.value = getTodayISO();
  renderUsers();
  bindEvents();
  renderTable([], 1);
}

function bindEvents() {
  document.getElementById("agregarUsuario").addEventListener("click", addUser);
  document.getElementById("quitarUsuario").addEventListener("click", removeSelectedUser);
  document.getElementById("limpiarUsuarios").addEventListener("click", clearUsers);
  document.getElementById("generar").addEventListener("click", generateRotation);
  document.getElementById("exportar").addEventListener("click", exportCsv);
}

function addUser() {
  const name = newUserInput.value.trim();
  if (!name) {
    setMessage("Escribe un nombre antes de agregar.");
    return;
  }

  if (state.users.includes(name)) {
    setMessage("Ese usuario ya existe en la lista.");
    return;
  }

  state.users.push(name);
  newUserInput.value = "";
  renderUsers();
  setMessage(`Usuario agregado: ${name}.`);
}

function removeSelectedUser() {
  const option = usersSelect.selectedOptions[0];
  if (!option) {
    setMessage("Selecciona un usuario para quitar.");
    return;
  }

  state.users = state.users.filter((u) => u !== option.value);
  renderUsers();
  setMessage(`Usuario quitado: ${option.value}.`);
}

function clearUsers() {
  state.users = [];
  renderUsers();
  setMessage("Lista de usuarios vaciada.");
}

function generateRotation() {
  const startDate = parseInputDate(startDateInput.value);
  const weeks = Number(weeksInput.value);
  const posts = Number(activePostsInput.value);

  if (!startDate) {
    setMessage("Selecciona una fecha válida.");
    return;
  }

  if (!Number.isInteger(weeks) || weeks < 1) {
    setMessage("La cantidad de semanas debe ser un número mayor o igual a 1.");
    return;
  }

  if (posts < 1 || posts > 3) {
    setMessage("Los puestos activos deben estar entre 1 y 3.");
    return;
  }

  if (state.users.length < posts) {
    setMessage("Necesitas al menos la misma cantidad de usuarios que puestos activos.");
    return;
  }

  state.rows = buildSchedule(startDate, weeks, posts, state.users);
  renderTable(state.rows, posts);
  setMessage(`Calendario generado: ${state.rows.length} días hábiles.`);
}

function buildSchedule(startDate, weeks, posts, users) {
  const totalBusinessDays = weeks * 5;
  const rows = [];
  const cursor = new Date(startDate);
  let offset = 0;

  while (rows.length < totalBusinessDays) {
    const day = cursor.getDay();

    // Solo se programa de lunes a viernes. Así el orden del viernes continúa en lunes.
    if (day >= 1 && day <= 5) {
      const assigned = [];
      for (let position = 0; position < posts; position += 1) {
        const userIndex = (offset + position) % users.length;
        assigned.push(users[userIndex]);
      }

      rows.push({
        date: toISODate(cursor),
        dayLabel: dayNames[day],
        assigned
      });

      offset = (offset + posts) % users.length;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return rows;
}

function renderUsers() {
  usersSelect.innerHTML = "";
  state.users.forEach((user) => {
    const option = document.createElement("option");
    option.value = user;
    option.textContent = user;
    usersSelect.appendChild(option);
  });
}

function renderTable(rows, posts) {
  const headerCells = ["Fecha", "Día"];
  for (let i = 1; i <= posts; i += 1) {
    headerCells.push(`Puesto ${i}`);
  }

  tableHead.innerHTML = `<tr>${headerCells.map((h) => `<th>${h}</th>`).join("")}</tr>`;

  if (!rows.length) {
    tableBody.innerHTML = `<tr><td colspan="${headerCells.length}">Genera un calendario para ver resultados.</td></tr>`;
    return;
  }

  tableBody.innerHTML = rows
    .map((row) => {
      const assignmentCells = row.assigned.map((value) => `<td>${value}</td>`).join("");
      return `<tr><td>${row.date}</td><td>${row.dayLabel}</td>${assignmentCells}</tr>`;
    })
    .join("");
}

function exportCsv() {
  if (!state.rows.length) {
    setMessage("Primero genera un calendario para exportar.");
    return;
  }

  const posts = Number(activePostsInput.value);
  const columns = ["Fecha", "Día"];
  for (let i = 1; i <= posts; i += 1) {
    columns.push(`Puesto ${i}`);
  }

  const csvRows = [columns.join(",")];

  state.rows.forEach((row) => {
    const line = [row.date, row.dayLabel, ...row.assigned].map(escapeCsvCell).join(",");
    csvRows.push(line);
  });

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `rotaciones_${toISODate(new Date())}.csv`;
  a.click();

  URL.revokeObjectURL(url);
  setMessage("CSV exportado. Puedes abrirlo directamente con Excel.");
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  const needsQuotes = /[",\n]/.test(text);
  if (!needsQuotes) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

function parseInputDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayISO() {
  return toISODate(new Date());
}

function setMessage(message) {
  messageEl.textContent = message;
}
