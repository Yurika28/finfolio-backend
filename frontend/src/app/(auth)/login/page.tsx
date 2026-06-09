'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { authService } from '@/services/auth.service'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authService.login({ email, password })
      login(res.data.token, res.data.user)
      router.push('/')
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } }
      const message = e.response?.data?.error || 'Invalid email or password'
      toast.error('Sign in failed', { description: message, position: 'top-center' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800">
        <CardHeader className="text-center">
          <CardTitle className="text-white text-2xl">FinFolio</CardTitle>
          <CardDescription className="text-zinc-400">Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-zinc-300 text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-green-500"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="text-zinc-300 text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-green-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-zinc-500 text-sm mt-4">
            No account?{' '}
            <Link href="/register" className="text-green-400 hover:text-green-300">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
