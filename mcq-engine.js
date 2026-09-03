/*
  EduPath IQ — Reusable MCQ Engine
  ---------------------------------
  To create another MCQ test, keep the same page structure and replace only:
    const TEST_CONFIG = {...};
    const QUESTIONS = [
      { question: "Your question", options: ["A","B","C","D"], answer: 0 }
    ];

  answer is the option index: 0=A, 1=B, 2=C, 3=D.
*/
(() => {
  const config = window.TEST_CONFIG || {};
  const questions = window.QUESTIONS || [];
  const state = { current: 0, answers: Array(questions.length).fill(null), submitted: false, seconds: (config.minutes || 20) * 60 };

  const $ = (id) => document.getElementById(id);

  function render() {
    $("totalQuestions").textContent = questions.length;
    $("totalMarks").textContent = questions.length;
    $("testTitle").textContent = config.title || "MCQ Test";
    $("testSubtitle").textContent = `${config.chapter || ""} • ${questions.length} Questions • ${questions.length} Marks`;

    const q = questions[state.current];
    $("questionNumber").textContent = `Question ${state.current + 1} of ${questions.length}`;
    $("questionText").textContent = q.question;
    $("progressBar").style.width = `${((state.current + 1) / questions.length) * 100}%`;

    const options = $("options");
    options.innerHTML = "";
    q.options.forEach((text, i) => {
      const label = document.createElement("label");
      label.className = "mcq-option";
      label.innerHTML = `<input type="radio" name="currentQuestion" value="${i}"><span class="option-letter">${String.fromCharCode(65+i)}</span><span>${text}</span>`;
      const input = label.querySelector("input");
      input.checked = state.answers[state.current] === i;
      input.addEventListener("change", () => {
        state.answers[state.current] = i;
        updateNav();
      });
      options.appendChild(label);
    });

    $("prevBtn").disabled = state.current === 0;
    $("nextBtn").textContent = state.current === questions.length - 1 ? "Review Test" : "Next →";
    updateNav();
  }

  function updateNav() {
    document.querySelectorAll(".q-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === state.current);
      dot.classList.toggle("answered", state.answers[i] !== null);
    });
    const attempted = state.answers.filter(v => v !== null).length;
    $("attemptedLive").textContent = attempted;
  }

  function submitTest(auto = false) {
    if (state.submitted) return;
    state.submitted = true;
    let correct = 0, wrong = 0, unattempted = 0;
    questions.forEach((q, i) => {
      const a = state.answers[i];
      if (a === null) unattempted++;
      else if (a === q.answer) correct++;
      else wrong++;
    });
    const total = questions.length, pct = total ? Math.round(correct / total * 100) : 0;
    $("score").textContent = `${correct} / ${total}`;
    $("percent").textContent = `${pct}%`;
    $("correctCount").textContent = correct;
    $("wrongCount").textContent = wrong;
    $("unattemptedCount").textContent = unattempted;
    $("resultTitle").textContent = auto ? "⏰ Time Up — Test Completed" : "🎉 Test Completed";

    const review = $("review");
    review.innerHTML = questions.map((q, i) => {
      const selected = state.answers[i];
      const status = selected === null ? "not-attempted" : selected === q.answer ? "correct" : "wrong";
      const statusText = selected === null ? "Not Attempted" : selected === q.answer ? "Correct" : "Incorrect";
      const your = selected === null ? "Not Attempted" : `${String.fromCharCode(65+selected)}. ${q.options[selected]}`;
      const correctAnswer = `${String.fromCharCode(65+q.answer)}. ${q.options[q.answer]}`;
      return `<article class="review-item ${status}">
        <div class="review-top"><span>Q${i+1}</span><b>${statusText}</b></div>
        <h3>${q.question}</h3>
        <p><strong>Your Answer:</strong> ${your}</p>
        <p><strong>Correct Answer:</strong> ${correctAnswer}</p>
      </article>`;
    }).join("");

    $("testArea").style.display = "none";
    $("result").style.display = "block";
    window.scrollTo({top: 0, behavior: "smooth"});
  }

  function resetTest() {
    state.current = 0; state.answers.fill(null); state.submitted = false;
    state.seconds = (config.minutes || 20) * 60;
    $("result").style.display = "none";
    $("testArea").style.display = "block";
    render(); startTimer();
    window.scrollTo({top: 0, behavior: "smooth"});
  }

  function startTimer() {
    clearInterval(window.__epqTimer);
    const tick = () => {
      const m = Math.floor(state.seconds / 60).toString().padStart(2,"0");
      const s = (state.seconds % 60).toString().padStart(2,"0");
      $("timer").textContent = `${m}:${s}`;
      if (state.seconds <= 0) { clearInterval(window.__epqTimer); submitTest(true); return; }
      state.seconds--;
    };
    tick(); window.__epqTimer = setInterval(tick, 1000);
  }

  $("prevBtn").addEventListener("click", () => { if (state.current > 0) { state.current--; render(); }});
  $("nextBtn").addEventListener("click", () => { if (state.current < questions.length - 1) { state.current++; render(); } else $("submitBtn").focus(); });
  $("submitBtn").addEventListener("click", () => submitTest(false));
  $("retakeBtn").addEventListener("click", resetTest);

  const nav = $("questionNav");
  questions.forEach((_, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "q-dot"; b.textContent = i + 1;
    b.addEventListener("click", () => { state.current = i; render(); });
    nav.appendChild(b);
  });
  render(); startTimer();
})();