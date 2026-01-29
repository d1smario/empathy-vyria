import { athleteData } from "../../data/athleteData"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts"
import { TrendingUp, Flame } from "lucide-react"

export const PerformanceAnalysis = () => {
  const { metabolic_model, empathy_zones, athlete } = athleteData

  const pdData = athlete.power_duration_curve.map((p) => ({
    name: p.label,
    watts: p.watts,
    duration: p.duration,
  }))

  const zoneData = empathy_zones.map((z) => ({
    name: z.id,
    fat: z.substrates.fat_g_h,
    cho: z.substrates.cho_g_h,
    kcal: z.substrates.total_kcal_h,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded p-2 shadow text-xs">
          <p className="font-bold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Power (CP)</CardTitle>
            <CardDescription>Aerobic Ceiling</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-baseline gap-1">
              {metabolic_model.cp}
              <span className="text-lg font-normal text-muted-foreground">W</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">VLaMax Model</CardTitle>
            <CardDescription>{metabolic_model.vlamax_class}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-baseline gap-1">
              {metabolic_model.vlamax_model}
              <span className="text-lg font-normal text-muted-foreground">mmol/l/s</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">W' (Anaerobic)</CardTitle>
            <CardDescription>Glycolytic + Alactic Capacity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-baseline gap-1">
              {(metabolic_model.w_prime / 1000).toFixed(1)}
              <span className="text-lg font-normal text-muted-foreground">kJ</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Peak Glycolytic Power</CardTitle>
            <CardDescription>Above CP flux</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-baseline gap-1">
              {metabolic_model.p_gly_peak}
              <span className="text-lg font-normal text-muted-foreground">W</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Power-Duration
            </CardTitle>
            <CardDescription>Input data determining the metabolic fit</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pdData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 1000]} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="watts"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#2563eb" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-4 w-4" /> Substrate Consumption
            </CardTitle>
            <CardDescription>Fuel mix per zone (g/h)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 200]} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: "transparent" }} content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="fat" name="Fat (g/h)" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cho" name="Carbs (g/h)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metabolic Markers (Modeled)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-900">
              <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">FatMax</span>
              <span className="text-2xl font-mono font-bold">{athlete.performance_metrics.fat_max_power} W</span>
            </div>
            <div className="flex flex-col p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">LT1 (Aerobic Threshold)</span>
              <span className="text-2xl font-mono font-bold">{athlete.performance_metrics.lt1} W</span>
            </div>
            <div className="flex flex-col p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
              <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                LT2 (Anaerobic Threshold)
              </span>
              <span className="text-2xl font-mono font-bold">{athlete.performance_metrics.lt2} W</span>
            </div>
            <div className="flex flex-col p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900">
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">VO2max (Est)</span>
              <span className="text-2xl font-mono font-bold">{athlete.vo2max} ml/min/kg</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
