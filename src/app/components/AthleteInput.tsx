import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { athleteData, PowerDurationPoint } from '../../data/athleteData';
import { Download, Save, Activity } from 'lucide-react';
import { runEmpathyAnalysis, CalculationInput } from '../../lib/performanceCalculations';

interface InputForm {
  weight: number;
  bodyFat: number;
  ge_actual: number;
  power_curve: PowerDurationPoint[];
}

export const AthleteInput = () => {
  const { register, control, handleSubmit } = useForm<InputForm>({
    defaultValues: {
      weight: athleteData.athlete.weight_kg,
      bodyFat: athleteData.athlete.body_fat_percent,
      ge_actual: 0.23,
      power_curve: athleteData.athlete.power_duration_curve
    }
  });

  const { fields } = useFieldArray({
    control,
    name: "power_curve"
  });

  const onSubmit = (data: InputForm) => {
    const input: CalculationInput = {
      weight_kg: Number(data.weight),
      body_fat_percent: Number(data.bodyFat),
      power_curve: data.power_curve.map(p => ({ ...p, watts: Number(p.watts), duration: Number(p.duration) })),
      ge_actual: Number(data.ge_actual)
    };

    const results = runEmpathyAnalysis(input);
    
    // Update global state (In a real app this would be a Context or Redux dispatch)
    athleteData.metabolic_model = {
        ...athleteData.metabolic_model,
        cp: results.cp,
        w_prime: results.w_prime,
        w_al: results.w_al,
        w_lac: results.w_lac,
        vlamax_model: results.vlamax_model,
        vlamax_class: results.vlamax_class,
        lbm: results.lbm
    };
    athleteData.empathy_zones = results.zones;
    athleteData.athlete.performance_metrics.lt1 = results.lt1;
    athleteData.athlete.performance_metrics.lt2 = results.lt2;
    athleteData.athlete.performance_metrics.fat_max_power = results.fat_max;
    athleteData.athlete.power_duration_curve = input.power_curve;

    alert("Analysis Updated! Check the Analysis and Delivery tabs.");
  };

  return (
    <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-4 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Athlete Stats</CardTitle>
                    <CardDescription>Physiological inputs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Weight (kg)</Label>
                        <Input type="number" step="0.1" {...register("weight")} />
                    </div>
                    <div className="space-y-2">
                        <Label>Body Fat (%)</Label>
                        <Input type="number" step="0.1" {...register("bodyFat")} />
                    </div>
                    <div className="space-y-2">
                        <Label>Gross Efficiency (GE)</Label>
                        <Input type="number" step="0.01" {...register("ge_actual")} />
                        <p className="text-[10px] text-muted-foreground">Default: 0.23</p>
                    </div>
                </CardContent>
            </Card>
            
            <Button className="w-full" size="lg" onClick={handleSubmit(onSubmit)}>
                <Activity className="mr-2 h-4 w-4" /> Run Analysis
            </Button>
        </div>

        <Card className="md:col-span-8">
            <CardHeader>
                <CardTitle>Power-Duration Curve</CardTitle>
                <CardDescription>Enter best efforts to drive the mathematical model</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="space-y-1">
                            <Label className="text-xs text-muted-foreground uppercase">{field.label}</Label>
                            <Input 
                                type="number" 
                                {...register(`power_curve.${index}.watts`)} 
                                className="font-mono"
                            />
                            <input type="hidden" {...register(`power_curve.${index}.duration`)} />
                            <input type="hidden" {...register(`power_curve.${index}.label`)} />
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="bg-muted/50 text-xs text-muted-foreground p-4">
                <p>Required: 5s, 1m, 3-5m, 12-20m for accurate VLaMax & CP modeling.</p>
            </CardFooter>
        </Card>
    </div>
  );
};
