import { NextRequest, NextResponse } from "next/server"
import { parseFitFile, extractActivitySummary } from "@/lib/fit-parser"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 })
    }
    
    console.log('[TEST] File received:', file.name, 'size:', file.size)
    
    const buffer = await file.arrayBuffer()
    console.log('[TEST] Buffer size:', buffer.byteLength)
    
    const parsed = await parseFitFile(buffer)
    console.log('[TEST] Parsed dataPoints:', parsed.dataPoints?.length || 0)
    console.log('[TEST] Parsed records:', parsed.records?.length || 0)
    
    const summary = extractActivitySummary(parsed)
    
    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      dataPointsCount: parsed.dataPoints?.length || 0,
      recordsCount: parsed.records?.length || 0,
      sessionKeys: Object.keys(parsed.session || {}),
      summary,
      sampleDataPoints: parsed.dataPoints?.slice(0, 5),
      sampleRecords: parsed.records?.slice(0, 3)
    })
  } catch (error: any) {
    console.error('[TEST] Error:', error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
