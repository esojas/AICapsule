import { useState } from 'react'

const empty = {
  project_name: '',
  prompt_title: '',
  prompt_version: 'v1',
  prompt_text: '',
  response_summary: '',
  category: 'Coding',
  usefulness: 'Good',
  reviewed: false,
  improved: false,
  screenshot_url: '',
  notes: '',
}

// DB stores reviewed/improved as 0/1 and may have nulls
function fromRecord(r) {
  const out = { ...empty }
  for (const k of Object.keys(empty)) if (r[k] != null) out[k] = r[k]
  out.reviewed = !!r.reviewed
  out.improved = !!r.improved
  return out
}

export default function CapsuleForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? fromRecord(initial) : empty)
  const [saving, setSaving] = useState(false)

  function set(e) {
    const { name, type, value, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    const ok = await onSave(form)
    setSaving(false)
    if (ok && !initial) setForm(empty)
  }

  return (
    <form onSubmit={submit} className="form">
      <label>Project name *
        <input name="project_name" value={form.project_name} onChange={set} required />
      </label>
      <label>Prompt title *
        <input name="prompt_title" value={form.prompt_title} onChange={set} required />
      </label>
      <label>Version
        <input name="prompt_version" value={form.prompt_version} onChange={set} />
      </label>
      <label>Prompt text *
        <textarea name="prompt_text" rows="4" value={form.prompt_text} onChange={set} required />
      </label>
      <label>Response summary
        <textarea name="response_summary" rows="2" value={form.response_summary} onChange={set} />
      </label>
      <label>Category
        <select name="category" value={form.category} onChange={set}>
          <option>Coding</option>
          <option>Writing</option>
          <option>Research</option>
          <option>Other</option>
        </select>
      </label>
      <label>Usefulness
        <select name="usefulness" value={form.usefulness} onChange={set}>
          <option>Good</option>
          <option>Needs Improvement</option>
        </select>
      </label>
      <label className="check">
        <input type="checkbox" name="reviewed" checked={form.reviewed} onChange={set} />
        Response reviewed
      </label>
      <label className="check">
        <input type="checkbox" name="improved" checked={form.improved} onChange={set} />
        Output improved
      </label>
      <label>Screenshot URL
        <input name="screenshot_url" value={form.screenshot_url} onChange={set} placeholder="https://..." />
      </label>
      <label>Notes
        <textarea name="notes" rows="2" value={form.notes} onChange={set} />
      </label>

      <div className="actions">
        <button type="submit" className="btn" disabled={saving}>
          {initial ? 'Update capsule' : 'Create capsule'}
        </button>
        {initial && <button type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  )
}