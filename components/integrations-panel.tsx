"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Upload, RefreshCw, Link2, Activity, Moon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface Service {
  id: string
  name: string
  status: "connected" | "disconnected" | "error"
  icon: string
  description: string
  dataTypes: string[]
}

export const IntegrationsPanel = () => {
  const [isSyncing, setIsSyncing] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [connectionStep, setConnectionStep] = useState<"intro" | "connecting" | "success">("intro")

  const [services, setServices] = useState<Service[]>([
    {
      id: "garmin",
      name: "Garmin Connect",
      status: "connected",
      icon: "https://upload.wikimedia.org/wikipedia/en/thumb/9/90/Garmin_logo.svg/1200px-Garmin_logo.svg.png",
      description: "Syncs activities, daily heart rate, stress, and sleep data.",
      dataTypes: ["Activity", "HRV", "Sleep", "Steps"],
    },
    {
      id: "strava",
      name: "Strava",
      status: "connected",
      icon: "https://seeklogo.com/images/S/strava-logo-C419D1A561-seeklogo.com.png",
      description: "Imports public activities and segments.",
      dataTypes: ["Activity"],
    },
    {
      id: "whoop",
      name: "Whoop",
      status: "disconnected",
      icon: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Whoop_Inc._Logo.jpg",
      description: "High-fidelity recovery, sleep, and strain metrics.",
      dataTypes: ["Recovery", "Sleep", "HRV"],
    },
    {
      id: "oura",
      name: "Oura",
      status: "disconnected",
      icon: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Oura_Ring_logo.svg",
      description: "Detailed sleep stages, readiness score, and body temperature.",
      dataTypes: ["Sleep", "Readiness", "Temperature"],
    },
    {
      id: "abbott",
      name: "Abbott LibreView",
      status: "connected",
      icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Abbott_Laboratories_logo.svg/2560px-Abbott_Laboratories_logo.svg.png",
      description: "Continuous Glucose Monitoring (CGM) data.",
      dataTypes: ["Glucose"],
    },
    {
      id: "zwift",
      name: "Zwift",
      status: "disconnected",
      icon: "https://seeklogo.com/images/Z/zwift-logo-106593575C-seeklogo.com.png",
      description: "Export structured workouts and import virtual rides.",
      dataTypes: ["Activity", "Workout Export"],
    },
    {
      id: "apple",
      name: "Apple Health",
      status: "disconnected",
      icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Apple_Health_icon.svg/1200px-Apple_Health_icon.svg.png",
      description: "Aggregates data from Apple Watch and other HealthKit apps.",
      dataTypes: ["Activity", "Vitals", "Sleep"],
    },
  ])

  const handleSync = () => {
    setIsSyncing(true)
    setTimeout(() => {
      setIsSyncing(false)
      toast.success("Data synchronized successfully", {
        description: "Fetched 12 new activities and latest recovery stats.",
      })
    }, 2000)
  }

  const handleConnect = (service: Service) => {
    setSelectedService(service)
    setConnectionStep("intro")
  }

  const confirmConnection = () => {
    if (!selectedService) return
    setConnectionStep("connecting")

    setTimeout(() => {
      setServices((prev) => prev.map((s) => (s.id === selectedService.id ? { ...s, status: "connected" } : s)))
      setConnectionStep("success")
      toast.success(`Connected to ${selectedService.name}`)
    }, 1500)
  }

  const handleDisconnect = (service: Service) => {
    if (confirm(`Are you sure you want to disconnect ${service.name}?`)) {
      setServices((prev) => prev.map((s) => (s.id === service.id ? { ...s, status: "disconnected" } : s)))
      toast.info(`Disconnected ${service.name}`)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
          <p className="text-muted-foreground">Manage your connected devices and services via Rook API.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync All Data"}
          </Button>
        </div>
      </div>

      {/* Main Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id} className="flex flex-col">
            <CardHeader className="flex-row gap-4 items-start space-y-0 pb-2">
              <div className="h-12 w-12 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-2 border">
                <img
                  src={service.icon || "/placeholder.svg"}
                  alt={service.name}
                  className="object-contain h-full w-full"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base flex items-center justify-between">
                  {service.name}
                  {service.status === "connected" && (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none dark:bg-emerald-900/30 dark:text-emerald-400"
                    >
                      Connected
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="line-clamp-2 mt-1">{service.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pb-2">
              <div className="flex flex-wrap gap-1 mt-2">
                {service.dataTypes.map((type) => (
                  <Badge key={type} variant="outline" className="text-xs font-normal text-muted-foreground">
                    {type}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              {service.status === "connected" ? (
                <div className="flex gap-2 w-full">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1 bg-transparent">
                        Configure
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{service.name} Settings</DialogTitle>
                        <DialogDescription>Configure data synchronization preferences.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <label className="text-sm font-medium">Auto-Sync</label>
                            <p className="text-xs text-muted-foreground">Automatically fetch new data every hour</p>
                          </div>
                          <Button variant="outline" size="sm" className="bg-primary/10 text-primary border-primary/20">
                            Enabled
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <label className="text-sm font-medium">Historical Import</label>
                            <p className="text-xs text-muted-foreground">Import last 90 days of data</p>
                          </div>
                          <Button variant="outline" size="sm">
                            Start Import
                          </Button>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="destructive" onClick={() => handleDisconnect(service)}>
                          Disconnect
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <Dialog
                  open={selectedService?.id === service.id}
                  onOpenChange={(open) => !open && setSelectedService(null)}
                >
                  <DialogTrigger asChild>
                    <Button className="w-full" onClick={() => handleConnect(service)}>
                      Connect
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    {connectionStep === "intro" && (
                      <>
                        <DialogHeader>
                          <DialogTitle>Connect {service.name}</DialogTitle>
                          <DialogDescription>
                            You will be redirected to {service.name} to authorize access.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-6 flex justify-center">
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-background px-2 text-muted-foreground">Powered by Rook</span>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setSelectedService(null)}>
                            Cancel
                          </Button>
                          <Button onClick={confirmConnection}>Authorize</Button>
                        </DialogFooter>
                      </>
                    )}
                    {connectionStep === "connecting" && (
                      <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                        <p>Connecting to {service.name}...</p>
                      </div>
                    )}
                    {connectionStep === "success" && (
                      <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                        <p className="font-medium text-lg">Successfully Connected!</p>
                        <Button onClick={() => setSelectedService(null)}>Done</Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              )}
            </CardFooter>
          </Card>
        ))}

        {/* Manual Upload Card */}
        <Card className="flex flex-col border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Manual Upload
            </CardTitle>
            <CardDescription>Support for .fit, .tcx, .gpx</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-2 cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
              <div className="mx-auto h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                <Link2 className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">Drag & Drop files</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Source Status */}
      <Card>
        <CardHeader>
          <CardTitle>Data Streams</CardTitle>
          <CardDescription>Real-time status of your data ingestion pipeline.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Training Load</p>
                  <p className="text-sm text-muted-foreground">Aggregating from Garmin, Strava, Zwift</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
              >
                Active
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Moon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Sleep & Recovery</p>
                  <p className="text-sm text-muted-foreground">Aggregating from Oura, Whoop</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
              >
                Syncing...
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
