import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getMe, logout, listCapsules, createCapsule, updateCapsule, deleteCapsule,
} from '../api.js'
import CapsuleForm from '../components/CapsuleForm.jsx'
import CapsuleList from '../components/CapsuleList.jsx'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [capsules, setCapsules] = useState([])
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        setUser(await getMe())
        setCapsules(await listCapsules())
      } catch (err) {
        if (err.status === 401) navigate('/login', { replace: true })
        else setError('Could not load your capsules.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [navigate])

  async function handleSave(data) {
    setError('')
    try {
      if (editing) {
        const updated = await updateCapsule(editing.id, data)
        setCapsules((cs) => cs.map((c) => (c.id === updated.id ? updated : c)))
        setEditing(null)
      } else {
        const created = await createCapsule(data)
        setCapsules((cs) => [created, ...cs])
      }
      return true
    } catch (err) {
      if (err.status === 401) navigate('/login', { replace: true })
      setError(err.body?.error || 'Save failed.')
      return false
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this capsule?')) return
    setError('')
    try {
      await deleteCapsule(id)
      setCapsules((cs) => cs.filter((c) => c.id !== id))
      if (editing?.id === id) setEditing(null)
    } catch (err) {
      if (err.status === 401) navigate('/login', { replace: true })
      setError('Delete failed.')
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  if (loading) return <main className="container"><p>Loading…</p></main>

  return (
    <main className="container">
      <header className="topbar">
        <h1>My Capsules</h1>
        <div>
          {user && <span className="muted">Signed in as {user.login} </span>}
          <button onClick={handleLogout}>Log out</button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <h2>{editing ? 'Edit capsule' : 'New capsule'}</h2>
      <CapsuleForm
        key={editing ? editing.id : 'new'}
        initial={editing}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />

      <h2>Saved capsules ({capsules.length})</h2>
      <CapsuleList capsules={capsules} onEdit={setEditing} onDelete={handleDelete} />
    </main>
  )
}