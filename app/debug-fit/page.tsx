"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileUp } from "lucide-react"

export default function DebugFitPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/test-fit-parser', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || 'Parse failed')
      } else {
        setResult(data)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Debug FIT Parser
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".fit,.FIT"
              onChange={handleFileSelect}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          {loading && (
            <div className="p-4 bg-muted rounded-lg text-center">
              Parsing file...
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500">
              Error: {error}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">DataPoints</div>
                  <div className="text-2xl font-bold">{result.dataPointsCount}</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">Records</div>
                  <div className="text-2xl font-bold">{result.recordsCount}</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">Duration</div>
                  <div className="text-2xl font-bold">{result.summary?.duration_seconds ? Math.round(result.summary.duration_seconds / 60) + 'm' : '--'}</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">Avg Power</div>
                  <div className="text-2xl font-bold">{result.summary?.avg_power_watts || '--'}W</div>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-2">Top Level Keys</div>
                <div className="text-sm font-mono">{result.topLevelKeys?.join(', ') || 'none'}</div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-2">Session Keys</div>
                <div className="text-sm font-mono">{result.sessionKeys?.join(', ') || 'none'}</div>
              </div>

              {result.summary && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground mb-2">Summary</div>
                  <pre className="text-xs font-mono overflow-auto max-h-48">
                    {JSON.stringify(result.summary, null, 2)}
                  </pre>
                </div>
              )}

              {result.sampleDataPoints && result.sampleDataPoints.length > 0 && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="text-xs text-green-500 mb-2">Sample DataPoints (first 3)</div>
                  <pre className="text-xs font-mono overflow-auto max-h-48">
                    {JSON.stringify(result.sampleDataPoints, null, 2)}
                  </pre>
                </div>
              )}

              {result.sampleRecords && result.sampleRecords.length > 0 && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="text-xs text-blue-500 mb-2">Sample Records (first 3)</div>
                  <pre className="text-xs font-mono overflow-auto max-h-48">
                    {JSON.stringify(result.sampleRecords, null, 2)}
                  </pre>
                </div>
              )}

              <div className="p-3 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-2">Full Result</div>
                <pre className="text-xs font-mono overflow-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
