const sampleContent = {
  modules: [
    {
      id: "m1",
      title: "Agudas",
      rule: "Llevan tilde si terminan en vocal, -n o -s.",
      examples: ["café", "compás", "canción"],
    },
    {
      id: "m2",
      title: "Llanas",
      rule: "Llevan tilde si NO terminan en vocal, -n o -s.",
      examples: ["árbol", "fácil", "lápiz"],
    },
  ],
  items: [
    {
      id: "i1",
      module_id: "m1",
      prompt: "Marca la palabra aguda con tilde correcta:",
      choices: ["cafe", "café", "cafè"],
      correct: "café",
      feedback: "Aguda terminada en vocal lleva tilde: café.",
      word_ids: ["w1"],
      rule_tag: "agudas",
    },
    {
      id: "i2",
      module_id: "m1",
      prompt: "¿Cuál es correcto?",
      choices: ["camion", "camión", "camións"],
      correct: "camión",
      feedback: "Aguda terminada en n lleva tilde.",
      word_ids: ["w2"],
      rule_tag: "agudas",
    },
    {
      id: "i3",
      module_id: "m2",
      prompt: "Selecciona la opción correcta:",
      choices: ["lapiz", "lápiz", "làpiz"],
      correct: "lápiz",
      feedback: "Llena terminada en consonante distinta de n/s lleva tilde.",
      word_ids: ["w3"],
      rule_tag: "llanas",
    },
  ],
};

const state = {
  step: "warmup",
  accuracy: 0,
  streak: 0,
  answered: 0,
  correct: 0,
  newIntroduced: 0,
  queue: [],
};

const stepCopy = {
  warmup: { title: "Warmup", subtitle: "Repaso rápido para calibrar." },
  lesson: { title: "Micro-lección", subtitle: "1 regla con ejemplos breves." },
  practice: { title: "Práctica", subtitle: "Preguntas adaptativas." },
  minimix: { title: "Mini-mix", subtitle: "Mezcla ligera de lo visto." },
  summary: { title: "Resumen", subtitle: "Resultados y próximos pasos." },
};

const sessionSteps = ["warmup", "lesson", "practice", "minimix", "summary"];

function $(id) {
  return document.getElementById(id);
}

function setStep(step) {
  state.step = step;
  const copy = stepCopy[step];
  $("session-step").textContent = copy?.title || step;
  $("session-subtitle").textContent = copy?.subtitle || "";
}

function updateMetrics() {
  const accuracy =
    state.answered === 0 ? "–" : `${Math.round((state.correct / state.answered) * 100)}%`;
  $("accuracy").textContent = accuracy;
  $("streak").textContent = state.streak;
  $("new-count").textContent = state.newIntroduced;
}

function buildLesson(moduleId) {
  const mod = sampleContent.modules.find((m) => m.id === moduleId) || sampleContent.modules[0];
  $("lesson-title").textContent = mod.title;
  $("lesson-body").textContent = mod.rule;
  const ul = $("lesson-examples");
  ul.innerHTML = "";
  mod.examples.forEach((ex) => {
    const li = document.createElement("li");
    li.textContent = ex;
    ul.appendChild(li);
  });
}

function pickItems(limit = 6) {
  const shuffled = [...sampleContent.items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}

function nextItem() {
  if (state.queue.length === 0) {
    finishSummary();
    return;
  }
  const item = state.queue.shift();
  renderItem(item);
}

function renderItem(item) {
  $("prompt").textContent = item.prompt;
  const container = $("choices");
  container.innerHTML = "";
  $("lesson").classList.toggle("hidden", state.step !== "lesson");
  $("summary").classList.add("hidden");
  item.choices.forEach((choiceText) => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.textContent = choiceText;
    btn.onclick = () => handleAnswer(item, choiceText, btn);
    container.appendChild(btn);
  });
}

function handleAnswer(item, choice, button) {
  state.answered += 1;
  const isCorrect = choice === item.correct;
  if (isCorrect) {
    state.correct += 1;
    state.streak += 1;
  } else {
    state.streak = 0;
  }
  updateMetrics();
  showPopover(button, item.feedback, isCorrect);

  setTimeout(() => {
    // Introducir nuevo tras cada 3 respuestas correctas seguidas.
    if (state.streak > 0 && state.streak % 3 === 0 && state.step === "practice") {
      state.newIntroduced += 1;
      const newItem = sampleContent.items[Math.floor(Math.random() * sampleContent.items.length)];
      state.queue.splice(1, 0, newItem);
    }
    advanceStep();
  }, 1100);
}

function showPopover(anchor, text, correct) {
  const pop = $("popover");
  const rect = anchor.getBoundingClientRect();
  pop.textContent = text;
  pop.className = `popover ${correct ? "correct" : "incorrect"}`;
  pop.style.top = `${rect.top - 10}px`;
  pop.style.left = `${rect.left}px`;
  pop.classList.remove("hidden");
  setTimeout(() => pop.classList.add("hidden"), 2000);
}

function startSession() {
  Object.assign(state, {
    step: "warmup",
    accuracy: 0,
    streak: 0,
    answered: 0,
    correct: 0,
    newIntroduced: 0,
    queue: pickItems(8),
  });
  setStep("warmup");
  buildLesson(state.queue[0]?.module_id || "m1");
  updateMetrics();
  nextItem();
}

function advanceStep() {
  if (state.queue.length > 0) {
    nextItem();
    return;
  }
  const currentIndex = sessionSteps.indexOf(state.step);
  if (currentIndex === -1 || currentIndex === sessionSteps.length - 1) {
    finishSummary();
    return;
  }
  const nextStep = sessionSteps[currentIndex + 1];
  setStep(nextStep);
  if (nextStep === "lesson") {
    $("lesson").classList.remove("hidden");
    state.queue = pickItems(3);
  } else if (nextStep === "practice") {
    state.queue = pickItems(4);
  } else if (nextStep === "minimix") {
    state.queue = pickItems(3);
  } else {
    finishSummary();
    return;
  }
  nextItem();
}

function finishSummary() {
  setStep("summary");
  $("summary").classList.remove("hidden");
  const accuracy =
    state.answered === 0 ? 0 : Math.round((state.correct / state.answered) * 100);
  $("summary-accuracy").textContent = `Precisión: ${accuracy}% en ${state.answered} intentos.`;
  $("summary-errors").textContent = `Errores frecuentes: agudas/llanas (simulado).`;
  $("summary-next").textContent = `Próximo: repetir fallos y añadir 1 nuevo si mantienes >85%.`;
  $("prompt").textContent = "Sesión finalizada. Puedes reiniciar cuando quieras.";
  $("choices").innerHTML = "";
}

function handleFileImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const result = $("import-result");
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target?.result;
      if (!text) throw new Error("Archivo vacío");
      const parsed = JSON.parse(text);
      const modules = parsed.modules?.length || 0;
      const items = parsed.items?.length || 0;
      const words = parsed.wordbank?.length || parsed.words?.length || 0;
      result.textContent = `Importado (simulado): ${modules} módulos, ${items} ítems, ${words} palabras.`;
    } catch (err) {
      result.textContent = `Error: ${err.message}`;
    }
  };
  reader.readAsText(file);
}

function openPaywall() {
  alert("Aquí iría el paywall real (Stripe Checkout en producción).");
}

document.addEventListener("DOMContentLoaded", () => {
  $("start-session")?.addEventListener("click", startSession);
  $("content-file")?.addEventListener("change", handleFileImport);
  $("open-paywall")?.addEventListener("click", openPaywall);
});
