"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Link2, 
  Check, 
  X, 
  RefreshCw, 
  Upload, 
  AlertCircle, 
  Clock,
  Activity,
  Moon,
  Heart,
  Dumbbell,
  ExternalLink
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { RookProvider } from "@/lib/rook/types"
import { ManualUploadSection } from "@/components/manual-upload-section" // Import ManualUploadSection

interface DeviceIntegrationsProps {
  athleteId?: string
  userId?: string
}

interface ProviderStatus {
  provider: RookProvider
  name: string
  logo: string
  category: 'wearable' | 'app' | 'platform' | 'cgm'
  dataTypes: string[]
  requiresMobile: boolean
  description: string
  isConnected: boolean
  connectionId?: string
  connectedAt?: string
  lastSyncAt?: string
  syncStatus: string
  syncError?: string
}

// Provider icons/emojis as fallback
const PROVIDER_ICONS: Record<string, string> = {
  garmin: "⌚",
  polar: "❤️",
  whoop: "💪",
  oura: "💍",
  strava: "🏃",
  fitbit: "📱",
  suunto: "🏔️",
  coros: "⏱️",
  withings: "⚖️",
  trainingpeaks: "📈",
  wahoo: "🚴",
  zwift: "🎮",
  peloton: "🚲",
  eight_sleep: "🛏️",
  apple_health: "🍎",
  health_connect: "🤖",
  dexcom: "📊",
  freestyle_libre: "💉",
}

// Provider colors
const PROVIDER_COLORS: Record<string, string> = {
  garmin: "#007CC3",
  polar: "#D32F2F",
  whoop: "#00B388",
  oura: "#7C3AED",
  strava: "#FC4C02",
  fitbit: "#00B0B9",
  suunto: "#1A1A1A",
  coros: "#0066CC",
  withings: "#00A19B",
  trainingpeaks: "#1A1A1A",
  wahoo: "#0066FF",
  zwift: "#FF6B00",
  peloton: "#FF0033",
  eight_sleep: "#1A1A1A",
  apple_health: "#FF2D55",
  health_connect: "#4285F4",
  dexcom: "#00A3E0",
  freestyle_libre: "#0072CE",
}

export function DeviceIntegrations({ athleteId, userId }: DeviceIntegrationsProps) {
  const [providers, setProviders] = useState<ProviderStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'wearable' | 'app' | 'platform' | 'cgm'>('all')

  // Load provider status on mount
  useEffect(() => {
    loadProviderStatus()
  }, [])

  const loadProviderStatus = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setError("Devi essere autenticato per vedere le integrazioni")
        setLoading(false)
        return
      }

      const response = await fetch('/api/rook/status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load provider status')
      }

      const data = await response.json()
      setProviders(data.connections || [])
    } catch (err) {
      console.error('Error loading providers:', err)
      setError("Errore nel caricamento delle integrazioni")
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (provider: ProviderStatus) => {
    if (provider.requiresMobile) {
      alert(`${provider.name} richiede l'app mobile ROOK per la connessione. Scarica l'app e collega il tuo account.`)
      return
    }

    setActionLoading(provider.provider)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`/api/rook/authorize?provider=${provider.provider}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to get authorization URL')
      }

      const data = await response.json()
      
      // Redirect to provider OAuth
      if (data.authorization_url) {
        window.location.href = data.authorization_url
      }
    } catch (err) {
      console.error('Error connecting:', err)
      setError(`Errore nella connessione a ${provider.name}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDisconnect = async (provider: ProviderStatus) => {
    if (!confirm(`Sei sicuro di voler disconnettere ${provider.name}?`)) {
      return
    }

    setActionLoading(provider.provider)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/rook/revoke', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider: provider.provider })
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect')
      }

      // Refresh status
      await loadProviderStatus()
    } catch (err) {
      console.error('Error disconnecting:', err)
      setError(`Errore nella disconnessione da ${provider.name}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRefreshStatus = async () => {
    setActionLoading('refresh')
    
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      await fetch('/api/rook/status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      await loadProviderStatus()
    } catch (err) {
      console.error('Error refreshing:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredProviders = activeTab === 'all' 
    ? providers 
    : providers.filter(p => p.category === activeTab)

  const connectedCount = providers.filter(p => p.isConnected).length
  const wearableCount = providers.filter(p => p.category === 'wearable').length
  const appCount = providers.filter(p => p.category === 'app').length
  const platformCount = providers.filter(p => p.category === 'platform').length

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'wearable': return <Activity className="h-4 w-4" />
      case 'app': return <Heart className="h-4 w-4" />
      case 'platform': return <Dumbbell className="h-4 w-4" />
      case 'cgm': return <Moon className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Integrazioni Dispositivi</h3>
          <p className="text-sm text-muted-foreground">
            Collega i tuoi dispositivi e piattaforme per sincronizzare automaticamente i dati
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {connectedCount} / {providers.length} connessi
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshStatus}
            disabled={actionLoading === 'refresh'}
            className="bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Connetti i tuoi dispositivi per importare automaticamente attivita, metriche di salute e dati dei sensori. 
          Tutti i dati sono archiviati in modo sicuro e accessibili solo a te tramite TryRook.io.
        </AlertDescription>
      </Alert>

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="all">
            Tutti ({providers.length})
          </TabsTrigger>
          <TabsTrigger value="wearable">
            Wearable ({wearableCount})
          </TabsTrigger>
          <TabsTrigger value="app">
            App ({appCount})
          </TabsTrigger>
          <TabsTrigger value="platform">
            Platform ({platformCount})
          </TabsTrigger>
          <TabsTrigger value="cgm">
            CGM
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProviders.map((provider) => (
              <Card 
                key={provider.provider} 
                className={`relative overflow-hidden ${
                  provider.isConnected 
                    ? 'border-green-500/50 bg-green-500/5' 
                    : ''
                }`}
              >
                {/* Status indicator */}
                {provider.isConnected && (
                  <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                    <div className="absolute top-2 right-[-20px] w-[80px] text-center text-xs font-semibold py-1 bg-green-500 text-white transform rotate-45">
                      Online
                    </div>
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div 
                      className="text-2xl p-2 rounded-lg" 
                      style={{ backgroundColor: `${PROVIDER_COLORS[provider.provider] || '#666'}20` }}
                    >
                      {PROVIDER_ICONS[provider.provider] || '📱'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base flex items-center gap-2">
                        {provider.name}
                        {provider.requiresMobile && (
                          <Badge variant="secondary" className="text-xs">
                            Mobile
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1 line-clamp-2">
                        {provider.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Data types */}
                  <div className="flex flex-wrap gap-1">
                    {provider.dataTypes.slice(0, 4).map((type, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {type.replace(/_/g, ' ').replace('summary', '').replace('event', '').trim()}
                      </Badge>
                    ))}
                    {provider.dataTypes.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{provider.dataTypes.length - 4}
                      </Badge>
                    )}
                  </div>

                  {/* Connection info */}
                  {provider.isConnected && (
                    <div className="space-y-1">
                      {provider.lastSyncAt && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Ultimo sync: {new Date(provider.lastSyncAt).toLocaleString('it-IT')}
                        </div>
                      )}
                      {provider.syncError && (
                        <div className="flex items-center gap-2 text-xs text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {provider.syncError}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {provider.isConnected ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => handleDisconnect(provider)}
                          disabled={actionLoading === provider.provider}
                        >
                          {actionLoading === provider.provider ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <X className="h-4 w-4 mr-2" />
                          )}
                          Disconnetti
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleConnect(provider)}
                        disabled={actionLoading === provider.provider}
                      >
                        {actionLoading === provider.provider ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Link2 className="h-4 w-4 mr-2" />
                        )}
                        {provider.requiresMobile ? 'Setup Mobile' : 'Connetti'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Manual Upload Section */}
      <ManualUploadSection onUploadComplete={loadProviderStatus} />

      {/* Powered by Rook */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>Powered by</span>
        <a 
          href="https://www.tryrook.io" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          TryRook.io
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}
