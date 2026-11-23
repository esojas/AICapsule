const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

const toInt = (v) => (v === true || v === 1 || v === '1' || v === 'Yes' ? 1 : 0);

// Pick ONLY the allowed fields from the request body.
// user_id and created_at are deliberately not in this list.
function cleanBody(body = {}) {
  return {
    project_name: (body.project_name || '').trim(),
    prompt_title: (body.prompt_title || '').trim(),
    prompt_version: body.prompt_version || null,
    prompt_text: (body.prompt_text || '').trim(),
    response_summary: body.response_summary || null,
    category: body.category || null,
    usefulness: body.usefulness || null,
    reviewed: toInt(body.reviewed),
    improved: toInt(body.improved),
    screenshot_url: body.screenshot_url || null,
    notes: body.notes || null,
  };
}

function missingRequired(c) {
  return !c.project_name || !c.prompt_title || !c.prompt_text;
}

// READ: only this user's records
router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM capsules WHERE user_id = ? ORDER BY created_at DESC, id DESC')
    .all(req.user.id);
  res.json(rows);
});

// CREATE: owner comes from the verified JWT, never from the body
router.post('/', requireAuth, (req, res) => {
  const c = cleanBody(req.body);
  if (missingRequired(c)) {
    return res.status(400).json({ error: 'project_name, prompt_title and prompt_text are required' });
  }

  const result = db
    .prepare(
      `INSERT INTO capsules
        (user_id, project_name, prompt_title, prompt_version, prompt_text,
         response_summary, category, usefulness, reviewed, improved, screenshot_url, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user.id, c.project_name, c.prompt_title, c.prompt_version, c.prompt_text,
      c.response_summary, c.category, c.usefulness, c.reviewed, c.improved,
      c.screenshot_url, c.notes
    );

  const created = db.prepare('SELECT * FROM capsules WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

// UPDATE: WHERE id AND user_id, so you can't touch someone else's record
router.put('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

  const c = cleanBody(req.body);
  if (missingRequired(c)) {
    return res.status(400).json({ error: 'project_name, prompt_title and prompt_text are required' });
  }

  const result = db
    .prepare(
      `UPDATE capsules SET
         project_name = ?, prompt_title = ?, prompt_version = ?, prompt_text = ?,
         response_summary = ?, category = ?, usefulness = ?, reviewed = ?,
         improved = ?, screenshot_url = ?, notes = ?
       WHERE id = ? AND user_id = ?`
    )
    .run(
      c.project_name, c.prompt_title, c.prompt_version, c.prompt_text,
      c.response_summary, c.category, c.usefulness, c.reviewed, c.improved,
      c.screenshot_url, c.notes, id, req.user.id
    );

  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });

  res.json(db.prepare('SELECT * FROM capsules WHERE id = ?').get(id));
});

// DELETE: same ownership rule
router.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

  const result = db
    .prepare('DELETE FROM capsules WHERE id = ? AND user_id = ?')
    .run(id, req.user.id);

  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });

  res.json({ ok: true });
});

module.exports = router;
