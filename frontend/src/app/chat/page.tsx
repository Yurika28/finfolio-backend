'use client'
import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import Navbar from '@/components/features/navigation-bar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useChat } from '@/hooks/useChat'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

function MessageBubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-green-500 text-black font-medium'
            : 'bg-zinc-800 text-zinc-200'
        }`}
      >
        {content.split('\n').map((line, i) => (
          <span key={i}>{line}{i < content.split('\n').length - 1 && <br />}</span>
        ))}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { messages, isLoading, error, send, clear } = useChat()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  if (!authLoading && !user) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-16 text-center">
          <p className="text-zinc-400 mb-4">Sign in to use the AI market chat</p>
          <Link href="/login">
            <Button className="bg-green-500 hover:bg-green-600 text-black font-semibold">
              Sign In
            </Button>
          </Link>
        </main>
      </div>
    )
  }

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    send(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col flex-1 max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Market Chat</h1>
            <p className="text-zinc-400 text-sm mt-0.5">Ask anything about stocks, crypto, or markets</p>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              className="text-zinc-500 hover:text-zinc-300 text-xs"
            >
              Clear
            </Button>
          )}
        </div>

        <Card className="bg-zinc-900 border-zinc-800 flex flex-col flex-1 min-h-[500px]">
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 gap-3">
                <p className="text-zinc-400 text-sm">Start a conversation about the markets</p>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {[
                    'What is the market sentiment today?',
                    'Explain P/E ratio',
                    'What is Bitcoin doing?',
                    'Best sectors in 2024?',
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => { setInput(suggestion) }}
                      className="text-xs px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {messages.map((msg, i) => (
                <MessageBubble key={i} role={msg.role} content={msg.content} />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 rounded-2xl px-4 py-3 space-y-1.5">
                    <Skeleton className="h-3 w-48 bg-zinc-700" />
                    <Skeleton className="h-3 w-32 bg-zinc-700" />
                  </div>
                </div>
              )}
              {error && (
                <p className="text-red-400 text-xs text-center">{error}</p>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-zinc-800">
            <div className="flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about markets… (Enter to send, Shift+Enter for new line)"
                rows={2}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 resize-none flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-green-500 hover:bg-green-600 text-black font-semibold shrink-0 h-[68px]"
              >
                Send
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
