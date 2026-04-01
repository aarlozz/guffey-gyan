import { useState, useEffect, useRef, useCallback } from "react";
import Papa from "papaparse";

// ─── Constants ────────────────────────────────────────────────────────────────
const APP_NAME = "गफ्फे Gyan"; // "Gaffey Gyan" = Chatty Knowledge 😄
const APP_TAGLINE = "सिक्नुस् — जित्नुस् — हाँस्नुस्"; // Learn — Win — Laugh
const OPTION_KEYS = ["A", "B", "C", "D"];
const AVAILABLE_DAYS = Array.from({ length: 14 }, (_, i) => `day${i + 1}`);
const QUIZ_DURATION = 20 * 60; // 20 minutes in seconds
const RESULTS_KEY = "gaffegyan_results"; // localStorage key for score log

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const timerColor = (s) =>
  s <= 60 ? "#ef4444" : s <= 300 ? "#f59e0b" : "#6ee7b7";

function getMsg(score, total) {
  const p = total === 0 ? 0 : (score / total) * 100;
  if (p === 100)
    return {
      title: "सत् प्रतिशत! 🎉",
      sub: "एकदमै राम्रो! Perfect score!",
      badge: "#22c55e",
      label: "Perfect",
    };
  if (p >= 70)
    return {
      title: "वाह! धेरै राम्रो 👏",
      sub: "Great work! Keep it up.",
      badge: "#6ee7b7",
      label: "Good",
    };
  if (p >= 40)
    return {
      title: "ठीकै छ 💪",
      sub: "Not bad! A bit more practice.",
      badge: "#f59e0b",
      label: "Fair",
    };
  return {
    title: "फेरि कोसिस गर! 📚",
    sub: "Review and try again — you can do it!",
    badge: "#ef4444",
    label: "Needs Work",
  };
}

function saveResult({ nickname, day, score, total, timedOut }) {
  const prev = JSON.parse(localStorage.getItem(RESULTS_KEY) || "[]");
  prev.push({
    nickname,
    day,
    score,
    total,
    pct: Math.round((score / total) * 100),
    timedOut,
    at: new Date().toLocaleString("en-NP", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  });
  localStorage.setItem(RESULTS_KEY, JSON.stringify(prev));
}

function loadResults() {
  return JSON.parse(localStorage.getItem(RESULTS_KEY) || "[]");
}

// ─── Timer Hook ───────────────────────────────────────────────────────────────
function useCountdown(active, onExpire) {
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION);
  const ref = useRef(null);
  const cbRef = useRef(onExpire);
  cbRef.current = onExpire;

  const reset = useCallback(() => {
    clearInterval(ref.current);
    setTimeLeft(QUIZ_DURATION);
  }, []);

  useEffect(() => {
    if (!active) {
      clearInterval(ref.current);
      return;
    }
    ref.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(ref.current);
          cbRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [active]);

  return { timeLeft, reset };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN: Nickname Entry
// ═══════════════════════════════════════════════════════════════════════════════
function NicknameScreen({ onStart }) {
  const [nick, setNick] = useState("");
  const [err, setErr] = useState("");

  const go = () => {
    const n = nick.trim();
    if (!n) {
      setErr("Please enter your nickname to continue!");
      return;
    }
    if (n.length > 30) {
      setErr("Keep it under 30 characters please 😄");
      return;
    }
    onStart(n);
  };

  return (
    <div style={ns.wrap}>
      <div style={ns.card}>
        {/* Logo */}
        <div style={ns.logo}>{APP_NAME}</div>
        <div style={ns.tagline}>{APP_TAGLINE}</div>

        <div style={ns.divider} />

        <p style={ns.prompt}>
          तपाईंको नाम के हो?{" "}
          <span style={{ color: "#6ee7b7" }}>What's your name?</span>
        </p>
        <input
          style={{ ...ns.input, ...(err ? ns.inputErr : {}) }}
          type="text"
          placeholder="e.g. Sita, Ram, Bikash…"
          value={nick}
          maxLength={30}
          onChange={(e) => {
            setNick(e.target.value);
            setErr("");
          }}
          onKeyDown={(e) => e.key === "Enter" && go()}
          autoFocus
        />
        {err && <div style={ns.errMsg}>{err}</div>}

        <button style={ns.btn} onClick={go}>
          सुरु गरौं! &nbsp;Let's Go →
        </button>

        <p style={ns.note}>
          Your nickname will be saved with your score so your teacher can find
          it later.
        </p>
      </div>
    </div>
  );
}

const ns = {
  wrap: {
    minHeight: "100vh",
    background: "#0a0a10",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    background: "#13131a",
    border: "1px solid #1e1e2e",
    borderRadius: 20,
    padding: "48px 40px",
    maxWidth: 440,
    width: "100%",
    textAlign: "center",
  },
  logo: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 36,
    color: "#fff",
    letterSpacing: "-1px",
    lineHeight: 1.2,
    background: "linear-gradient(135deg, #6ee7b7, #34d399)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  tagline: {
    fontSize: 13,
    color: "#444",
    marginTop: 8,
    letterSpacing: "0.5px",
    fontWeight: 500,
  },
  divider: {
    height: 1,
    background: "#1e1e2e",
    margin: "28px 0",
  },
  prompt: {
    fontSize: 16,
    color: "#bbb",
    marginBottom: 16,
    fontWeight: 500,
  },
  input: {
    width: "100%",
    background: "#0f0f13",
    border: "1.5px solid #2a2a3e",
    borderRadius: 10,
    padding: "13px 16px",
    fontSize: 15,
    color: "#e8e6f0",
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.2s",
    marginBottom: 6,
    boxSizing: "border-box",
  },
  inputErr: {
    borderColor: "#ef4444",
  },
  errMsg: {
    color: "#fca5a5",
    fontSize: 13,
    marginBottom: 12,
    textAlign: "left",
  },
  btn: {
    marginTop: 16,
    width: "100%",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 15,
    padding: "14px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #34d399, #059669)",
    color: "#fff",
    cursor: "pointer",
    letterSpacing: "0.3px",
    boxShadow: "0 4px 24px #34d39944",
    transition: "all 0.2s",
  },
  note: {
    marginTop: 20,
    fontSize: 12,
    color: "#333",
    lineHeight: 1.6,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN: Results Log (admin view — click logo 3x fast)
// ═══════════════════════════════════════════════════════════════════════════════
function ResultsLog({ onClose }) {
  const results = loadResults();

  const copyCSV = () => {
    const header = "Nickname,Day,Score,Total,%,Timed Out,Submitted At";
    const rows = results.map(
      (r) =>
        `${r.nickname},${r.day},${r.score},${r.total},${r.pct}%,${r.timedOut ? "Yes" : "No"},"${r.at}"`,
    );
    navigator.clipboard.writeText([header, ...rows].join("\n"));
  };

  const clearAll = () => {
    if (window.confirm("Clear all saved results? This cannot be undone.")) {
      localStorage.removeItem(RESULTS_KEY);
      onClose();
    }
  };

  return (
    <div style={rl.overlay}>
      <div style={rl.panel}>
        <div style={rl.header}>
          <div style={rl.title}>📋 Score Records</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={rl.actionBtn("#34d399")} onClick={copyCSV}>
              Copy CSV
            </button>
            <button style={rl.actionBtn("#ef4444")} onClick={clearAll}>
              Clear All
            </button>
            <button style={rl.closeBtn} onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {results.length === 0 ? (
          <div style={rl.empty}>
            No submissions yet. Results will appear here after students submit.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={rl.table}>
              <thead>
                <tr>
                  {[
                    "#",
                    "Nickname",
                    "Day",
                    "Score",
                    "%",
                    "Timeout",
                    "Submitted At",
                  ].map((h) => (
                    <th key={h} style={rl.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results
                  .slice()
                  .reverse()
                  .map((r, i) => (
                    <tr key={i} style={i % 2 === 0 ? rl.rowEven : rl.rowOdd}>
                      <td style={rl.td}>{results.length - i}</td>
                      <td
                        style={{ ...rl.td, color: "#6ee7b7", fontWeight: 600 }}
                      >
                        {r.nickname}
                      </td>
                      <td style={rl.td}>{r.day}</td>
                      <td style={rl.td}>
                        {r.score}/{r.total}
                      </td>
                      <td
                        style={{
                          ...rl.td,
                          color:
                            r.pct >= 70
                              ? "#6ee7b7"
                              : r.pct >= 40
                                ? "#f59e0b"
                                : "#ef4444",
                          fontWeight: 700,
                        }}
                      >
                        {r.pct}%
                      </td>
                      <td style={rl.td}>{r.timedOut ? "⏰ Yes" : "—"}</td>
                      <td style={{ ...rl.td, color: "#444", fontSize: 12 }}>
                        {r.at}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const rl = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "#000000cc",
    zIndex: 999,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "40px 16px",
    overflowY: "auto",
    backdropFilter: "blur(6px)",
  },
  panel: {
    background: "#13131a",
    border: "1px solid #2a2a3e",
    borderRadius: 18,
    width: "100%",
    maxWidth: 820,
    padding: "28px",
    fontFamily: "'DM Sans', sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 10,
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 20,
    color: "#fff",
  },
  actionBtn: (color) => ({
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    padding: "7px 14px",
    borderRadius: 8,
    border: `1.5px solid ${color}44`,
    background: `${color}11`,
    color,
    cursor: "pointer",
  }),
  closeBtn: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    padding: "7px 12px",
    borderRadius: 8,
    border: "1.5px solid #2a2a3e",
    background: "transparent",
    color: "#666",
    cursor: "pointer",
  },
  empty: {
    color: "#444",
    textAlign: "center",
    padding: "40px 0",
    fontSize: 15,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: "10px 14px",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: "0.5px",
    color: "#444",
    borderBottom: "1px solid #1e1e2e",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px 14px",
    color: "#bbb",
    borderBottom: "1px solid #1a1a24",
    whiteSpace: "nowrap",
  },
  rowEven: { background: "transparent" },
  rowOdd: { background: "#0f0f1388" },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN QUIZ APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("nickname"); // 'nickname' | 'quiz'
  const [nickname, setNickname] = useState("");
  const [selectedDay, setSelectedDay] = useState("day1");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLog, setShowLog] = useState(false);

  // Triple-click on logo → open results log
  const clickCount = useRef(0);
  const clickTimer = useRef(null);
  const handleLogoClick = () => {
    clickCount.current += 1;
    clearTimeout(clickTimer.current);
    if (clickCount.current >= 3) {
      clickCount.current = 0;
      setShowLog(true);
      return;
    }
    // Single click = full restart
    if (clickCount.current === 1) {
      clickTimer.current = setTimeout(() => {
        clickCount.current = 0;
        handleFullReset();
      }, 350);
    } else {
      clickTimer.current = setTimeout(() => {
        clickCount.current = 0;
      }, 500);
    }
  };

  const handleFullReset = () => {
    setScreen("nickname");
    setNickname("");
    setSelectedDay("day1");
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setTimedOut(false);
    setScore(null);
    setError("");
  };

  // Refs for timer callback
  const answersRef = useRef(answers);
  const questionsRef = useRef(questions);
  answersRef.current = answers;
  questionsRef.current = questions;

  const finalizeQuiz = useCallback(
    (ans, qs, tOut = false) => {
      let correct = 0;
      qs.forEach((q) => {
        if (ans[q.sn]?.toUpperCase() === q.answer?.toUpperCase()) correct++;
      });
      setScore(correct);
      setSubmitted(true);
      // Save to log
      saveResult({
        nickname: nickname || "(no name)",
        day: selectedDay,
        score: correct,
        total: qs.length,
        timedOut: tOut,
      });
    },
    [nickname, selectedDay],
  );

  const handleExpire = useCallback(() => {
    setTimedOut(true);
    finalizeQuiz(answersRef.current, questionsRef.current, true);
  }, [finalizeQuiz]);

  const timerActive =
    screen === "quiz" &&
    !submitted &&
    !loading &&
    !error &&
    questions.length > 0;
  const { timeLeft, reset: resetTimer } = useCountdown(
    timerActive,
    handleExpire,
  );

  // Load CSV on day change (only when on quiz screen)
  useEffect(() => {
    if (screen !== "quiz") return;
    setLoading(true);
    setError("");
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setTimedOut(false);
    setScore(null);
    resetTimer();

    Papa.parse(`/${selectedDay}.csv`, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const required = [
          "sn",
          "question",
          "optionA",
          "optionB",
          "optionC",
          "optionD",
          "answer",
        ];
        const missing = required.filter(
          (h) => !(results.meta.fields || []).includes(h),
        );
        if (missing.length) {
          setError(`CSV missing columns: ${missing.join(", ")}`);
          setLoading(false);
          return;
        }
        const valid = results.data.filter(
          (row) =>
            row.question?.trim() &&
            row.optionA?.trim() &&
            row.optionB?.trim() &&
            row.optionC?.trim() &&
            row.optionD?.trim() &&
            ["A", "B", "C", "D"].includes(row.answer?.trim().toUpperCase()),
        );
        if (!valid.length) {
          setError("No valid questions found.");
          setLoading(false);
          return;
        }
        setQuestions(valid);
        setLoading(false);
      },
      error: () => {
        setError(`Could not load ${selectedDay}.csv`);
        setLoading(false);
      },
    });
  }, [selectedDay, screen]);

  const handleSelect = (sn, option) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [sn]: option }));
  };

  const handleSubmit = () => {
    if (!submitted) finalizeQuiz(answers, questions, false);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setTimedOut(false);
    setScore(null);
    resetTimer();
  };

  const answeredCount = Object.keys(answers).length;
  const progress =
    questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  // ── Nickname screen ──────────────────────────────────────────────────────────
  if (screen === "nickname") {
    return (
      <>
        <GlobalStyles />
        <NicknameScreen
          onStart={(n) => {
            setNickname(n);
            setScreen("quiz");
          }}
        />
        {showLog && <ResultsLog onClose={() => setShowLog(false)} />}
      </>
    );
  }

  // ── Quiz screen ──────────────────────────────────────────────────────────────
  return (
    <>
      <GlobalStyles />
      {showLog && <ResultsLog onClose={() => setShowLog(false)} />}

      <div style={s.root}>
        {/* ── Header ── */}
        <header style={s.header}>
          <div style={s.headerInner}>
            {/* Logo — click to restart, triple-click for log */}
            <div
              style={s.logo}
              onClick={handleLogoClick}
              title="Click to restart • Triple-click for score log"
            >
              <span style={s.logoGlow} />
              {APP_NAME}
            </div>

            {/* Nickname pill */}
            <div style={s.nickPill}>👤 {nickname}</div>

            {/* Day picker */}
            <div style={s.dayRow}>
              {AVAILABLE_DAYS.map((day) => (
                <button
                  key={day}
                  className="day-btn"
                  style={s.dayBtn(selectedDay === day, submitted && !timedOut)}
                  disabled={submitted && !timedOut}
                  onClick={() => setSelectedDay(day)}
                >
                  {day.replace("day", "D")}
                </button>
              ))}
            </div>

            {/* Timer */}
            {questions.length > 0 && (
              <div style={s.timerWrap}>
                <span style={s.timerLabel}>⏱</span>
                <div
                  style={s.timerBox(submitted ? 0 : timeLeft)}
                  className={!submitted && timeLeft <= 60 ? "timer-urgent" : ""}
                >
                  {fmt(submitted ? 0 : timeLeft)}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ── Body ── */}
        <div style={s.container}>
          {loading && (
            <div style={s.loadingBox}>
              <div style={s.spinner} />
              प्रश्नहरू लोड हुँदैछ… Loading questions…
            </div>
          )}

          {!loading && error && <div style={s.errorBox}>⚠️ &nbsp;{error}</div>}

          {!loading && !error && questions.length > 0 && (
            <>
              <div style={s.quizMeta}>
                <div>
                  <h1 style={s.quizTitle}>
                    {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}{" "}
                    Quiz
                  </h1>
                  <div style={s.subLine}>
                    Good luck,{" "}
                    <span style={{ color: "#6ee7b7" }}>{nickname}</span>! 🍀
                  </div>
                </div>
                <span style={s.countPill}>
                  {answeredCount}/{questions.length}
                </span>
              </div>

              <div style={s.progressBar}>
                <div style={s.progressFill(submitted ? 100 : progress)} />
              </div>

              {timedOut && (
                <div style={s.timeoutBanner}>
                  ⏰ &nbsp;समय सकियो! Time's up! Auto-submitted with your
                  current answers.
                </div>
              )}

              {/* Questions */}
              {questions.map((q, idx) => {
                const selected = answers[q.sn];
                const correct = q.answer?.toUpperCase();
                const isCorrect =
                  submitted && selected?.toUpperCase() === correct;
                const isWrong =
                  submitted && selected && selected?.toUpperCase() !== correct;

                return (
                  <div
                    key={q.sn}
                    className="question-card"
                    style={{
                      ...s.questionCard(
                        submitted,
                        isCorrect ? true : isWrong ? false : null,
                      ),
                      animationDelay: `${Math.min(idx * 0.04, 0.5)}s`,
                    }}
                  >
                    <div style={s.questionHeader}>
                      <span style={s.qNum}>Q{idx + 1}</span>
                      <p style={s.qText}>{q.question}</p>
                    </div>
                    <div style={s.optionsGrid}>
                      {OPTION_KEYS.map((key) => {
                        const isSelected = selected?.toUpperCase() === key;
                        const optCorrect = submitted && key === correct;
                        const optWrong =
                          submitted && isSelected && key !== correct;
                        return (
                          <label
                            key={key}
                            className="option-label"
                            style={s.optionLabel(
                              isSelected,
                              submitted,
                              optCorrect,
                              optWrong,
                            )}
                            onClick={() => handleSelect(q.sn, key)}
                          >
                            <input
                              type="radio"
                              name={`q-${q.sn}`}
                              value={key}
                              checked={isSelected}
                              onChange={() => handleSelect(q.sn, key)}
                              disabled={submitted}
                              style={{ display: "none" }}
                            />
                            <span
                              style={s.optionKey(
                                isSelected,
                                submitted,
                                optCorrect,
                                optWrong,
                              )}
                            >
                              {key}
                            </span>
                            {q[`option${key}`]}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Score card */}
              {submitted &&
                score !== null &&
                (() => {
                  const msg = getMsg(score, questions.length);
                  return (
                    <div style={s.scoreCard}>
                      <div style={{ textAlign: "center" }}>
                        <div style={s.scoreBig}>
                          {score}/{questions.length}
                        </div>
                        <div style={s.scoreLabel}>तपाईंको अंक</div>
                      </div>
                      <div style={s.scoreDivider} />
                      <div style={{ flex: 1 }}>
                        <div style={s.scoreTitle}>{msg.title}</div>
                        <div style={s.scoreSub}>{msg.sub}</div>
                        <span style={s.badge(msg.badge)}>{msg.label}</span>
                        <div style={s.savedNote}>
                          ✅ Score saved for <b>{nickname}</b>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              {/* Actions */}
              <div style={s.submitArea}>
                {!submitted ? (
                  <>
                    <button
                      className="submit-btn"
                      style={s.submitBtn(answeredCount < questions.length)}
                      onClick={handleSubmit}
                      disabled={answeredCount < questions.length}
                    >
                      Submit Quiz
                    </button>
                    {answeredCount < questions.length && (
                      <span style={{ fontSize: 13, color: "#333" }}>
                        {questions.length - answeredCount} remaining
                      </span>
                    )}
                  </>
                ) : (
                  <button
                    className="retry-btn"
                    style={s.retryBtn}
                    onClick={handleRetry}
                  >
                    फेरि कोसिस — Try Again
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Inline global styles ──────────────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #0a0a10; }
      @keyframes spin   { to { transform: rotate(360deg); } }
      @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      @keyframes pulse  { 0%,100%{opacity:1;} 50%{opacity:0.45;} }
      @keyframes glow   { 0%,100%{box-shadow:0 0 10px #34d39966;} 50%{box-shadow:0 0 22px #34d399cc;} }
      .question-card  { animation: fadeUp 0.3s ease both; }
      .option-label:hover  { filter: brightness(1.1); }
      .day-btn:not([disabled]):hover { border-color:#6ee7b7 !important; color:#6ee7b7 !important; }
      .submit-btn:hover:not(:disabled) { transform:translateY(-1px); filter:brightness(1.1); }
      .retry-btn:hover { border-color:#6ee7b7 !important; color:#6ee7b7 !important; }
      .timer-urgent { animation: pulse 0.8s ease-in-out infinite; }
      input:focus { border-color:#6ee7b7 !important; outline:none; }
    `}</style>
  );
}

// ─── Quiz screen styles ────────────────────────────────────────────────────────
const s = {
  root: {
    minHeight: "100vh",
    background: "#0a0a10",
    color: "#e8e6f0",
    fontFamily: "'DM Sans', sans-serif",
    padding: "0 0 80px",
  },
  header: {
    background: "#0a0a10dd",
    borderBottom: "1px solid #1a1a28",
    padding: "12px 0",
    position: "sticky",
    top: 0,
    zIndex: 100,
    backdropFilter: "blur(14px)",
  },
  headerInner: {
    maxWidth: 920,
    margin: "0 auto",
    padding: "0 20px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  logo: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 18,
    background: "linear-gradient(135deg, #6ee7b7, #34d399)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    cursor: "pointer",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: 7,
    userSelect: "none",
  },
  logoGlow: {
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#34d399",
    animation: "glow 2s ease-in-out infinite",
  },
  nickPill: {
    fontSize: 12,
    fontWeight: 600,
    color: "#6ee7b7",
    background: "#6ee7b711",
    border: "1px solid #6ee7b733",
    borderRadius: 99,
    padding: "4px 12px",
    flexShrink: 0,
  },
  dayRow: {
    display: "flex",
    gap: 4,
    flexWrap: "wrap",
    flex: 1,
    justifyContent: "center",
  },
  dayBtn: (active, disabled) => ({
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 11,
    padding: "4px 9px",
    borderRadius: 99,
    border: active ? "1.5px solid #34d399" : "1.5px solid #1e1e2e",
    background: active ? "#34d39922" : "transparent",
    color: active ? "#6ee7b7" : disabled ? "#2a2a3e" : "#444",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s",
    opacity: disabled ? 0.4 : 1,
  }),
  timerWrap: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  timerLabel: { fontSize: 14, color: "#444" },
  timerBox: (sec) => ({
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 16,
    letterSpacing: "2px",
    color: timerColor(sec),
    background: `${timerColor(sec)}11`,
    border: `1.5px solid ${timerColor(sec)}44`,
    borderRadius: 8,
    padding: "5px 12px",
    transition: "color 0.5s, background 0.5s, border-color 0.5s",
    minWidth: 80,
    textAlign: "center",
  }),
  container: { maxWidth: 740, margin: "0 auto", padding: "32px 20px 0" },
  quizMeta: {
    marginBottom: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  quizTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 24,
    color: "#fff",
    letterSpacing: "-0.7px",
  },
  subLine: { fontSize: 13, color: "#444", marginTop: 4 },
  countPill: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    color: "#6ee7b7",
    background: "#6ee7b711",
    border: "1px solid #6ee7b733",
    borderRadius: 99,
    padding: "5px 14px",
  },
  progressBar: {
    height: 3,
    background: "#1a1a28",
    borderRadius: 99,
    marginBottom: 22,
    overflow: "hidden",
  },
  progressFill: (pct) => ({
    height: "100%",
    width: `${pct}%`,
    background: "linear-gradient(90deg, #34d399, #6ee7b7)",
    borderRadius: 99,
    transition: "width 0.4s ease",
  }),
  timeoutBanner: {
    background: "#ef444411",
    border: "1px solid #ef444433",
    borderRadius: 12,
    padding: "12px 16px",
    marginBottom: 18,
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#fca5a5",
    fontSize: 14,
    fontWeight: 500,
  },
  questionCard: (submitted, correct) => {
    let border = "1px solid #1a1a28";
    if (submitted && correct === true) border = "1px solid #34d39944";
    if (submitted && correct === false) border = "1px solid #ef444444";
    return {
      background: "#11111a",
      border,
      borderRadius: 13,
      padding: "20px 20px 16px",
      marginBottom: 11,
      transition: "border-color 0.3s",
    };
  },
  questionHeader: { display: "flex", gap: 11, marginBottom: 14 },
  qNum: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 11,
    color: "#34d399",
    background: "#34d39911",
    border: "1px solid #34d39933",
    borderRadius: 6,
    padding: "2px 8px",
    whiteSpace: "nowrap",
    alignSelf: "flex-start",
    marginTop: 2,
  },
  qText: { fontSize: 15, fontWeight: 500, lineHeight: 1.65, color: "#ccc" },
  optionsGrid: { display: "flex", flexDirection: "column", gap: 7 },
  optionLabel: (sel, sub, cor, wr) => {
    let bg = "#0a0a10",
      border = "1px solid #1a1a28",
      color = "#777";
    if (sel && !sub) {
      bg = "#34d39911";
      border = "1px solid #34d399";
      color = "#e8e6f0";
    }
    if (sub && cor) {
      bg = "#22c55e11";
      border = "1px solid #22c55e66";
      color = "#86efac";
    }
    if (sub && wr) {
      bg = "#ef444411";
      border = "1px solid #ef444466";
      color = "#fca5a5";
    }
    return {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 13px",
      borderRadius: 8,
      background: bg,
      border,
      color,
      cursor: sub ? "default" : "pointer",
      transition: "all 0.2s",
      userSelect: "none",
      fontSize: 14,
      fontWeight: sel ? 500 : 400,
    };
  },
  optionKey: (sel, sub, cor, wr) => {
    let bg = "#1a1a28",
      color = "#444";
    if (sel && !sub) {
      bg = "#34d399";
      color = "#0a0a10";
    }
    if (sub && cor) {
      bg = "#22c55e";
      color = "#fff";
    }
    if (sub && wr) {
      bg = "#ef4444";
      color = "#fff";
    }
    return {
      fontFamily: "'Syne', sans-serif",
      fontWeight: 800,
      fontSize: 10,
      width: 22,
      height: 22,
      minWidth: 22,
      borderRadius: 5,
      background: bg,
      color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s",
    };
  },
  submitArea: {
    marginTop: 22,
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },
  submitBtn: (dis) => ({
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    padding: "12px 28px",
    borderRadius: 10,
    border: "none",
    background: dis ? "#1a1a28" : "linear-gradient(135deg, #34d399, #059669)",
    color: dis ? "#333" : "#fff",
    cursor: dis ? "not-allowed" : "pointer",
    transition: "all 0.25s",
    boxShadow: dis ? "none" : "0 4px 20px #34d39944",
  }),
  retryBtn: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    padding: "12px 22px",
    borderRadius: 10,
    border: "1.5px solid #1e1e2e",
    background: "transparent",
    color: "#555",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  scoreCard: {
    background: "#11111a",
    border: "1px solid #1e2e28",
    borderRadius: 15,
    padding: "24px",
    marginTop: 22,
    display: "flex",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
  },
  scoreBig: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 44,
    letterSpacing: "-2px",
    background: "linear-gradient(135deg, #34d399, #6ee7b7)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    lineHeight: 1,
  },
  scoreLabel: { fontSize: 12, color: "#444", marginTop: 3 },
  scoreDivider: { width: 1, height: 50, background: "#1e1e2e" },
  scoreTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 16,
    color: "#fff",
    marginBottom: 4,
  },
  scoreSub: { fontSize: 13, color: "#555", lineHeight: 1.5 },
  badge: (color) => ({
    display: "inline-block",
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "'Syne', sans-serif",
    letterSpacing: "0.5px",
    padding: "3px 10px",
    borderRadius: 99,
    background: `${color}22`,
    border: `1px solid ${color}55`,
    color,
    marginTop: 10,
  }),
  savedNote: {
    marginTop: 10,
    fontSize: 12,
    color: "#34d399",
    fontWeight: 500,
  },
  errorBox: {
    background: "#ef444411",
    border: "1px solid #ef444444",
    borderRadius: 12,
    padding: "18px 22px",
    color: "#fca5a5",
    fontSize: 14,
  },
  loadingBox: {
    textAlign: "center",
    paddingTop: 80,
    color: "#444",
    fontSize: 15,
  },
  spinner: {
    width: 28,
    height: 28,
    border: "3px solid #1a1a28",
    borderTop: "3px solid #34d399",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto 14px",
  },
};
