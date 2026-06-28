'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Category definitions ─────────────────────────────────────────────────────
const CATS = {
  'Brand Storytelling': { emoji: '🎬', hex: '#ef4444', badge: 'bg-red-100 text-red-800' },
  'UX Animations':      { emoji: '✨', hex: '#8b5cf6', badge: 'bg-violet-100 text-violet-800' },
  'Personal Brand':     { emoji: '🌟', hex: '#f59e0b', badge: 'bg-amber-100 text-amber-800' },
  'Digital Products':   { emoji: '💰', hex: '#10b981', badge: 'bg-emerald-100 text-emerald-800' },
  'Mindset & Spirit':   { emoji: '🧘', hex: '#6366f1', badge: 'bg-indigo-100 text-indigo-800' },
  'Food & Recipes':     { emoji: '🍜', hex: '#f97316', badge: 'bg-orange-100 text-orange-800' },
  'Travel & Places':    { emoji: '🌍', hex: '#0ea5e9', badge: 'bg-sky-100 text-sky-800' },
}

const CAT_KEYS = Object.keys(CATS)
const STORAGE_KEY = 'idea-catcher-v2'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function readFile(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = (e) => res(e.target.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

function compressImage(dataUrl, maxDim = 512, quality = 0.72) {
  return new Promise((res) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1)
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * scale)
      c.height = Math.round(img.height * scale)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      res(c.toDataURL('image/jpeg', quality))
    }
    img.src = dataUrl
  })
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function IdeaCatcher() {
  const [ideas, setIdeas]             = useState([])
  const [loaded, setLoaded]           = useState(false)
  const [tab, setTab]                 = useState('text')
  const [title, setTitle]             = useState('')
  const [notes, setNotes]             = useState('')
  const [preview, setPreview]         = useState(null)
  const [apiImg, setApiImg]           = useState(null)
  const [selectedCat, setSelectedCat] = useState(CAT_KEYS[0])
  const [filter, setFilter]           = useState('All')
  const [dragging, setDragging]       = useState(false)
  const [justAdded, setJustAdded]     = useState(null)
  const [processing, setProcessing]   = useState(false)
  const [error, setError]             = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setIdeas(JSON.parse(saved))
    } catch (_) {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas)) } catch (_) {}
  }, [ideas, loaded])

  const processFile = useCallback(async (file) => {
    if (!file?.type.startsWith('image/')) return
    const raw = await readFile(file)
    const [thumb, big] = await Promise.all([
      compressImage(raw, 280, 0.65),
      compressImage(raw, 512, 0.75),
    ])
    setPreview(thumb)
    setApiImg(big.split(',')[1])
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    processFile(e.dataTransfer.files[0])
  }, [processFile])

  const clearImage = (e) => {
    e?.stopPropagation()
    setPreview(null)
    setApiImg(null)
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    if (tab === 'image' && !preview) return
    setProcessing(true)
    setError('')
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          notes: notes.trim(),
          imageBase64: tab === 'image' ? apiImg : null,
        }),
      })
      const data = res.ok ? await res.json() : {}
      const cat = selectedCat
      const idea = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: tab === 'image' ? 'image' : /^https?:\/\//.test(notes.trim()) ? 'link' : 'text',
        content: notes.trim() || null,
        thumbnail: tab === 'image' ? preview : null,
        category: cat,
        emoji: CATS[cat].emoji,
        tags: [],
        title: title.trim(),
        summary: data.summary || notes.trim(),
        createdAt: new Date().toISOString(),
      }
      setIdeas((prev) => [idea, ...prev])
      setJustAdded(idea.id)
      setTimeout(() => setJustAdded(null), 1200)
      setTitle('')
      setNotes('')
      clearImage()
    } catch {
      setError("Couldn't generate summary — idea saved with your notes instead.")
    }
    setProcessing(false)
  }

  const onKey = (e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && handleSubmit()

  const deleteIdea = (id) => setIdeas((prev) => prev.filter((i) => i.id !== id))

  const usedCats = [...new Set(ideas.map((i) => i.category))]
  const filtered = filter === 'All' ? ideas : ideas.filter((i) => i.category === filter)
  const canSubmit = !!title.trim() && !processing && (tab === 'image' ? !!preview : true)

  if (!loaded) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <p className="text-stone-400 text-sm">Loading your ideas…</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <header className="bg-white border-b border-stone-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🪣</span>
            <div>
              <h1 className="font-bold text-stone-900 text-base leading-none tracking-tight">Idea Catcher</h1>
              <p className="text-xs text-stone-400 mt-0.5">
                {ideas.length === 0 ? 'No ideas yet' : `${ideas.length} idea${ideas.length !== 1 ? 's' : ''} saved`}
              </p>
            </div>
          </div>
          {ideas.length > 0 && (
            <span className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded-full">
              {usedCats.length} categor{usedCats.length !== 1 ? 'ies' : 'y'}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* ── Input card ── */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-stone-100">
            {[
              { id: 'text',  label: '✏️  Text or link' },
              { id: 'image', label: '🖼️  Screenshot' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setError('') }}
                className={`flex-1 text-sm py-3 font-medium transition-colors border-b-2 ${
                  tab === t.id
                    ? 'border-orange-500 text-orange-600 bg-orange-50'
                    : 'border-transparent text-stone-400 hover:text-stone-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-3">

            {/* Title — both tabs */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={onKey}
              placeholder="Title — e.g. Higgsfield reel concept"
              className="w-full text-sm font-medium text-stone-800 placeholder-stone-300 border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
            />

            {tab === 'text' ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onKeyDown={onKey}
                placeholder="Notes, link, or extra context for the AI summary (optional)"
                rows={2}
                className="w-full text-sm text-stone-700 placeholder-stone-300 border border-stone-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
              />
            ) : (
              <>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => !preview && fileRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center min-h-28 transition-all ${
                    dragging ? 'border-orange-400 bg-orange-50' :
                    preview  ? 'border-stone-200 cursor-default' :
                               'border-stone-200 hover:border-orange-300 hover:bg-stone-50 cursor-pointer'
                  }`}
                >
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => processFile(e.target.files[0])} />
                  {preview ? (
                    <div className="relative w-full p-2">
                      <img src={preview} alt="Preview" className="max-h-48 w-full object-contain rounded-lg" />
                      <button onClick={clearImage}
                        className="absolute top-4 right-4 bg-white border border-stone-200 rounded-full w-6 h-6 text-xs text-stone-400 hover:text-red-500 shadow flex items-center justify-center">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-6">
                      <div className="text-3xl mb-2">📸</div>
                      <p className="text-sm text-stone-500">
                        Drop a screenshot or{' '}
                        <span className="text-orange-500 font-medium">browse to upload</span>
                      </p>
                      <p className="text-xs text-stone-400 mt-1">Supports PNG, JPG, WebP</p>
                    </div>
                  )}
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="Notes or context for the AI summary (optional)"
                  rows={2}
                  className="w-full text-sm text-stone-700 placeholder-stone-300 border border-stone-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                />
              </>
            )}

            {/* Category picker */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-stone-400 shrink-0">Category</label>
              <select
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="flex-1 text-sm text-stone-700 border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent bg-white"
              >
                {CAT_KEYS.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATS[cat].emoji} {cat}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-amber-500 text-xs">{error}</p>}

            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-400">⌘ Enter to save</span>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all bg-orange-500 hover:bg-orange-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {processing
                  ? <><span className="inline-block animate-spin">⏳</span> Summarising…</>
                  : '🪣 Catch idea'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Category filter pills ── */}
        {ideas.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {['All', ...usedCats].map((cat) => {
              const info = CATS[cat]
              const count = cat === 'All' ? ideas.length : ideas.filter((i) => i.category === cat).length
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    filter === cat
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-orange-300'
                  }`}
                >
                  {info ? info.emoji + ' ' : ''}{cat} ({count})
                </button>
              )
            })}
          </div>
        )}

        {/* ── Ideas grid ── */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">{ideas.length === 0 ? '🧠' : '🔍'}</div>
            <p className="text-stone-500 font-medium">
              {ideas.length === 0 ? 'Your idea board is empty' : 'Nothing in this category yet'}
            </p>
            <p className="text-stone-400 text-sm mt-1">
              {ideas.length === 0
                ? 'Catch your first idea above!'
                : 'Pick a different filter to browse your ideas.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {filtered.map((idea) => {
              const cat = CATS[idea.category] || CATS['Brand Storytelling']
              const isNew = idea.id === justAdded
              return (
                <div
                  key={idea.id}
                  className={`bg-white border border-stone-100 border-l-4 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group ${
                    isNew ? 'ring-2 ring-orange-300' : ''
                  }`}
                  style={{ borderLeftColor: cat.hex }}
                >
                  {idea.thumbnail && (
                    <img src={idea.thumbnail} alt="" className="w-full h-32 object-cover" />
                  )}
                  <div className="p-4">
                    {/* Badge + delete */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cat.badge}`}>
                        {cat.emoji} {idea.category}
                      </span>
                      <button
                        onClick={() => deleteIdea(idea.id)}
                        className="text-stone-200 hover:text-red-400 text-sm opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete idea"
                      >
                        🗑
                      </button>
                    </div>

                    {/* Title */}
                    {idea.title && (
                      <p className="font-semibold text-stone-900 text-sm leading-snug mb-1">{idea.title}</p>
                    )}

                    {/* AI summary */}
                    {idea.summary && (
                      <p className="text-sm text-stone-500 leading-relaxed mb-2"
                         style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {idea.summary}
                      </p>
                    )}

                    {/* Link button */}
                    {idea.content && (() => {
                      const urlMatch = idea.content.match(/https?:\/\/[^\s]+/)
                      const url = idea.type === 'link' ? idea.content : urlMatch?.[0]
                      return url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-medium text-white mb-2 px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                          style={{ backgroundColor: cat.hex }}
                        >
                          <span>🔗</span>
                          <span className="truncate">Open link</span>
                          <span className="ml-auto opacity-70">↗</span>
                        </a>
                      ) : null
                    })()}

                    <p className="text-xs text-stone-300 mt-1">
                      {new Date(idea.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
