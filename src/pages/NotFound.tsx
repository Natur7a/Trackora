import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function NotFound() {
  const location = useLocation()

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-4">
        <h1 className="display-serif text-5xl font-bold">404</h1>
        <p className="text-lg text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline underline-offset-4 hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  )
}

export default NotFound