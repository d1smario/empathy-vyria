"use client"

import React from "react"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Upload, 
  FileUp, 
  Check, 
  X, 
  AlertCircle, 
  File,
  Bike,
  Footprints,
  Waves,
  Activity
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ManualUploadSectionProps {
  onUploadComplete?: () => void
}

interface UploadedFile {
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  result?: any
  error?: string
}

const FILE_ICONS: Record<string, string> = {
  fit: '📊',
  tcx: '📈',
  gpx: '🗺️',
  json: '📝'
}

const ACTIVITY_ICONS: Record<string, any> = {
  cycling: Bike,
  running: Footprints,
  swimming: Waves,
  other: Activity
}

export function ManualUploadSection({ onUploadComplete }: ManualUploadSectionProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    addFiles(selectedFiles)
  }

  const addFiles = (newFiles: File[]) => {
    const validExtensions = ['fit', 'tcx', 'gpx', 'json', 'gz']
    const validFiles = newFiles.filter(file => {
      const nameLower = file.name.toLowerCase()
      // Accept .fit.gz, .tcx.gz, .gpx.gz, .json.gz or plain extensions
      if (nameLower.endsWith('.fit.gz') || nameLower.endsWith('.tcx.gz') || 
          nameLower.endsWith('.gpx.gz') || nameLower.endsWith('.json.gz')) {
        return true
      }
      const ext = nameLower.split('.').pop()
      return ext && validExtensions.includes(ext)
    })

    const uploadedFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0
    }))

    setFiles(prev => [...prev, ...uploadedFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFile = async (uploadedFile: UploadedFile, index: number) => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }

    const formData = new FormData()
    formData.append('file', uploadedFile.file)

    // Update status to uploading
    setFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, status: 'uploading', progress: 10 } : f
    ))

    try {
      const response = await fetch('/api/activities/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      // Simulate progress
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, progress: 50 } : f
      ))

      const result = await response.json()

      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, progress: 100 } : f
      ))

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      // Update status to success
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'success', result } : f
      ))

      return result

    } catch (error: any) {
      // Update status to error
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'error', error: error.message } : f
      ))
      throw error
    }
  }

  const uploadAllFiles = async () => {
    setIsUploading(true)
    
    const pendingFiles = files.filter(f => f.status === 'pending')
    
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'pending') {
        try {
          await uploadFile(files[i], i)
        } catch (error) {
          console.error('Upload error:', error)
        }
      }
    }

    setIsUploading(false)
    
    // Notify parent
    if (onUploadComplete) {
      onUploadComplete()
    }
  }

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'success'))
  }

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const pendingCount = files.filter(f => f.status === 'pending').length
  const successCount = files.filter(f => f.status === 'success').length
  const errorCount = files.filter(f => f.status === 'error').length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Manuale
        </CardTitle>
        <CardDescription>
          Carica file di attività direttamente dal tuo computer (FIT, TCX, GPX, JSON)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-muted hover:border-muted-foreground/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".fit,.tcx,.gpx,.json,.gz,.fit.gz,.tcx.gz,.gpx.gz"
            onChange={handleFileSelect}
            className="hidden"
          />
          <FileUp className={`h-10 w-10 mx-auto mb-4 ${
            isDragging ? 'text-primary' : 'text-muted-foreground'
          }`} />
          <p className="text-sm font-medium">
            {isDragging ? 'Rilascia i file qui' : 'Trascina i file qui o clicca per caricare'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Formati supportati: FIT, TCX, GPX, JSON (anche compressi .gz)
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                File selezionati ({files.length})
              </span>
              <div className="flex gap-2">
                {successCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearCompleted}
                    className="text-xs"
                  >
                    Rimuovi completati
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((uploadedFile, index) => {
                const ext = getFileExtension(uploadedFile.file.name)
                const ActivityIcon = uploadedFile.result?.activity?.type 
                  ? ACTIVITY_ICONS[uploadedFile.result.activity.type] || Activity
                  : File

                return (
                  <div 
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      uploadedFile.status === 'success' ? 'bg-green-500/5 border-green-500/30' :
                      uploadedFile.status === 'error' ? 'bg-red-500/5 border-red-500/30' :
                      uploadedFile.status === 'uploading' ? 'bg-blue-500/5 border-blue-500/30' :
                      'bg-muted/30'
                    }`}
                  >
                    {/* File Icon */}
                    <div className="text-2xl">
                      {FILE_ICONS[ext] || '📄'}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {uploadedFile.file.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(uploadedFile.file.size)}</span>
                        <Badge variant="secondary" className="text-xs uppercase">
                          {ext}
                        </Badge>
                        {uploadedFile.result?.activity && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{uploadedFile.result.activity.type}</span>
                            {uploadedFile.result.activity.distance && (
                              <>
                                <span>•</span>
                                <span>{(uploadedFile.result.activity.distance / 1000).toFixed(2)} km</span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                      
                      {/* Progress bar */}
                      {uploadedFile.status === 'uploading' && (
                        <Progress value={uploadedFile.progress} className="h-1 mt-2" />
                      )}
                      
                      {/* Error message */}
                      {uploadedFile.error && (
                        <p className="text-xs text-red-500 mt-1">{uploadedFile.error}</p>
                      )}
                    </div>

                    {/* Status Icon */}
                    <div>
                      {uploadedFile.status === 'success' && (
                        <Check className="h-5 w-5 text-green-500" />
                      )}
                      {uploadedFile.status === 'error' && (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      {uploadedFile.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFile(index)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Upload Button */}
            {pendingCount > 0 && (
              <Button 
                onClick={uploadAllFiles}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-pulse" />
                    Caricamento in corso...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Carica {pendingCount} file
                  </>
                )}
              </Button>
            )}

            {/* Summary */}
            {(successCount > 0 || errorCount > 0) && (
              <Alert className={errorCount > 0 ? 'border-yellow-500/50' : 'border-green-500/50'}>
                <AlertDescription className="text-sm">
                  {successCount > 0 && (
                    <span className="text-green-600">{successCount} file caricati con successo. </span>
                  )}
                  {errorCount > 0 && (
                    <span className="text-red-600">{errorCount} file con errori.</span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
