import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(request: NextRequest) {
  try {
    const { athleteEmail, coachName, athleteName, isNewUser } = await request.json()

    if (!athleteEmail) {
      return NextResponse.json({ error: "Email atleta richiesta", success: false }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      console.log("[v0] RESEND_API_KEY not configured - skipping email")
      return NextResponse.json({
        success: true,
        warning: "Email non inviata - RESEND_API_KEY non configurata",
        skipped: true,
      })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const subject = isNewUser
      ? `${coachName || "Un coach"} ti invita su EMPATHY Performance`
      : `${coachName || "Un coach"} vuole collegarsi con te su EMPATHY Performance`

    const htmlContent = isNewUser
      ? `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
            <div style="background: linear-gradient(135deg, #7c3aed, #c026d3); padding: 40px 30px; text-align: center;">
              <div style="display: inline-block; background-color: #c026d3; width: 60px; height: 60px; border-radius: 12px; line-height: 60px; font-size: 28px; font-weight: bold; color: white; margin-bottom: 16px;">E</div>
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">EMPATHY Performance bioMAP</h1>
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="color: white; margin: 0 0 20px; font-size: 22px;">Ciao!</h2>
              <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                <strong style="color: #e2e8f0;">${coachName || "Un coach"}</strong> ti ha invitato a unirti alla piattaforma EMPATHY Performance come suo atleta.
              </p>
              <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                EMPATHY Performance è una piattaforma avanzata per il monitoraggio delle prestazioni atletiche, con analisi metaboliche, piani di allenamento personalizzati e molto altro.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://progetto-empatia-vyria.vercel.app"}/register?coach_invite=true&email=${encodeURIComponent(athleteEmail)}" 
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #c026d3); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Registrati ora
                </a>
              </div>
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 30px 0 0; text-align: center;">
                Dopo la registrazione, troverai l'invito del coach nella tua dashboard.
              </p>
            </div>
            <div style="background-color: #0f172a; padding: 20px 30px; text-align: center;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                EMPATHY Performance bioMAP - Optimizing Human Performance
              </p>
            </div>
          </div>
        </body>
        </html>
      `
      : `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
            <div style="background: linear-gradient(135deg, #7c3aed, #c026d3); padding: 40px 30px; text-align: center;">
              <div style="display: inline-block; background-color: #c026d3; width: 60px; height: 60px; border-radius: 12px; line-height: 60px; font-size: 28px; font-weight: bold; color: white; margin-bottom: 16px;">E</div>
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">EMPATHY Performance bioMAP</h1>
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="color: white; margin: 0 0 20px; font-size: 22px;">Ciao ${athleteName || "Atleta"}!</h2>
              <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                <strong style="color: #e2e8f0;">${coachName || "Un coach"}</strong> vuole collegarsi con te come coach su EMPATHY Performance.
              </p>
              <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Accettando l'invito, il coach potrà visualizzare i tuoi dati di allenamento e aiutarti a raggiungere i tuoi obiettivi.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://progetto-empatia-vyria.vercel.app"}/dashboard" 
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #c026d3); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Vai alla Dashboard
                </a>
              </div>
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 30px 0 0; text-align: center;">
                Troverai l'invito nella sezione notifiche della tua dashboard.
              </p>
            </div>
            <div style="background-color: #0f172a; padding: 20px 30px; text-align: center;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                EMPATHY Performance bioMAP - Optimizing Human Performance
              </p>
            </div>
          </div>
        </body>
        </html>
      `

    try {
      const { data, error } = await resend.emails.send({
        from: "EMPATHY Performance <onboarding@resend.dev>",
        to: athleteEmail,
        subject: subject,
        html: htmlContent,
      })

      if (error) {
        console.error("[v0] Resend error:", error)
        return NextResponse.json({
          success: true,
          warning: `Email non inviata: ${error.message}`,
          skipped: true,
        })
      }

      return NextResponse.json({ success: true, messageId: data?.id })
    } catch (resendError) {
      console.error("[v0] Resend exception:", resendError)
      return NextResponse.json({
        success: true,
        warning: "Email non inviata per errore tecnico",
        skipped: true,
      })
    }
  } catch (error) {
    console.error("[v0] Email send error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Errore invio email",
      },
      { status: 400 },
    )
  }
}
