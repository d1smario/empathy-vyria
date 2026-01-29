import { NextResponse } from "next/server"

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const { athleteId, planType, planData } = await request.json()

    if (!athleteId || !planType || !planData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate HTML content for the plan
    const html = generatePlanHTML(planType, planData)

    return NextResponse.json({
      success: true,
      html,
      planType,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error("[Generate Plan PDF] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate plan" },
      { status: 500 }
    )
  }
}

function generatePlanHTML(planType: string, planData: any): string {
  const date = new Date().toLocaleDateString('it-IT', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  if (planType === 'nutrition') {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Piano Nutrizionale - EMPATHY Performance</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; }
    h1 { color: #0891b2; border-bottom: 2px solid #0891b2; padding-bottom: 10px; }
    h2 { color: #06b6d4; margin-top: 30px; }
    h3 { color: #22d3ee; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .date { color: #666; font-size: 14px; }
    .summary { background: #f0fdfa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0891b2; }
    .warning { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b; }
    .day-plan { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 10px 0; }
    .day-plan h4 { margin: 0 0 10px 0; color: #0891b2; text-transform: capitalize; }
    .meal { display: grid; grid-template-columns: 100px 1fr; gap: 10px; margin: 5px 0; }
    .meal-label { font-weight: 600; color: #64748b; }
    .changes { margin: 20px 0; }
    .change-item { padding: 10px; margin: 5px 0; border-radius: 4px; }
    .change-alta { background: #fee2e2; border-left: 3px solid #ef4444; }
    .change-media { background: #fef3c7; border-left: 3px solid #f59e0b; }
    .change-bassa { background: #dcfce7; border-left: 3px solid #22c55e; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Piano Nutrizionale Personalizzato</h1>
    <div class="date">Generato il ${date}</div>
  </div>

  ${planData.summary ? `<div class="summary"><strong>Riepilogo:</strong> ${planData.summary}</div>` : ''}

  ${planData.warnings && planData.warnings.length > 0 ? `
    <div class="warning">
      <strong>Attenzione:</strong>
      <ul>${planData.warnings.map((w: string) => `<li>${w}</li>`).join('')}</ul>
    </div>
  ` : ''}

  ${planData.changes && planData.changes.length > 0 ? `
    <h2>Modifiche Proposte</h2>
    <div class="changes">
      ${planData.changes.map((c: any) => `
        <div class="change-item change-${c.priority}">
          <strong>${c.category}: ${c.field}</strong><br>
          <span style="text-decoration: line-through; color: #999;">${c.currentValue || 'N/A'}</span> → 
          <span style="color: #0891b2; font-weight: 600;">${c.proposedValue}</span><br>
          <em style="color: #64748b; font-size: 12px;">${c.reason}</em>
        </div>
      `).join('')}
    </div>
  ` : ''}

  ${planData.weeklyPlan ? `
    <h2>Piano Alimentare Settimanale</h2>
    ${Object.entries(planData.weeklyPlan).map(([day, meals]: [string, any]) => `
      <div class="day-plan">
        <h4>${day}</h4>
        ${meals?.colazione ? `<div class="meal"><span class="meal-label">Colazione:</span><span>${meals.colazione}</span></div>` : ''}
        ${meals?.pranzo ? `<div class="meal"><span class="meal-label">Pranzo:</span><span>${meals.pranzo}</span></div>` : ''}
        ${meals?.cena ? `<div class="meal"><span class="meal-label">Cena:</span><span>${meals.cena}</span></div>` : ''}
        ${meals?.snack ? `<div class="meal"><span class="meal-label">Snack:</span><span>${meals.snack}</span></div>` : ''}
      </div>
    `).join('')}
  ` : ''}

  <div class="footer">
    <p>Piano generato da EMPATHY Performance bioMAP - AI Coach</p>
    <p>Questo piano è personalizzato sulla base dei tuoi dati metabolici e delle tue preferenze alimentari.</p>
  </div>
</body>
</html>`
  }

  // Training plan
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Piano Allenamento - EMPATHY Performance</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; }
    h1 { color: #0891b2; border-bottom: 2px solid #0891b2; padding-bottom: 10px; }
    h2 { color: #06b6d4; margin-top: 30px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .date { color: #666; font-size: 14px; }
    .summary { background: #f0fdfa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0891b2; }
    .warning { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b; }
    .tss-box { background: #f8fafc; padding: 15px; border-radius: 8px; display: flex; justify-content: space-around; margin: 20px 0; }
    .tss-item { text-align: center; }
    .tss-value { font-size: 24px; font-weight: 700; color: #0891b2; }
    .tss-label { font-size: 12px; color: #64748b; }
    .workout-day { display: flex; align-items: center; padding: 15px; margin: 10px 0; background: #f8fafc; border-radius: 8px; }
    .day-name { width: 100px; font-weight: 600; color: #0891b2; }
    .workout-type { flex: 1; }
    .workout-details { display: flex; gap: 20px; }
    .detail { text-align: center; }
    .detail-value { font-weight: 600; color: #06b6d4; }
    .detail-label { font-size: 10px; color: #64748b; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Piano Allenamento Settimanale</h1>
    <div class="date">Generato il ${date}</div>
  </div>

  ${planData.summary ? `<div class="summary"><strong>Riepilogo:</strong> ${planData.summary}</div>` : ''}

  ${planData.warnings && planData.warnings.length > 0 ? `
    <div class="warning">
      <strong>Attenzione:</strong>
      <ul>${planData.warnings.map((w: string) => `<li>${w}</li>`).join('')}</ul>
    </div>
  ` : ''}

  ${planData.weeklyTSS ? `
    <div class="tss-box">
      <div class="tss-item">
        <div class="tss-value">${planData.weeklyTSS.current || 0}</div>
        <div class="tss-label">TSS Attuale</div>
      </div>
      <div class="tss-item">
        <div class="tss-value" style="color: #22c55e;">→</div>
        <div class="tss-label"></div>
      </div>
      <div class="tss-item">
        <div class="tss-value">${planData.weeklyTSS.proposed || 0}</div>
        <div class="tss-label">TSS Proposto</div>
      </div>
    </div>
    ${planData.weeklyTSS.rationale ? `<p style="text-align: center; color: #64748b; font-style: italic;">${planData.weeklyTSS.rationale}</p>` : ''}
  ` : ''}

  ${planData.weeklyPlan && Array.isArray(planData.weeklyPlan) ? `
    <h2>Sessioni Settimanali</h2>
    ${planData.weeklyPlan.map((d: any) => `
      <div class="workout-day">
        <div class="day-name">${d.name || `Giorno ${(d.day || 0) + 1}`}</div>
        <div class="workout-type">${d.workout}</div>
        <div class="workout-details">
          <div class="detail">
            <div class="detail-value">${d.duration}min</div>
            <div class="detail-label">Durata</div>
          </div>
          <div class="detail">
            <div class="detail-value">${d.zone}</div>
            <div class="detail-label">Zona</div>
          </div>
          <div class="detail">
            <div class="detail-value">${d.tss}</div>
            <div class="detail-label">TSS</div>
          </div>
        </div>
      </div>
      ${d.notes ? `<p style="margin: 0 0 10px 100px; color: #64748b; font-size: 12px; font-style: italic;">${d.notes}</p>` : ''}
    `).join('')}
  ` : ''}

  <div class="footer">
    <p>Piano generato da EMPATHY Performance bioMAP - AI Coach</p>
    <p>Questo piano è personalizzato sulla base del tuo profilo metabolico e del tuo storico allenamenti.</p>
  </div>
</body>
</html>`
}
