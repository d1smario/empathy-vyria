import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { athleteData } from '../../data/athleteData';
import { Activity, Clock, Scale, Utensils, AlertTriangle, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export const AthleteProfile = () => {
  const { athlete, routine } = athleteData;

  const stats = [
    { label: "Age", value: `${athlete.age} yrs`, icon: Clock },
    { label: "Weight", value: `${athlete.weight_kg} kg`, icon: Scale },
    { label: "Body Fat", value: `${athlete.body_fat_percent}%`, icon: Activity },
    { label: "LBM", value: `${athlete.lbm_kg_est} kg`, icon: Activity },
    { label: "VO2max", value: athlete.vo2max, icon: Heart },
    { label: "FTP", value: `${athlete.ftp_w} W`, icon: Activity },
  ];

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{athlete.name}</h1>
        <p className="text-muted-foreground">Performance Profile & BioMAP Configuration</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <stat.icon className="h-8 w-8 text-primary mb-2 opacity-80" />
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Daily Routine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Wake Up</span>
                    <span className="font-medium">{routine.wake}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Breakfast</span>
                    <span className="font-medium">{routine.breakfast}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Training (Usual)</span>
                    <span className="font-medium">{routine.training_time_usual}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Lunch</span>
                    <span className="font-medium">{routine.lunch}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Dinner</span>
                    <span className="font-medium">{routine.dinner}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Sleep</span>
                    <span className="font-medium">{routine.sleep}</span>
                </div>
            </div>
            {routine.notes.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Notes</span>
                    <ul className="list-disc pl-4 mt-2 text-sm">
                        {routine.notes.map((note, i) => <li key={i}>{note}</li>)}
                    </ul>
                </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Utensils className="h-5 w-5" />
                    Dietary Profile
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" /> Constraints
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                         <div className="bg-red-50 p-2 rounded border border-red-100 dark:bg-red-950/20 dark:border-red-900">
                            <span className="block text-xs text-red-600 dark:text-red-400 font-semibold">Intolerances</span>
                            <span>{athlete.constraints.intolerances.join(", ") || "None"}</span>
                         </div>
                         <div className="bg-orange-50 p-2 rounded border border-orange-100 dark:bg-orange-950/20 dark:border-orange-900">
                            <span className="block text-xs text-orange-600 dark:text-orange-400 font-semibold">Limit</span>
                            <span>{athlete.constraints.limit_foods.join(", ") || "None"}</span>
                         </div>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-semibold mb-2">Preferences</h4>
                     <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="block text-xs text-muted-foreground">Favorite Dish</span>
                            <span className="font-medium capitalize">{athlete.preferences.favorite_dish}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-muted-foreground">Preferred Protein</span>
                            <span className="font-medium capitalize">{athlete.preferences.preferred_protein}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-muted-foreground">Best Carb Source</span>
                            <span className="font-medium capitalize">{athlete.preferences.best_tolerated_carb}</span>
                        </div>
                         <div>
                            <span className="block text-xs text-muted-foreground">Preferred Brands</span>
                            <span className="font-medium text-xs">{athlete.preferences.brands.join(", ")}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};
