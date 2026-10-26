// 1. los datos
// cada nivel con tamaño del tablero y los pares de puntos [fila, columna]
const levels = [
  {
    size: 5,
    pairs: [
      { color: "blue", a: [0, 0], b: [4, 2] },
      { color: "red", a: [0, 1], b: [2, 4] },
      { color: "green", a: [1, 1], b: [2, 1] },
      { color: "orange", a: [3, 1], b: [4, 3] },
    ],
  },
  {
    size: 6,
    pairs: [
      { color: "red", a: [0, 0], b: [0, 2] },
      { color: "blue", a: [0, 3], b: [1, 3] },
      { color: "green", a: [1, 2], b: [2, 3] },
      { color: "orange", a: [2, 4], b: [3, 3] },
      { color: "purple", a: [3, 2], b: [4, 4] },
      { color: "yellow", a: [4, 5], b: [5, 0] },
    ],
  },
];

const colors = {
  red: "#ff5c7a",
  blue: "#4da6ff",
  green: "#3ddc97",
  orange: "#ffa94d",
  purple: "#b17dff",
  yellow: "#ffe14d",
};

// 2. la memoria del juego: qué nivel, tamaño, tablero, caminos, colores activos...
let current = 0; // qué nivel se está jugando (0 = nivel 1, 1 = nivel 2)
let size = 0; // tamaño del tablero (5 o 6)
let board = []; // board[fila][columna] = color de la celda, o null si está vacía
let paths = {}; // paths.red = lista de celdas por las que pasa el camino rojo
let done = {}; // done.red = true cuando el rojo ya une sus dos puntos
let activeColor = null; // color que se está dibujando ahora mismo (null = ninguno)

// elementos del html mas usados, para no buscarlos cada vez
const home = document.getElementById("home");
const game = document.getElementById("game");
const boardEl = document.getElementById("board");
const message = document.getElementById("message");
const nextBtn = document.getElementById("next");

// 3.nuevo nivel: inicializa todas las variables y deja el tablero vacío
function startLevel(n) {
  current = n;
  const level = levels[n];
  size = level.size;

  // tablero vacío: size filas, cada una con size huecos "null"
  board = [];
  for (let r = 0; r < size; r++) board.push(Array(size).fill(null));

  paths = {};
  done = {};
  level.pairs.forEach((p) => {
    paths[p.color] = [];
    done[p.color] = false;
    board[p.a[0]][p.a[1]] = p.color; // colocamos los dos puntos del color
    board[p.b[0]][p.b[1]] = p.color;
  });

  // celdas (divs) del tablero
  boardEl.innerHTML = "";
  boardEl.style.gridTemplateColumns = `repeat(${size}, 64px)`;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const div = document.createElement("div");
      div.className = "cell";
      div.dataset.r = r; // guardamos su fila y columna dentro del propio div
      div.dataset.c = c;
      boardEl.appendChild(div);
    }
  }

  // mostramos pantalla de juego y escondemos la de inicio
  home.classList.add("hidden");
  game.classList.remove("hidden");
  document.getElementById("level-title").textContent =
    `Level ${n + 1} · ${level.pairs.length} colors`;
  nextBtn.classList.add("hidden");
  message.textContent = "Connect the dots and fill every cell!";
  paint();
}

// 4. pintar el tablero: cada celda con su color y los puntos fijos con un puntito
// recorre todas las celdas y les pone el color que dice "board".
function paint() {
  for (let i = 0; i < boardEl.children.length; i++) {
    const r = Math.floor(i / size);
    const c = i % size;
    const color = board[r][c];
    boardEl.children[i].style.background = color ? colors[color] : "";
    boardEl.children[i].classList.toggle("dot", isDot(r, c));
  }
}

// 5. ayudas ( à reviser ce que je ne finisse de comprendre)
// ¿esta celda es uno de los puntos fijos?
function isDot(r, c) {
  return levels[current].pairs.some(
    (p) => (p.a[0] === r && p.a[1] === c) || (p.b[0] === r && p.b[1] === c),
  );
}

// ¿está la celda [r, c] dentro de esta lista de celdas?
function indexIn(list, r, c) {
  return list.findIndex((cell) => cell[0] === r && cell[1] === c);
}

// acorta el camino de un color: se queda con las primeras "keep" celdas
// y vacía el resto (menos los puntos fijos, que nunca se vacían).
function cutPath(color, keep) {
  const removed = paths[color].splice(keep);
  removed.forEach(([r, c]) => {
    if (!isDot(r, c)) board[r][c] = null;
  });
  done[color] = false;
}

// dado un evento del ratón/dedo, devuelve en qué celda está [fila, columna]
function getCell(e) {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (!el || !el.classList.contains("cell")) return null;
  return [Number(el.dataset.r), Number(el.dataset.c)];
}

// 6. el jugador aprieta (ratón/dedo hacia abajo)
boardEl.addEventListener("pointerdown", (e) => {
  const cell = getCell(e);
  if (!cell) return;
  const [r, c] = cell;
  const color = board[r][c];
  if (!color) return; // celda vacía: no se puede empezar aquí

  activeColor = color;
  if (isDot(r, c)) {
    cutPath(color, 0); // tocó un punto: borramos ese camino y empezamos de nuevo
    paths[color] = [cell];
  } else {
    cutPath(color, indexIn(paths[color], r, c) + 1); // tocó el camino: lo cortamos ahí
  }
  paint();
  checkWin();
});

// 7. el jugador mueve el ratón/dedo mientras está apretando
boardEl.addEventListener("pointermove", (e) => {
  if (!activeColor) return; // si no está dibujando, no hacemos nada
  const cell = getCell(e);
  if (!cell) return;
  const [r, c] = cell;

  const path = paths[activeColor];
  const last = path[path.length - 1];

  // solo aceptamos la celda si no hay diagonales ni saltos
  if (Math.abs(r - last[0]) + Math.abs(c - last[1]) !== 1) return;

  const prev = path[path.length - 2];
  if (prev && prev[0] === r && prev[1] === c) {
    cutPath(activeColor, path.length - 1); // vuelve atrás un paso
  } else if (board[r][c] === null) {
    board[r][c] = activeColor; // celda vacía: el camino avanza
    path.push(cell);
  } else if (
    board[r][c] === activeColor &&
    isDot(r, c) &&
    indexIn(path, r, c) === -1
  ) {
    path.push(cell); // llegó al otro punto: ¡conectado!
    done[activeColor] = true;
    activeColor = null;
  } else {
    return; // celda de otro color: no se puede pasar
  }
  paint();
  checkWin();
});

// 8. el jugador suelta el ratón/dedo: deja de dibujar
window.addEventListener("pointerup", () => {
  activeColor = null;
});

// 9. ganado/terminado ?
// tiene que cumplirse todo: todos los colores conectados y ninguna celda vacía
function checkWin() {
  const allConnected = Object.values(done).every((d) => d);
  const allFilled = board.every((row) => row.every((cell) => cell !== null));

  nextBtn.classList.add("hidden");
  if (allConnected && allFilled) {
    if (current < levels.length - 1) {
      message.textContent = "Level complete! 🎉";
      nextBtn.classList.remove("hidden"); // solo aparece si hay un nivel siguiente
    } else {
      message.textContent = "You finished all the levels! 🎉";
    }
  } else if (allConnected) {
    message.textContent = "All connected, but fill every cell!";
  } else {
    message.textContent = "Connect the dots and fill every cell!";
  }
}

// 10. los botones de la pantalla de inicio y del juego
document
  .getElementById("go-level1")
  .addEventListener("click", () => startLevel(0));
document
  .getElementById("go-level2")
  .addEventListener("click", () => startLevel(1));
document
  .getElementById("restart")
  .addEventListener("click", () => startLevel(current));
nextBtn.addEventListener("click", () => startLevel(current + 1));
document.getElementById("home-btn").addEventListener("click", () => {
  game.classList.add("hidden");
  home.classList.remove("hidden");
});
