import { NextResponse } from 'next/server';

export async function POST() {
  // PDF parsing non e supportato in questo ambiente
  // L'utente deve copiare e incollare manualmente il contenuto
  return NextResponse.json({ 
    error: 'PDF_NOT_SUPPORTED',
    message: 'I file PDF non possono essere letti automaticamente.',
    instructions: [
      '1. Apri il file PDF con un lettore PDF',
      '2. Seleziona tutto il testo (Ctrl+A o Cmd+A)',
      '3. Copia il testo (Ctrl+C o Cmd+C)',
      '4. Incolla il testo nella textarea del form di import'
    ]
  }, { status: 400 });
}
