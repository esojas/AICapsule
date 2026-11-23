import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <main className="container">
      <h1>AI Capsule</h1>
      <p>
        A private library for the AI prompts you actually use. Save a prompt with its
        project, version, category and notes, record what the AI answered, and mark
        whether it was useful and whether it improved your output.
      </p>
      <p>Sign in with GitHub to keep, review and improve your own prompt records.</p>
      <Link className="btn" to="/login">Get started</Link>
    </main>
  )
}