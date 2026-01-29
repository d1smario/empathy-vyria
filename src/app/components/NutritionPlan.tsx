"use client"
import { athleteData } from "../../data/athleteData"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Utensils, AlertCircle } from "lucide-react"
import { Button } from "../components/ui/button"
import { useBioMap } from "../context/BioMapContext"

export const NutritionPlan = () => {
  const { athlete, weekly_biomap } = athleteData
  const { selectedDay, setSelectedDay } = useBioMap()

  const plan = weekly_biomap.find((d) => d.meta.day_name.toUpperCase() === selectedDay.toUpperCase())

  if (!plan) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Data for {selectedDay}</h2>
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide max-w-full">
          {weekly_biomap.map((d) => (
            <Button
              key={d.meta.day_name}
              variant={selectedDay === d.meta.day_name ? "default" : "outline"}
              onClick={() => setSelectedDay(d.meta.day_name)}
              className="whitespace-nowrap"
            >
              {d.meta.day_name}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  // Calculate totals
  const totalMealKcal = plan.meals.reduce((acc, m) => acc + m.total_macros.kcal, 0)
  const totalCho = plan.meals.reduce((acc, m) => acc + m.total_macros.cho, 0)
  const totalPro = plan.meals.reduce((acc, m) => acc + m.total_macros.pro, 0)
  const totalFat = plan.meals.reduce((acc, m) => acc + m.total_macros.fat, 0)

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Nutrition Plan</h2>
            <p className="text-muted-foreground">
              Active Plan for {selectedDay} ({plan.meta.type})
            </p>
          </div>
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {weekly_biomap.map((d) => (
            <Button
              key={d.meta.day_name}
              variant={selectedDay === d.meta.day_name ? "default" : "outline"}
              onClick={() => setSelectedDay(d.meta.day_name)}
              className="whitespace-nowrap"
            >
              {d.meta.day_name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Target</CardTitle>
            <CardDescription>Total Intake</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMealKcal} kcal</div>
            <p className="text-xs text-muted-foreground">{Math.round(totalMealKcal / athlete.weight_kg)} kcal/kg</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Carbohydrates</CardTitle>
            <CardDescription>Fueling</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{totalCho}g</div>
            <p className="text-xs text-muted-foreground">{Math.round(totalCho / athlete.weight_kg)} g/kg</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Protein</CardTitle>
            <CardDescription>Recovery</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{totalPro}g</div>
            <p className="text-xs text-muted-foreground">{Math.round(totalPro / athlete.weight_kg)} g/kg</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Fats</CardTitle>
            <CardDescription>Health & Hormones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{totalFat}g</div>
            <p className="text-xs text-muted-foreground">{Math.round(totalFat / athlete.weight_kg)} g/kg</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            <CardTitle>Detailed Menu ({plan.meta.fueling_class})</CardTitle>
          </div>
          <CardDescription>
            Constitution Rule 7.1: Intra = {plan.training_load.intra_target_cho}g CHO (
            {plan.training_load.intra_lock_rule})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Meal</TableHead>
                <TableHead className="text-right">Kcal</TableHead>
                <TableHead className="text-right text-blue-600">CHO</TableHead>
                <TableHead className="text-right text-green-600">PRO</TableHead>
                <TableHead className="text-right text-orange-600">FAT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plan.meals.map((meal) => (
                <TableRow key={meal.id} className={meal.type === "intra" ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}>
                  <TableCell className="font-mono text-xs">{meal.time}</TableCell>
                  <TableCell>
                    <div className="font-bold">{meal.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {meal.items.map((i) => `${i.name} (${i.grams}g)`).join(", ")}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold">{meal.total_macros.kcal}</TableCell>
                  <TableCell className="text-right text-blue-600">{meal.total_macros.cho}</TableCell>
                  <TableCell className="text-right text-green-600">{meal.total_macros.pro}</TableCell>
                  <TableCell className="text-right text-orange-600">{meal.total_macros.fat}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold border-t-2">
                <TableCell colSpan={2}>DAILY TOTAL</TableCell>
                <TableCell className="text-right">{totalMealKcal}</TableCell>
                <TableCell className="text-right text-blue-700">{totalCho}</TableCell>
                <TableCell className="text-right text-green-700">{totalPro}</TableCell>
                <TableCell className="text-right text-orange-700">{totalFat}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
