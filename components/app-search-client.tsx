"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Copy, Smartphone, Check, Loader2, RefreshCw } from "lucide-react"
import Image from "next/image"

interface AppResult {
  trackId: number
  trackName: string
  artistName: string
  primaryGenreName: string
  artworkUrl100: string
}

interface Props {
  initialAppId: string
}

export default function AppSearchClient({ initialAppId }: Props) {
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<AppResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [settingAppId, setSettingAppId] = useState<number | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false)
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [warningCountdown, setWarningCountdown] = useState(10)

  // Show warning overlay when setting a new banner
  useEffect(() => {
    const shouldShowWarning = sessionStorage.getItem("showBannerWarning")
    if (shouldShowWarning === "true") {
      setShowWarning(true)
      sessionStorage.removeItem("showBannerWarning")
    }
  }, [])

  // Warning countdown timer
  useEffect(() => {
    if (!showWarning) return

    if (warningCountdown <= 0) {
      setShowWarning(false)
      return
    }

    const timer = setTimeout(() => {
      setWarningCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [showWarning, warningCountdown])

  // Auto-refresh logic
  useEffect(() => {
    const storedCount = sessionStorage.getItem("refreshCount")
    if (storedCount) {
      const count = parseInt(storedCount, 10)
      setRefreshCount(count)
      setIsAutoRefreshing(true)
      
      if (count < 10) {
        refreshTimerRef.current = setTimeout(() => {
          if (sessionStorage.getItem("refreshCount")) {
            sessionStorage.setItem("refreshCount", (count + 1).toString())
            window.location.reload()
          }
        }, 3000)
        
        return () => {
          if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current)
          }
        }
      } else {
        sessionStorage.removeItem("refreshCount")
        setIsAutoRefreshing(false)
      }
    }
  }, [])

  const startAutoRefresh = () => {
    sessionStorage.setItem("refreshCount", "1")
    setIsAutoRefreshing(true)
    setRefreshCount(1)
    window.location.reload()
  }

  const stopAutoRefresh = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
    sessionStorage.removeItem("refreshCount")
    setIsAutoRefreshing(false)
    setRefreshCount(0)
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/search?term=${encodeURIComponent(searchTerm)}&entity=software&limit=25`)
      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      console.error("Search error:", error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (id: number) => {
    try {
      await navigator.clipboard.writeText(id.toString())
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error("Copy error:", error)
    }
  }

  const setAsBanner = (id: number) => {
    setSettingAppId(id)
    sessionStorage.setItem("showBannerWarning", "true")
    window.location.href = `/?appId=${id}`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Warning Overlay */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center text-white">
            <h2 className="text-2xl font-bold mb-6">Important!</h2>
            
            <div className="relative mb-6">
              <Image
                src="/images/img-2330.jpeg"
                alt="Smart App Banner example"
                width={600}
                height={80}
                className="rounded-lg w-full"
              />
              <div className="absolute -bottom-8 right-4 flex flex-col items-center">
                <svg 
                  className="w-8 h-8 text-red-500 animate-bounce" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </div>

            <p className="text-xl font-semibold text-red-400 mb-4 mt-10">
              {"Please don't click the (X) on the banner!"}
            </p>
            <p className="text-muted-foreground mb-6">
              If you dismiss the banner, Safari will hide it and it may not show again for a while.
            </p>

            <div className="text-4xl font-bold mb-2">{warningCountdown}</div>
            <p className="text-sm text-muted-foreground">seconds remaining</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h1 className="text-xl font-semibold">Smart App Banner Tester</h1>
            {isAutoRefreshing ? (
              <Button variant="outline" size="sm" onClick={stopAutoRefresh} className="gap-2 bg-transparent">
                <Loader2 className="w-4 h-4 animate-spin" />
                Refreshing ({refreshCount}/10)... Click to stop
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={startAutoRefresh} className="gap-2 text-muted-foreground bg-transparent">
                <RefreshCw className="w-4 h-4" />
                {"If you can't see the app, click here!"}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search App Store..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch()
              }}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Current Banner Info */}
      <div className="max-w-3xl mx-auto px-4 py-3 border-b border-border bg-secondary/30">
        <p className="text-sm text-muted-foreground">
          Current Banner App ID: <span className="font-mono font-medium text-foreground">{initialAppId}</span>
        </p>
      </div>

      {/* Results */}
      <main className="max-w-3xl mx-auto px-4 py-4">
        {results.length === 0 && !isLoading && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Search for an app to get started</p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
          </div>
        )}

        <div className="divide-y divide-border">
          {results.map((app) => (
            <div key={app.trackId} className="py-5 flex items-center gap-4">
              <Image
                src={app.artworkUrl100 || "/placeholder.svg"}
                alt={app.trackName}
                width={60}
                height={60}
                className="rounded-xl shrink-0"
              />

              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{app.trackName}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {app.artistName} • {app.primaryGenreName}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden sm:block px-3 py-1.5 bg-secondary rounded-md font-mono text-sm">
                  {app.trackId}
                </div>

                <Button variant="outline" size="icon" onClick={() => copyToClipboard(app.trackId)} title="Copy ID">
                  {copiedId === app.trackId ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>

                <Button
                  variant={initialAppId === app.trackId.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAsBanner(app.trackId)}
                  className="gap-1.5"
                  disabled={settingAppId !== null}
                >
                  {settingAppId === app.trackId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Smartphone className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{initialAppId === app.trackId.toString() ? "Active" : "Set"}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
