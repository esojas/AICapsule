import { useSearchParams } from 'react-router-dom'

export default function Login() {
  const [params] = useSearchParams()
  const hasError = params.get('error')

  return (
    <main className="container">
      <h1>Sign in</h1>
      {hasError && <p className="error">Login failed. Please try again.</p>}
      <a className="btn" href="/api/auth/github">Sign in with GitHub</a>
    </main>
  )
}