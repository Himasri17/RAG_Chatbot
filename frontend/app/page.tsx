"use client";
import { useState, useRef, useEffect } from "react";
import { processVideo, chat as chatAPI, HistoryMessage } from "@/services/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  timestamp: Date;
}
interface Source {
  video: "A" | "B";
  chunk: string;
  text: string;
}
interface VideoInfo {
  url: string;

  title: string;

  platform: "youtube" | "instagram";

  creator?: string;

  views?: number;

  num_chunks?: number;

  message?: string;
}

const PROCESSING_STEPS = [
  "Fetching metadata",
  "Getting transcripts",
  "Chunking content",
  "Creating embeddings",
  "Storing in vector database",
];

export default function RAGChatbot() {
  const [videoAUrl, setVideoAUrl] = useState("");
  const [videoBUrl, setVideoBUrl] = useState("");
  const [videoA, setVideoA] = useState<VideoInfo | null>(null);
  const [videoB, setVideoB] = useState<VideoInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<"comparison" | "history" | "settings">("comparison");
  const [sourcesExpanded, setSourcesExpanded] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState({ answerLength: "Medium", showTimestamps: true });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const detectPlatform = (url: string): "youtube" | "instagram" =>
    url.includes("instagram") ? "instagram" : "youtube";

  const tickSteps = () => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < PROCESSING_STEPS.length - 1) { i++; setProcessingStep(i); }
      else clearInterval(interval);
    }, 900);
    return interval;
  };

  const handleProcessVideos = async () => {
    setIsProcessing(true);
    setProcessingStep(0);
    setProcessingError(null);
    setVideoA(null);
    setVideoB(null);
    setMessages([]);
    const ticker = tickSteps();
    try {
      const [resA, resB] = await Promise.all([
        processVideo(videoAUrl),
        processVideo(videoBUrl),
      ]);
      clearInterval(ticker);
      setProcessingStep(PROCESSING_STEPS.length - 1);
      if (resA.detail) throw new Error(`Video A: ${resA.detail}`);
      if (resB.detail) throw new Error(`Video B: ${resB.detail}`);
      setVideoA({ url: videoAUrl, title: resA.title ?? "Video A", platform: resA.platform ?? detectPlatform(videoAUrl) });
      setVideoB({ url: videoBUrl, title: resB.title ?? "Video B", platform: resB.platform ?? detectPlatform(videoBUrl) });
    } catch (err: unknown) {
      clearInterval(ticker);
      setProcessingError(err instanceof Error ? err.message : "Processing failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: inputValue.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    const query = inputValue.trim();
    setInputValue("");

    const thinkLabels = ["Searching relevant chunks", "Reading content", "Analysing", "Generating answer"];
    setIsThinking(true);
    setThinkingSteps([]);
    let si = 0;
    const thinkTicker = setInterval(() => {
      if (si < thinkLabels.length) { setThinkingSteps(thinkLabels.slice(0, si + 1)); si++; }
    }, 600);

    // Build history for backend — only send prior messages, not the current one
    const history: HistoryMessage[] = messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const data = await chatAPI(query, history);
      clearInterval(thinkTicker);
      const sources: Source[] = (data.sources ?? []).map((title: string, i: number) => ({
        video: i % 2 === 1 ? "B" : "A",
        chunk: `Chunk ${i + 1}`,
        text: title,
      }));
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer ?? "No answer returned.",
        sources,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      clearInterval(thinkTicker);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `⚠️ ${err instanceof Error ? err.message : "Chat request failed."}`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsThinking(false);
      setThinkingSteps([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const ready = !!videoA && !!videoB && !isProcessing;

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">⬡</div>
        <nav>
          {[
            { id: "comparison", icon: "⊞", label: "Compare" },
            { id: "history",    icon: "◷", label: "History" },
            { id: "settings",   icon: "⚙", label: "Settings" },
          ].map(({ id, icon, label }) => (
            <button
              key={id}
              className={`nav-btn${activeView === id ? " active" : ""}`}
              onClick={() => setActiveView(id as typeof activeView)}
              title={label}
            >
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="main">
        {/* Header */}
        <header className="header">
          <div>
            <h1>RAG Video Comparison</h1>
            <p>Compare two videos · get AI insights with sources</p>
          </div>
          <span className="badge">AI-Powered</span>
        </header>

        <div className="body">
          {/* ── LEFT COLUMN ── */}
          <div className="left">

            {/* Step 1 — URLs */}
            <section className="card">
              <div className="card-head">
                <span className="step">1</span>
                <div>
                  <h2>Add Videos</h2>
                  <p>Paste a YouTube and an Instagram URL to compare</p>
                </div>
              </div>
              <div className="url-fields">
              <div className="url-field">

                <label className="platform-label">
                  🎥 Video A URL
                </label>

                <input
                  className="url-input"
                  placeholder="Paste YouTube or Instagram URL"
                  value={videoAUrl}
                  onChange={(e) =>
                    setVideoAUrl(e.target.value)
                  }
                />

                <small className="helper-text">
                  Supports YouTube and Instagram
                </small>

              </div>

              <div className="url-field">

                <label className="platform-label">
                  🎥 Video B URL
                </label>

                <input
                  className="url-input"
                  placeholder="Paste YouTube or Instagram URL"
                  value={videoBUrl}
                  onChange={(e) =>
                    setVideoBUrl(e.target.value)
                  }
                />

                <small className="helper-text">
                  Supports YouTube and Instagram
                </small>

              </div>

              <button
                className="analyze-btn"
                onClick={handleProcessVideos}
                disabled={
                  !videoAUrl ||
                  !videoBUrl ||
                  isProcessing
                }
              >
                {isProcessing
                  ? "Processing..."
                  : "⬥ Analyze Videos"}
              </button>

              {processingError && (
                <div className="error-box">
                  ⚠️ {processingError}
                </div>
              )}

            </div>
            </section>

            {/* Step 2 — Processing */}
            {isProcessing && (
              <section className="card processing-card">
                <div className="card-head">
                  <span className="step">2</span>
                  <div><h2>Processing Videos</h2><p>Fetching, chunking and indexing both videos</p></div>
                </div>
                <div className="steps-list">
                  {PROCESSING_STEPS.map((s, i) => (
                    <div key={s} className={`proc-row ${i < processingStep ? "done" : i === processingStep ? "active" : ""}`}>
                      <span className="proc-icon">{i < processingStep ? "✓" : i === processingStep ? "◌" : "○"}</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Step 3 — Video Cards */}
            {videoA && videoB && (
              <section className="card">

                <div className="card-head">
                  <span className="step">3</span>

                  <div>
                    <h2>Comparison Dashboard</h2>
                    <p>
                      Both videos indexed and ready to compare
                    </p>
                  </div>
                </div>

                <div className="video-grid">

                  {[
                    { v: videoA, label: "A" },
                    { v: videoB, label: "B" },
                  ].map(({ v, label }) => (

                    <div
                      key={label}
                      className="video-card"
                    >

                      <div
                        className={`thumb thumb-${v.platform}`}
                      >

                        <span className="play">
                          ▶
                        </span>

                        <span
                          className={`platform-tag tag-${v.platform}`}
                        >
                          {v.platform === "youtube"
                            ? "▶ YouTube"
                            : "◈ Instagram"}
                        </span>

                        <span className="video-label">
                          VIDEO {label}
                        </span>

                      </div>

                      <div className="video-body">

                        <p className="video-title">
                          {v.title}
                        </p>

                        <div className="video-meta">

                          <span
                            className={`pill pill-${v.platform}`}
                          >
                            {v.platform}
                          </span>

                          {v.creator && (
                            <span className="meta-item">
                              👤 {v.creator}
                            </span>
                          )}

                          {v.views && (
                            <span className="meta-item">
                              👁 {Number(
                                v.views
                              ).toLocaleString()}
                            </span>
                          )}

                        </div>

                        <div className="video-status">
                          ✅ Indexed
                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              </section>
            )}

            {/* Settings view */}
            {activeView === "settings" && (
              <section className="card">
                <div className="card-head">
                  <span className="step" style={{ background: "#6c757d" }}>⚙</span>
                  <div><h2>Settings</h2><p>Control preferences and behaviour</p></div>
                </div>
                <div className="settings-rows">
                  <div className="setting-row">
                    <span>Answer Length</span>
                    <select value={settings.answerLength} onChange={(e) => setSettings((p) => ({ ...p, answerLength: e.target.value }))}>
                      {["Short", "Medium", "Long"].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="setting-row">
                    <span>Show Timestamps</span>
                    <input type="checkbox" checked={settings.showTimestamps} onChange={(e) => setSettings((p) => ({ ...p, showTimestamps: e.target.checked }))} />
                  </div>
                  <div className="setting-row danger">
                    <span>Clear chat history</span>
                    <button className="clear-btn" onClick={() => setMessages([])}>Clear</button>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* ── RIGHT COLUMN — Chat ── */}
          <div className="right">
            <div className="chat-wrap">

              {/* Chat header */}
              <div className="chat-top">
                <span className="chat-icon">⬡</span>
                <span className="chat-title">Ask & Compare</span>
                {ready && (
                  <span className="ready-dot" title="Ready">●</span>
                )}
              </div>

              {/* History sidebar strip */}
              {activeView === "history" && (
                <div className="history-strip">
                  <div className="history-head">Past Comparisons</div>
                  {messages.length > 0 ? (
                    <div className="history-session">
                      <div className="history-label">Current session</div>
                      <div className="history-count">{messages.filter(m => m.role === "user").length} question{messages.filter(m => m.role === "user").length !== 1 ? "s" : ""}</div>
                    </div>
                  ) : (
                    <div className="history-empty">No history yet</div>
                  )}
                </div>
              )}

              {/* Messages */}
              <div className="messages">
                {messages.length === 0 && !isThinking && (
                  <div className="empty-state">
                    <div className="empty-icon">◈</div>
                    <p>Analyze two videos above, then ask anything about them.</p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div key={msg.id} className={`msg msg-${msg.role}`}>
                    {msg.role === "assistant" && <div className="avatar">⬡</div>}
                    <div className="bubble-wrap">
                      <div
                        className="bubble"
                        dangerouslySetInnerHTML={{
                          __html: msg.content
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(/\n•/g, "<br/>•")
                            .replace(/\n/g, "<br/>"),
                        }}
                      />

                      {msg.sources && msg.sources.length > 0 && (
                        <div className="sources">
                          <button
                            className="sources-toggle"
                            onClick={() => setSourcesExpanded((p) => ({ ...p, [msg.id]: !p[msg.id] }))}
                          >
                            {sourcesExpanded[msg.id] ? "▲" : "▼"} {msg.sources.length} source{msg.sources.length !== 1 ? "s" : ""}
                          </button>
                          {sourcesExpanded[msg.id] && (
                            <div className="sources-list">
                              {msg.sources.map((s, i) => (
                                <div key={i} className="source">
                                  <span className={`src-tag src-${s.video}`}>Video {s.video} · {s.chunk}</span>
                                  <p className="src-text">{s.text}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {settings.showTimestamps && (
                        <div className="msg-time">
                          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isThinking && (
                  <div className="thinking">
                    <div className="avatar">⬡</div>
                    <div className="think-body">
                      <div className="think-label">Retrieving & generating…</div>
                      {thinkingSteps.map((s, i) => (
                        <div key={i} className="think-step done">✓ {s}</div>
                      ))}
                      {thinkingSteps.length < 4 && (
                        <div className="think-step active">◌ Processing…</div>
                      )}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="input-row">
                <textarea
                  className="chat-input"
                  placeholder={ready ? "Ask anything about these videos… (Enter to send)" : "Analyze videos first to enable chat"}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  disabled={!ready}
                />
                <button className="send-btn" onClick={handleSend} disabled={!inputValue.trim() || !ready}>▶</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:        #f5f6fa;
          --surface:   #ffffff;
          --surface2:  #f0f1f5;
          --border:    #e2e4ea;
          --border2:   #d0d3dc;
          --text:      #1a1c23;
          --text2:     #5a5e6e;
          --text3:     #9498a8;
          --accent:    #5b5ef4;
          --accent-bg: #ededfd;
          --green:     #22c27a;
          --green-bg:  #e8faf3;
          --red:       #e05252;
          --red-bg:    #fdeaea;
          --yt:        #ff0000;
          --yt-bg:     #fff0f0;
          --ig:        #d62976;
          --ig-bg:     #fff0f7;
          --radius:    10px;
          --shadow:    0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05);
        }

        body { background: var(--bg); }

        .app {
          display: flex; min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; color: var(--text);
          background: var(--bg);
        }

        /* ── SIDEBAR ── */
        .sidebar {
          width: 68px; background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          align-items: center; padding: 18px 0; gap: 6px;
          position: sticky; top: 0; height: 100vh; z-index: 10;
        }
        .logo { font-size: 22px; color: var(--accent); margin-bottom: 16px; }
        nav { display: flex; flex-direction: column; gap: 2px; width: 100%; padding: 0 8px; }
        .nav-btn {
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          padding: 9px 4px; border: none; background: transparent;
          color: var(--text3); border-radius: 8px; cursor: pointer;
          transition: all 0.15s; font-family: 'DM Sans', sans-serif;
        }
        .nav-btn:hover { background: var(--surface2); color: var(--text2); }
        .nav-btn.active { background: var(--accent-bg); color: var(--accent); }
        .nav-icon { font-size: 17px; }
        .nav-label { font-size: 9px; font-weight: 500; }

        /* ── MAIN ── */
        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        .header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 24px; background: var(--surface);
          border-bottom: 1px solid var(--border);
        }
        .header h1 { font-size: 17px; font-weight: 700; }
        .header p  { font-size: 12px; color: var(--text2); margin-top: 1px; }
        .badge {
          font-size: 11px; font-weight: 600; color: var(--accent);
          background: var(--accent-bg); border-radius: 20px; padding: 4px 12px;
          font-family: 'JetBrains Mono', monospace;
        }

        .body {
          display: grid; grid-template-columns: 1fr 420px;
          gap: 16px; padding: 20px 20px 20px 20px;
          overflow-y: auto; flex: 1; align-items: start;
        }

        .left, .right { display: flex; flex-direction: column; gap: 14px; }

        /* ── CARDS ── */
        .card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 18px; box-shadow: var(--shadow);
        }
        .card-head { display: flex; gap: 12px; margin-bottom: 14px; align-items: flex-start; }
        .step {
          min-width: 24px; height: 24px; border-radius: 50%;
          background: var(--accent); color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 1px;
        }
        .card-head h2  { font-size: 14px; font-weight: 600; }
        .card-head p   { font-size: 12px; color: var(--text2); margin-top: 2px; }

        /* URL inputs */
        .url-fields { display: flex; flex-direction: column; gap: 10px; }
        .url-field  { display: flex; flex-direction: column; gap: 4px; }
        .platform-label { font-size: 11px; font-weight: 600; font-family: 'JetBrains Mono', monospace; }
        .platform-label.yt { color: var(--yt); }
        .platform-label.ig { color: var(--ig); }
        .url-input {
          border: 1px solid var(--border); border-radius: 7px;
          padding: 8px 11px; font-size: 12px; color: var(--text);
          font-family: 'JetBrains Mono', monospace; background: var(--surface2);
          outline: none; transition: border-color 0.15s;
        }
        .url-input:focus { border-color: var(--accent); background: #fff; }
        .analyze-btn {
          background: var(--accent); color: #fff; border: none;
          border-radius: 8px; padding: 9px 18px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: opacity 0.15s; font-family: 'DM Sans', sans-serif;
          margin-top: 2px;
        }
        .analyze-btn:hover  { opacity: 0.88; }
        .analyze-btn:disabled { opacity: 0.38; cursor: not-allowed; }
        .error-box {
          background: var(--red-bg); border: 1px solid #f5c0c0;
          color: var(--red); border-radius: 7px; padding: 8px 11px;
          font-size: 12px; line-height: 1.5;
        }

        /* Processing steps */
        .processing-card { border-color: #dddcfc; background: #fafafe; }
        .steps-list { display: flex; flex-direction: column; gap: 7px; }
        .proc-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text3); }
        .proc-row.done   { color: var(--green); }
        .proc-row.active { color: var(--accent); font-weight: 500; }
        .proc-icon { width: 16px; font-size: 13px; }

        /* Video cards */
        .video-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .video-card { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
        .thumb {
          height: 88px; display: flex; align-items: center; justify-content: center;
          position: relative;
        }
        .thumb-youtube  { background: linear-gradient(135deg, #ffe0e0, #fff0f0); }
        .thumb-instagram { background: linear-gradient(135deg, #ffe0f3, #fff0fa); }
        .play { font-size: 22px; color: rgba(0,0,0,0.2); }
        .platform-tag {
          position: absolute; top: 6px; left: 6px;
          font-size: 9px; font-weight: 700; padding: 2px 6px;
          border-radius: 4px; color: #fff;
        }
        .tag-youtube   { background: var(--yt); }
        .tag-instagram { background: var(--ig); }
        .video-body { padding: 9px 10px; }
        .video-title { font-size: 12px; font-weight: 500; line-height: 1.4; margin-bottom: 5px; }
        .pill { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 10px; }
        .pill-youtube   { background: var(--yt-bg); color: var(--yt); }
        .pill-instagram { background: var(--ig-bg); color: var(--ig); }

        /* Settings */
        .settings-rows { display: flex; flex-direction: column; gap: 0; }
        .setting-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 9px 0; border-bottom: 1px solid var(--border);
          font-size: 13px;
        }
        .setting-row:last-child { border-bottom: none; }
        .setting-row select {
          border: 1px solid var(--border); border-radius: 6px;
          padding: 4px 8px; font-size: 12px; color: var(--text);
          font-family: 'DM Sans', sans-serif; background: var(--surface2);
        }
        .setting-row.danger span { color: var(--red); }
        .clear-btn {
          background: var(--red-bg); border: 1px solid #f5c0c0; color: var(--red);
          border-radius: 6px; padding: 4px 12px; font-size: 12px; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── CHAT ── */
        .chat-wrap {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); box-shadow: var(--shadow);
          display: flex; flex-direction: column; overflow: hidden;
          max-height: calc(100vh - 100px); min-height: 520px;
          position: sticky; top: 20px;
        }
        .chat-top {
          display: flex; align-items: center; gap: 8px;
          padding: 13px 16px; border-bottom: 1px solid var(--border);
        }
        .chat-icon { font-size: 16px; color: var(--accent); }
        .chat-title { font-size: 13px; font-weight: 600; flex: 1; }
        .ready-dot { color: var(--green); font-size: 10px; }

        /* History strip */
        .history-strip {
          background: var(--surface2); border-bottom: 1px solid var(--border);
          padding: 10px 14px;
        }
        .history-head { font-size: 10px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 8px; }
        .history-session { display: flex; justify-content: space-between; background: var(--surface); border: 1px solid var(--border); border-radius: 7px; padding: 7px 10px; }
        .history-label { font-size: 12px; font-weight: 500; }
        .history-count { font-size: 11px; color: var(--text3); }
        .history-empty { font-size: 12px; color: var(--text3); }

        /* Messages */
        .messages {
          flex: 1; overflow-y: auto; padding: 14px;
          display: flex; flex-direction: column; gap: 12px;
        }
        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; height: 100%; gap: 10px;
          color: var(--text3); text-align: center;
        }
        .empty-icon { font-size: 28px; }
        .empty-state p { font-size: 12px; max-width: 200px; line-height: 1.6; }

        .msg { display: flex; gap: 8px; }
        .msg-user { flex-direction: row-reverse; }
        .avatar {
          width: 26px; height: 26px; border-radius: 50%;
          background: var(--accent-bg); color: var(--accent);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; flex-shrink: 0;
        }
        .bubble-wrap { max-width: 85%; display: flex; flex-direction: column; gap: 3px; }
        .msg-user .bubble-wrap { align-items: flex-end; }
        .bubble {
          padding: 9px 12px; border-radius: 10px; font-size: 13px;
          line-height: 1.65; border: 1px solid var(--border);
          background: var(--surface2); color: var(--text);
        }
        .msg-user .bubble { background: var(--accent-bg); border-color: #d4d3fc; color: var(--text); }
        .msg-time { font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }

        /* Sources */
        .sources { margin-top: 4px; }
        .sources-toggle {
          font-size: 11px; color: var(--accent); background: var(--accent-bg);
          border: 1px solid #d4d3fc; border-radius: 5px; padding: 3px 9px;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
        }
        .sources-list { margin-top: 6px; display: flex; flex-direction: column; gap: 5px; }
        .source { background: var(--surface2); border: 1px solid var(--border); border-radius: 7px; padding: 7px 9px; }
        .src-tag { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
        .src-A { background: var(--accent-bg); color: var(--accent); }
        .src-B { background: #fef3e6; color: #d97706; }
        .src-text { font-size: 11px; color: var(--text2); margin-top: 3px; line-height: 1.5; }

        /* Thinking */
        .thinking { display: flex; gap: 8px; }
        .think-body {
          background: #fafafe; border: 1px solid #dddcfc;
          border-radius: 10px; padding: 9px 12px; flex: 1;
        }
        .think-label { font-size: 11px; font-weight: 600; color: var(--accent); margin-bottom: 5px; }
        .think-step { font-size: 12px; color: var(--text2); }
        .think-step.done   { color: var(--green); }
        .think-step.active { color: var(--accent); }

        /* Input */
        .input-row {
          display: flex; gap: 8px; padding: 10px 14px;
          border-top: 1px solid var(--border); background: var(--surface2);
        }
        .chat-input {
          flex: 1; border: 1px solid var(--border); border-radius: 8px;
          padding: 8px 11px; font-size: 13px; font-family: 'DM Sans', sans-serif;
          color: var(--text); background: var(--surface); resize: none;
          outline: none; transition: border-color 0.15s; line-height: 1.5;
        }
        .chat-input:focus { border-color: var(--accent); }
        .chat-input:disabled { opacity: 0.5; }
        .chat-input::placeholder { color: var(--text3); }
        .send-btn {
          background: var(--accent); color: #fff; border: none;
          border-radius: 8px; width: 36px; height: 36px;
          font-size: 13px; cursor: pointer; transition: opacity 0.15s;
          align-self: flex-end;
        }
        .send-btn:hover    { opacity: 0.85; }
        .send-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }
      `}</style>
    </div>
  );
}