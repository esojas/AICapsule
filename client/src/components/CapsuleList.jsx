export default function CapsuleList({ capsules, onEdit, onDelete }) {
  if (capsules.length === 0) {
    return <p className="muted">No capsules yet. Create your first one above.</p>
  }

  return (
    <ul className="list">
      {capsules.map((c) => (
        <li key={c.id} className="card">
          <h3>{c.prompt_title} <span className="muted">{c.prompt_version}</span></h3>
          <p className="muted">
            {c.project_name} · {c.category} · {c.usefulness}
            {c.reviewed ? ' · Reviewed' : ''}
            {c.improved ? ' · Improved' : ''}
          </p>
          <p>{c.prompt_text}</p>
          {c.response_summary && <p><strong>Response:</strong> {c.response_summary}</p>}
          {c.notes && <p><strong>Notes:</strong> {c.notes}</p>}
          {c.screenshot_url && (
            <p><a href={c.screenshot_url} target="_blank" rel="noreferrer">Screenshot</a></p>
          )}
          <p className="muted">Created {c.created_at}</p>
          <div className="actions">
            <button onClick={() => onEdit(c)}>Edit</button>
            <button onClick={() => onDelete(c.id)}>Delete</button>
          </div>
        </li>
      ))}
    </ul>
  )
}