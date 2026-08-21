import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Suggestion {
  id: string;
  type: "correction" | "highlight" | "factcheck" | "praise";
  phrase: string;
  explanation: string;
  alternative?: string;
}

interface ActiveTooltip {
  suggestion: Suggestion;
  x: number;
  y: number;
}

// ─── Icons ──────────────────────────────────────────────────────────────────

function ArticleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path
        d="M2 3.5h14v2H2v-2zm0 4h14v2H2v-2zm0 4h9v2H2v-2z"
        fill="currentColor"
      />
    </svg>
  );
}

function PauseIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <rect x="3" y="2" width="3.5" height="11" rx="1" fill="currentColor" />
      <rect x="8.5" y="2" width="3.5" height="11" rx="1" fill="currentColor" />
    </svg>
  );
}

function PlayIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <path d="M3 2l10 5.5L3 13V2z" fill="currentColor" />
    </svg>
  );
}

function CopyIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <rect x="6" y="6" width="9" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M4 12H3a1 1 0 01-1-1V3a1 1 0 011-1h8a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function RestartIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <path
        d="M6.5 1.5A5 5 0 1011.5 6.5h-1.5A3.5 3.5 0 116.5 3V1.5z"
        fill="currentColor"
      />
      <path d="M5 1h3v3L5 1z" fill="currentColor" />
    </svg>
  );
}

function SpinnerIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className="animate-spin">
      <circle cx="7" cy="7" r="5.5" stroke="#2890ea" strokeWidth="2" strokeDasharray="20 14" strokeLinecap="round" />
    </svg>
  );
}

function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Gemini API ─────────────────────────────────────────────────────────────

async function geminiRequest(
  userApiKey: string,
  prompt: string,
  jsonMode = false,
  retries = 3
): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (userApiKey.trim()) headers["x-api-key"] = userApiKey.trim();

  for (let attempt = 0; attempt <= retries; attempt++) {
    let res: Response;
    try {
      res = await fetch("/api/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt, jsonMode }),
      });
    } catch { continue; }

    if (res.ok) {
      const data = await res.json() as { text?: string };
      return data.text ?? "";
    }

    const status = res.status;
    const err = await res.json().catch(() => ({})) as { error?: string };

    if (status === 429) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
        continue;
      }
      throw new Error("QUOTA_EXCEEDED");
    }

    if (status === 503 || status === 500) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
        continue;
      }
    }

    throw new Error(err.error ?? `HTTP ${status}`);
  }

  throw new Error("Request failed after retries");
}

async function getSuggestions(apiKey: string, text: string): Promise<Suggestion[]> {
  const wordCount = text.trim().split(/\s+/).length;
  const targetCount = wordCount < 80 ? 4 : wordCount < 250 ? 7 : wordCount < 500 ? 10 : 14;

  const prompt = `You are a detailed writing tutor. Thoroughly analyze the student writing below and return ONLY a valid JSON object (no markdown, no explanation):
{
  "suggestions": [
    {
      "id": "s1",
      "type": "correction",
      "phrase": "exact phrase from the text",
      "explanation": "what is wrong and why",
      "alternative": "corrected version"
    },
    {
      "id": "s2",
      "type": "highlight",
      "phrase": "exact phrase from the text",
      "explanation": "specific constructive feedback"
    },
    {
      "id": "s3",
      "type": "praise",
      "phrase": "exact phrase from the text",
      "explanation": "specific reason this works well"
    },
    {
      "id": "s4",
      "type": "factcheck",
      "phrase": "exact phrase from the text",
      "explanation": "what is factually or logically wrong",
      "alternative": "correct version if known"
    }
  ]
}

Rules for each type:
- "correction": spelling mistakes, wrong tense, wrong word form or preposition. Always include "alternative". Do not flag style.
- "highlight": constructive, actionable feedback on any of the following — weak or abrupt paragraph transitions, poor logical flow between ideas, a new point introduced without any supporting example or evidence, a claim that appears to come from an interview or fieldwork but the source is not mentioned, a claim that needs a citation (online literature, academic source, or fieldwork), an acronym used without its full form being introduced first, an essay that begins without a proper title or has only the assignment name as a heading, repetition of the same point, vague language where specifics are needed, missing topic sentences, conclusions that don't follow from the argument, or ideas that are underdeveloped. Be specific about what is weak and how to improve it — mirror the directness of feedback like "This is a new point — support it with an example", "Which interview is this from? Mention the source", "Where is this claim from? Cite the source", "What does this acronym stand for? Write the full form the first time it appears", or "Give your essay a proper heading, not just the assignment name".
- "praise": genuinely good writing — a well-constructed sentence, a clear argument, precise word choice, effective use of evidence, strong paragraph structure, or an original insight. Be specific about what works and why.
- "factcheck": factually wrong claims, incorrect dates, wrong names, logical contradictions, or conclusions the evidence doesn't support. Include "alternative" if the correct fact is known.

Coverage requirements for longer texts:
- Check EVERY paragraph for transitions and logical flow — does each paragraph connect clearly to the next?
- Check the overall argument structure — does the essay build toward a coherent conclusion?
- Spread suggestions across the full text, not just the opening paragraph.
- "phrase" MUST be an exact substring verbatim from the text.
- Return approximately ${targetCount} suggestions. More is better than fewer for longer texts.
- If text is under 20 words, return an empty suggestions array.
- Return ONLY the JSON object.

Text:
"""
${text}
"""`;

  const raw = await geminiRequest(apiKey, prompt, true);

  // Strip any stray markdown fences or think-block text just in case
  const stripped = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();

  const jsonMatch = stripped.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return [];

  let parsed: { suggestions?: Suggestion[] };
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    // Salvage truncated array: remove last incomplete object then close the structure
    const salvaged = jsonMatch[0]
      .replace(/,?\s*\{[^{}]*$/, "")
      .trimEnd()
      .replace(/,$/, "") + "]}";
    try { parsed = JSON.parse(salvaged); } catch { return []; }
  }

  return (parsed.suggestions ?? [])
    .filter((s) => s.phrase && s.type && text.includes(s.phrase))
    .map((s, i) => ({ ...s, id: `s${i}` }));
}

async function generateTemplate(apiKey: string, prompt: string): Promise<string> {
  const req = `Generate a writing template for the following prompt. Follow these rules strictly:

- Write in first person, as if the student is writing it themselves.
- Write in complete sentences but keep them concise. Every sentence must contain at least one _____ where the student fills in the meaningful content.
- Strike a balance: enough words to give the sentence shape and direction, but the substance — the ideas, examples, arguments, names, dates — should all be left as _____.
- Avoid over-explaining. One or two sentences per idea is enough.
- Do not use markdown formatting, hashtags, bold, or bullet points.
- Section titles (like Introduction, Conclusion, Theme 1) appear as plain words on their own line.
- No instructions, no meta-commentary, no explanations. Just the template text.

Example of the style to use:
"In this _____, the author explores the theme of _____ through the character of _____. One moment that stood out to me was when _____, because it showed that _____."

Writing prompt:
"""
${prompt}
"""

Return only the template. No introduction or explanation.`;

  return geminiRequest(apiKey, req);
}

// ─── Highlight HTML builder ──────────────────────────────────────────────────

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildHighlightHTML(text: string, suggestions: Suggestion[], dismissed: Set<string>): string {
  if (!suggestions.length) return escHtml(text).replace(/\n/g, "<br/>");

  type Seg = { start: number; end: number; s: Suggestion };
  const segs: Seg[] = [];

  for (const s of suggestions) {
    if (dismissed.has(s.id)) continue;
    let idx = 0;
    while ((idx = text.indexOf(s.phrase, idx)) !== -1) {
      const overlaps = segs.some(
        (seg) => idx < seg.end && idx + s.phrase.length > seg.start
      );
      if (!overlaps) {
        segs.push({ start: idx, end: idx + s.phrase.length, s });
      }
      idx += s.phrase.length;
    }
  }

  segs.sort((a, b) => a.start - b.start);

  let html = "";
  let cursor = 0;

  for (const seg of segs) {
    if (seg.start > cursor) {
      html += escHtml(text.slice(cursor, seg.start)).replace(/\n/g, "<br/>");
    }
    const color = seg.s.type === "correction" ? "#db1111" : seg.s.type === "factcheck" ? "#e07b00" : seg.s.type === "praise" ? "#20bb32" : "#2890ea";
    html += `<span class="suggestion-span" data-id="${seg.s.id}" style="text-decoration:underline;text-decoration-color:${color};text-underline-offset:3px;text-decoration-thickness:1.5px;">${escHtml(text.slice(seg.start, seg.end))}</span>`;
    cursor = seg.end;
  }

  if (cursor < text.length) {
    html += escHtml(text.slice(cursor)).replace(/\n/g, "<br/>");
  }

  return html;
}

// ─── API Key Modal ───────────────────────────────────────────────────────────

function ApiKeyModal({ onSave, onClose, hasExisting }: { onSave: (key: string) => void; onClose?: () => void; hasExisting?: boolean }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed && !hasExisting) { setError("Please enter your Gemini API key."); return; }
    if (trimmed) onSave(trimmed);
    else onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[440px] p-8 flex flex-col gap-5 relative">
        {hasExisting && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#717171] hover:text-black transition-colors"
            title="Close"
          >
            <XIcon size={16} />
          </button>
        )}
        <div>
          <h2 className="text-xl font-bold text-black mb-1">{hasExisting ? "API Key" : "Gemini API Key needed"}</h2>
          {hasExisting ? (
            <div className="bg-[#f0faf1] border border-[#20bb32] rounded-lg p-3">
              <p className="text-sm text-[#333]">
                A default API key is already active — you can use the app without entering anything.
                If the daily usage limit is reached, you can enter your own key below.
              </p>
            </div>
          ) : (
            <div className="bg-[#ecf6ff] border border-[#2890ea] rounded-lg p-3 flex flex-col gap-1">
              <p className="text-sm font-medium text-black">How to get your key:</p>
              <ol className="text-sm text-[#333] leading-relaxed list-decimal list-inside">
                <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[#2890ea] underline">aistudio.google.com/app/apikey</a></li>
                <li>Sign in with any Google account</li>
                <li>Click <span className="font-medium">Create API key</span></li>
                <li>Copy and paste it below</li>
              </ol>
            </div>
          )}
          <p className="text-xs text-[#717171] mt-2">Your key is stored only in your browser and never shared.</p>
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder={hasExisting ? "Paste a different key to override the default" : "Paste API key here"}
            className="w-full border border-[#b8b8b8] rounded-[6px] px-3 py-2 text-sm font-mono outline-none focus:border-[#2890ea] transition-colors"
            autoFocus
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSave}
            className="w-full bg-[#2990ea] hover:bg-[#1a7fd0] text-white text-sm font-medium rounded-[6px] py-2 transition-colors"
          >
            Save & Continue
          </button>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-center text-xs text-[#2890ea] hover:underline"
          >
            Get a free Gemini API key →
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Suggestion Tooltip ──────────────────────────────────────────────────────

function SuggestionTooltip({
  tooltip,
  onAccept,
  onDismiss,
}: {
  tooltip: ActiveTooltip;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const { suggestion, x, y } = tooltip;
  const isCorrection = suggestion.type === "correction";

  return (
    <div
      className="fixed z-50 bg-white rounded-[8px] shadow-[0px_2px_10px_rgba(0,0,0,0.25)] border border-[#2890ea] px-[15px] py-[13px] w-[300px] flex flex-col gap-2"
      style={{ left: x, top: y }}
    >
      <p className="text-sm text-black leading-5 whitespace-pre-wrap">
        {suggestion.explanation}
        {isCorrection && suggestion.alternative && (
          <>
            {"\n"}
            <span className="text-[#717171] text-[13px]">Alternative: </span>
            <span className="font-medium text-[#288dcc] text-[13px]">{suggestion.alternative}</span>
          </>
        )}
      </p>
      {isCorrection && (
        <div className="flex gap-1 justify-end">
          <button
            onClick={() => onAccept(suggestion.id)}
            className="bg-white border border-[#a4a4a4] rounded-[6px] px-3 py-0.5 text-sm font-medium text-[#257721] hover:bg-green-50 transition-colors"
          >
            Accept
          </button>
          <button
            onClick={() => onDismiss(suggestion.id)}
            className="bg-white border border-[#a4a4a4] rounded-[6px] px-3 py-0.5 text-sm font-medium text-[#db1111] hover:bg-red-50 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem("gemini_api_key") ?? "");
  const [showApiModal, setShowApiModal] = useState(false);

  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [paused, setPaused] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [templatePrompt, setTemplatePrompt] = useState("");
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateGenerated, setTemplateGenerated] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const [templateSectionOpen, setTemplateSectionOpen] = useState(true);

  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState("");
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip | null>(null);

  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tooltipHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save API key
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("gemini_api_key", key);
    setShowApiModal(false);
  };

  // Sync textarea scroll to highlight layer
  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Update highlight HTML when text or suggestions change
  useEffect(() => {
    if (!highlightRef.current) return;
    if (!text) {
      highlightRef.current.innerHTML = "";
      return;
    }
    highlightRef.current.innerHTML = buildHighlightHTML(text, suggestions, dismissed);
  }, [text, suggestions, dismissed]);

  // Debounced suggestion fetch
  const fetchSuggestions = useCallback(
    (currentText: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        if (!currentText.trim() || currentText.trim().split(/\s+/).length < 15) return;
        if (paused) return;
        setSuggestionsLoading(true);
        setSuggestionsError("");
        try {
          const results = await getSuggestions(apiKey, currentText);
          setSuggestions(results);
          setDismissed(new Set());
        } catch (e) {
          const raw = e instanceof Error ? e.message : "Unknown error";
          const msg = raw === "QUOTA_EXCEEDED"
            ? "The usage limit for the API key entered is currently full. Wait for it to reset, or enter another key."
            : raw;
          setSuggestionsError(msg);
          console.error("Suggestion error:", e);
        } finally {
          setSuggestionsLoading(false);
        }
      }, 6000);
    },
    [apiKey, paused]
  );

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    fetchSuggestions(newText);
    // Auto-collapse template section once the user starts writing or pastes
    if (newText.trim() && templateSectionOpen) setTemplateSectionOpen(false);
  };

  const cancelTooltipHide = useCallback(() => {
    if (tooltipHideTimer.current) clearTimeout(tooltipHideTimer.current);
  }, []);

  const scheduleTooltipHide = useCallback(() => {
    if (tooltipHideTimer.current) clearTimeout(tooltipHideTimer.current);
    tooltipHideTimer.current = setTimeout(() => setActiveTooltip(null), 300);
  }, []);

  // Detect hover over suggestion spans through the transparent textarea
  const handleTextareaMouseMove = useCallback(
    (e: React.MouseEvent<HTMLTextAreaElement>) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Temporarily lift pointer events so elementFromPoint sees the layer below
      textarea.style.pointerEvents = "none";
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      textarea.style.pointerEvents = "";

      if (!el) { scheduleTooltipHide(); return; }

      const span = el.closest(".suggestion-span") as HTMLElement | null;
      if (!span) {
        // Don't hide if mouse is already over the tooltip
        if (!tooltipRef.current?.contains(el)) scheduleTooltipHide();
        return;
      }

      // Mouse is over a span — cancel any pending hide and show/update tooltip
      cancelTooltipHide();

      const id = span.dataset.id;
      if (!id) return;
      const s = suggestions.find((s) => s.id === id);
      if (!s || dismissed.has(id)) return;

      const rect = span.getBoundingClientRect();
      let tx = rect.left;
      let ty = rect.bottom + 8;
      if (tx + 316 > window.innerWidth) tx = window.innerWidth - 324;
      if (ty + 160 > window.innerHeight) ty = rect.top - 168;

      setActiveTooltip({ suggestion: s, x: tx, y: ty });
    },
    [suggestions, dismissed, scheduleTooltipHide, cancelTooltipHide]
  );

  const handleSidebarSuggestionClick = useCallback((s: Suggestion) => {
    const span = highlightRef.current?.querySelector(
      `.suggestion-span[data-id="${s.id}"]`
    ) as HTMLElement | null;

    if (span) {
      span.scrollIntoView({ behavior: "smooth", block: "center" });
      // Wait for scroll to settle then position tooltip
      setTimeout(() => {
        const rect = span.getBoundingClientRect();
        let tx = rect.left;
        let ty = rect.bottom + 8;
        if (tx + 316 > window.innerWidth) tx = window.innerWidth - 324;
        if (ty + 160 > window.innerHeight) ty = rect.top - 168;
        setActiveTooltip({ suggestion: s, x: tx, y: ty });
      }, 350);
    }
  }, []);

  const handleTextareaMouseLeave = useCallback(() => {
    scheduleTooltipHide();
  }, [scheduleTooltipHide]);

  // Accept a correction: replace phrase with alternative
  const handleAccept = (id: string) => {
    const s = suggestions.find((s) => s.id === id);
    if (!s || !s.alternative) return;
    const newText = text.replace(s.phrase, s.alternative);
    setText(newText);
    setDismissed((prev) => new Set([...prev, id]));
    setActiveTooltip(null);
    // Focus textarea and set cursor
    textareaRef.current?.focus();
  };

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
    setActiveTooltip(null);
  };

  // Template generation
  const handleGetTemplate = async () => {
    if (!templatePrompt.trim()) return;
    setTemplateLoading(true);
    setTemplateError("");
    try {
      const template = await generateTemplate(apiKey, templatePrompt);
      setText(template);
      setTemplateGenerated(true);
      setSuggestions([]);
      setDismissed(new Set());
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Failed to generate template.";
      setTemplateError(raw === "QUOTA_EXCEEDED"
        ? "The usage limit for the API key entered is currently full. Wait for it to reset, or enter another key."
        : raw);
      console.error(e);
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleClearTemplate = () => {
    setTemplatePrompt("");
    setTemplateGenerated(false);
    setText("");
    setSuggestions([]);
    setDismissed(new Set());
  };

  const handleRegenerateTemplate = async () => {
    if (!templatePrompt.trim()) return;
    setTemplateGenerated(false);
    await handleGetTemplate();
  };

  // Copy text
  const handleCopy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download as .txt
  const handleDownload = () => {
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "writing.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Count active (non-dismissed) suggestions
  const activeSuggestions = suggestions.filter((s) => !dismissed.has(s.id));

  return (
    <>
      {showApiModal && (
        <ApiKeyModal
          onSave={handleSaveApiKey}
          hasExisting={true}
          onClose={() => setShowApiModal(false)}
        />
      )}

      <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
        {/* Header */}
        <div className="pt-10 pb-6 flex items-center justify-center relative">
          <h1 className="text-[26px] font-bold text-black">Writing Assistant</h1>
          <button
            onClick={() => { setShowApiModal(true); }}
            title="Change API key"
            className="absolute right-10 top-1/2 -translate-y-1/2 text-xs text-[#2890ea] hover:underline opacity-60 hover:opacity-100 transition-opacity"
          >
            API key
          </button>
        </div>

        {/* Main layout */}
        <div className="flex flex-1 gap-0 px-10 pb-10 max-w-[1400px] mx-auto w-full">
          {/* Left sidebar */}
          <div
            className={`transition-all duration-300 overflow-hidden flex-shrink-0 ${sidebarOpen ? "w-[298px] mr-[16px] opacity-100" : "w-0 opacity-0"}`}
          >
            <div className="w-[298px] flex flex-col gap-[13px] pt-[46px]">

              {/* Collapsible template section */}
              <div className="border border-[#e0e0e0] rounded-[8px] overflow-hidden">
                <button
                  onClick={() => setTemplateSectionOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-[#f7f7f7] transition-colors text-left"
                >
                  <span className="text-[14px] font-medium text-black">Get a template to kickstart writing</span>
                  <svg
                    width="14" height="14" viewBox="0 0 14 14" fill="none"
                    className={`flex-shrink-0 transition-transform duration-200 ${templateSectionOpen ? "rotate-180" : ""}`}
                  >
                    <path d="M2 4.5l5 5 5-5" stroke="#717171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {templateSectionOpen && (
                  <div className="flex flex-col gap-[13px] px-4 pb-4 pt-1 bg-white">
                    {/* Prompt input */}
                    <div className="relative">
                      <textarea
                        value={templatePrompt}
                        onChange={(e) => setTemplatePrompt(e.target.value)}
                        placeholder="Type in a writing prompt, an assignment question, or grading rubrics to generate a template!"
                        className="w-full h-[180px] bg-white border border-[#b8b8b8] rounded-[5px] p-4 text-[15px] italic text-[#5f5f5f] leading-[24px] resize-none outline-none focus:border-[#2890ea] transition-colors placeholder:italic placeholder:text-[#5f5f5f]"
                      />
                      {templateLoading && (
                        <div className="absolute bottom-3 right-3">
                          <SpinnerIcon size={16} />
                        </div>
                      )}
                    </div>

                    {templateError && (
                      <p className="text-xs text-red-500">{templateError}</p>
                    )}

                    {!templateGenerated ? (
                      <div className="flex justify-end">
                        <button
                          onClick={handleGetTemplate}
                          disabled={!templatePrompt.trim() || templateLoading}
                          className="bg-white border border-[#3581c4] border-[0.6px] rounded-[6px] px-[14px] py-[3px] h-[28px] text-[14px] font-medium text-black hover:bg-[#ecf6ff] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {templateLoading ? "Generating..." : "Get a Template"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <button
                          onClick={handleClearTemplate}
                          className="bg-white border border-[#3581c4] border-[0.6px] rounded-[6px] px-[14px] py-[3px] h-[28px] text-[14px] font-medium text-black hover:bg-[#ecf6ff] transition-colors"
                        >
                          Clear
                        </button>
                        <button
                          onClick={handleRegenerateTemplate}
                          disabled={templateLoading}
                          className="bg-white border border-[#3581c4] border-[0.6px] rounded-[6px] px-[14px] py-[3px] h-[28px] text-[14px] font-medium text-black flex items-center gap-1 hover:bg-[#ecf6ff] transition-colors disabled:opacity-40"
                        >
                          <RestartIcon size={13} />
                          {templateLoading ? "Generating..." : "Regenerate"}
                        </button>
                      </div>
                    )}

                    {templateLoading && (
                      <p className="text-[13px] font-medium italic text-[#2890ea] text-right">
                        Generating template...
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Suggestions — always visible */}
              {activeSuggestions.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-2">
                  <p className="text-[13px] font-medium text-black mb-1">
                    {activeSuggestions.length} suggestion{activeSuggestions.length !== 1 ? "s" : ""}
                  </p>
                  {activeSuggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSidebarSuggestionClick(s)}
                      className="flex items-start gap-2 text-[12px] text-[#5f5f5f] leading-[18px] text-left hover:text-black transition-colors"
                    >
                      <span
                        className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: s.type === "correction" ? "#db1111" : s.type === "factcheck" ? "#e07b00" : s.type === "praise" ? "#20bb32" : "#2890ea",
                        }}
                      />
                      <span className="line-clamp-2">{s.explanation}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Editor panel */}
          <div className="flex-1 flex flex-col gap-[12px] min-w-0">
            {/* Toolbar */}
            <div className="h-[34px] flex items-center justify-between relative flex-shrink-0">
              {/* Article / sidebar toggle */}
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                title={sidebarOpen ? "Hide template panel" : "Show template panel"}
                className={`h-[34px] w-[35px] flex items-center justify-center rounded-[6px] border border-solid transition-colors ${
                  sidebarOpen
                    ? "bg-[#ecf6ff] border-[#3581c4] text-[#2890ea]"
                    : "bg-white border-[#3581c4] text-black hover:bg-[#ecf6ff]"
                }`}
              >
                <ArticleIcon size={18} />
              </button>

              {/* Center: pause + status */}
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                {suggestionsLoading && (
                  <div className="flex items-center gap-1.5 text-[13px] text-[#2890ea]">
                    <SpinnerIcon size={13} />
                    <span className="font-medium italic">Analyzing...</span>
                  </div>
                )}
                {suggestionsError && !suggestionsLoading && (
                  <span
                    className="text-[12px] text-red-500 italic cursor-pointer"
                    title={suggestionsError}
                    onClick={() => setSuggestionsError("")}
                  >
                    ⚠ {suggestionsError}
                  </span>
                )}
                <button
                  onClick={() => setPaused((v) => !v)}
                  className="bg-white border border-[#3581c4] border-[0.6px] rounded-[6px] h-[34px] px-[14px] flex items-center gap-[6px] text-[16px] font-medium text-black hover:bg-[#ecf6ff] transition-colors"
                >
                  {paused ? <PlayIcon size={15} /> : <PauseIcon size={15} />}
                  {paused ? "Resume suggestions" : "Pause suggestions"}
                </button>
              </div>

              {/* Right: copy + download */}
              <div className="flex items-center gap-[13px]">
                <button
                  onClick={handleCopy}
                  title="Copy to clipboard"
                  className="bg-white border border-[#3581c4] border-[0.6px] rounded-[6px] h-[34px] w-[35px] flex items-center justify-center hover:bg-[#ecf6ff] transition-colors relative"
                >
                  <CopyIcon size={18} />
                  {copied && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      Copied!
                    </span>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="bg-[#2990ea] hover:bg-[#1a7fd0] border border-[#3581c4] border-[0.6px] rounded-[6px] h-[34px] w-[105px] flex items-center justify-center text-[16px] font-medium text-white transition-colors"
                >
                  Download
                </button>
              </div>
            </div>

            {/* Editor area */}
            <div className="editor-outer relative bg-white border border-[#b8b8b8] rounded-[5px] flex-1 min-h-[600px]">
              {/* Highlight overlay */}
              <div ref={highlightRef} className="editor-highlight-layer" />

              {/* Textarea input */}
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                onScroll={syncScroll}
                onMouseMove={handleTextareaMouseMove}
                onMouseLeave={handleTextareaMouseLeave}
                placeholder="Begin typing here to get AI Suggestions on your writing"
                className="editor-textarea"
                spellCheck={false}
              />
            </div>

            {/* Legend */}
            {activeSuggestions.length > 0 && (
              <div className="flex items-center gap-4 text-[12px] text-[#717171] px-1">
                {activeSuggestions.some((s) => s.type === "praise") && (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-4 border-b-2 border-[#20bb32]" />
                    Well done
                  </span>
                )}
                {activeSuggestions.some((s) => s.type === "highlight") && (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-4 border-b-2 border-[#2890ea]" />
                    Suggestion
                  </span>
                )}
                {activeSuggestions.some((s) => s.type === "factcheck") && (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-4 border-b-2 border-[#e07b00]" />
                    Fact check
                  </span>
                )}
                {activeSuggestions.some((s) => s.type === "correction") && (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-4 border-b-2 border-[#db1111]" />
                    Correction
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {activeTooltip && (
        <div
          ref={(el) => { tooltipRef.current = el; }}
          onMouseEnter={cancelTooltipHide}
          onMouseLeave={scheduleTooltipHide}
        >
          <SuggestionTooltip
            tooltip={activeTooltip}
            onAccept={handleAccept}
            onDismiss={handleDismiss}
          />
        </div>
      )}
    </>
  );
}
