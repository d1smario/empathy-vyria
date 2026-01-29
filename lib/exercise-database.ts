// Unified Exercise Database with consistent categorization
// All exercises have: id, name (IT), muscle_group, equipment, difficulty, image, muscles_activated

export interface Exercise {
  id: string;
  name: string;
  nameEn: string;
  muscleGroup: 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'legs' | 'core' | 'glutes' | 'forearms' | 'calves';
  equipment: 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'kettlebell' | 'resistance_band' | 'smith_machine';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  image: string;
  musclesActivated: {
    primary: string[];
    secondary: string[];
  };
  instructions?: string[];
  tips?: string[];
}

// Gruppi muscolari - allineati con API ExerciseDB (AscendAPI)
// bodyPart validi: back, cardio, chest, lower arms, lower legs, neck, shoulders, upper arms, upper legs, waist
export const MUSCLE_GROUPS = [
  { id: 'chest', name: 'Chest', color: '#ef4444' },
  { id: 'back', name: 'Back', color: '#3b82f6' },
  { id: 'shoulders', name: 'Shoulders', color: '#f97316' },
  { id: 'upper arms', name: 'Upper Arms', color: '#22c55e' },
  { id: 'upper legs', name: 'Upper Legs', color: '#06b6d4' },
  { id: 'waist', name: 'Waist / Core', color: '#eab308' },
  { id: 'lower legs', name: 'Lower Legs', color: '#8b5cf6' },
  { id: 'lower arms', name: 'Lower Arms', color: '#ec4899' },
  { id: 'cardio', name: 'Cardio', color: '#14b8a6' },
  { id: 'neck', name: 'Neck', color: '#6366f1' },
] as const;

export const EQUIPMENT_TYPES = [
  { id: 'barbell', name: 'Bilanciere' },
  { id: 'dumbbell', name: 'Manubri' },
  { id: 'cable', name: 'Cavi' },
  { id: 'machine', name: 'Macchina' },
  { id: 'bodyweight', name: 'Corpo Libero' },
  { id: 'kettlebell', name: 'Kettlebell' },
  { id: 'resistance_band', name: 'Elastici' },
  { id: 'smith_machine', name: 'Multipower' },
] as const;

export const EXERCISE_DATABASE: Exercise[] = [
  // ============== PETTO (CHEST) ==============
  {
    id: 'chest-bench-press-barbell',
    name: 'Panca Piana Bilanciere',
    nameEn: 'Barbell Bench Press',
    muscleGroup: 'chest',
    equipment: 'barbell',
    difficulty: 'intermediate',
    image: '/exercises/chest-bench-press.jpg',
    musclesActivated: {
      primary: ['Grande Pettorale'],
      secondary: ['Deltoide Anteriore', 'Tricipiti']
    },
    instructions: ['Sdraiati sulla panca con i piedi a terra', 'Impugna il bilanciere con presa leggermente piu larga delle spalle', 'Abbassa il bilanciere al petto controllando il movimento', 'Spingi verso l\'alto fino a estensione completa'],
    tips: ['Mantieni le scapole addotte', 'Non rimbalzare sul petto']
  },
  {
    id: 'chest-bench-press-dumbbell',
    name: 'Panca Piana Manubri',
    nameEn: 'Dumbbell Bench Press',
    muscleGroup: 'chest',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    image: '/exercises/chest-dumbbell-press.jpg',
    musclesActivated: {
      primary: ['Grande Pettorale'],
      secondary: ['Deltoide Anteriore', 'Tricipiti']
    }
  },
  {
    id: 'chest-incline-press-barbell',
    name: 'Panca Inclinata Bilanciere',
    nameEn: 'Incline Barbell Press',
    muscleGroup: 'chest',
    equipment: 'barbell',
    difficulty: 'intermediate',
    image: '/exercises/chest-incline-press.jpg',
    musclesActivated: {
      primary: ['Pettorale Alto', 'Grande Pettorale'],
      secondary: ['Deltoide Anteriore', 'Tricipiti']
    }
  },
  {
    id: 'chest-incline-press-dumbbell',
    name: 'Panca Inclinata Manubri',
    nameEn: 'Incline Dumbbell Press',
    muscleGroup: 'chest',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    image: '/exercises/chest-incline-dumbbell.jpg',
    musclesActivated: {
      primary: ['Pettorale Alto'],
      secondary: ['Deltoide Anteriore', 'Tricipiti']
    }
  },
  {
    id: 'chest-decline-press',
    name: 'Panca Declinata',
    nameEn: 'Decline Bench Press',
    muscleGroup: 'chest',
    equipment: 'barbell',
    difficulty: 'intermediate',
    image: '/exercises/chest-decline-press.jpg',
    musclesActivated: {
      primary: ['Pettorale Basso', 'Grande Pettorale'],
      secondary: ['Tricipiti']
    }
  },
  {
    id: 'chest-fly-dumbbell',
    name: 'Croci Manubri',
    nameEn: 'Dumbbell Fly',
    muscleGroup: 'chest',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    image: '/exercises/chest-fly-dumbbell.jpg',
    musclesActivated: {
      primary: ['Grande Pettorale'],
      secondary: ['Deltoide Anteriore']
    }
  },
  {
    id: 'chest-fly-cable',
    name: 'Croci ai Cavi',
    nameEn: 'Cable Fly',
    muscleGroup: 'chest',
    equipment: 'cable',
    difficulty: 'beginner',
    image: '/exercises/chest-fly-cable.jpg',
    musclesActivated: {
      primary: ['Grande Pettorale'],
      secondary: ['Deltoide Anteriore']
    }
  },
  {
    id: 'chest-pushup',
    name: 'Piegamenti (Push-up)',
    nameEn: 'Push-up',
    muscleGroup: 'chest',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    image: '/exercises/chest-pushup.jpg',
    musclesActivated: {
      primary: ['Grande Pettorale'],
      secondary: ['Deltoide Anteriore', 'Tricipiti', 'Core']
    }
  },
  {
    id: 'chest-dip',
    name: 'Dip alle Parallele',
    nameEn: 'Chest Dip',
    muscleGroup: 'chest',
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    image: '/exercises/chest-dip.jpg',
    musclesActivated: {
      primary: ['Grande Pettorale', 'Pettorale Basso'],
      secondary: ['Tricipiti', 'Deltoide Anteriore']
    }
  },
  {
    id: 'chest-pec-deck',
    name: 'Pec Deck (Pectoral Machine)',
    nameEn: 'Pec Deck Machine',
    muscleGroup: 'chest',
    equipment: 'machine',
    difficulty: 'beginner',
    image: '/exercises/chest-pec-deck.jpg',
    musclesActivated: {
      primary: ['Grande Pettorale'],
      secondary: []
    }
  },

  // ============== SCHIENA (BACK) ==============
  {
    id: 'back-lat-pulldown',
    name: 'Lat Machine',
    nameEn: 'Lat Pulldown',
    muscleGroup: 'back',
    equipment: 'cable',
    difficulty: 'beginner',
    image: '/exercises/back-lat-pulldown.jpg',
    musclesActivated: {
      primary: ['Gran Dorsale'],
      secondary: ['Bicipiti', 'Romboidi', 'Trapezio']
    }
  },
  {
    id: 'back-row-barbell',
    name: 'Rematore Bilanciere',
    nameEn: 'Barbell Row',
    muscleGroup: 'back',
    equipment: 'barbell',
    difficulty: 'intermediate',
    image: '/exercises/back-row-barbell.jpg',
    musclesActivated: {
      primary: ['Gran Dorsale', 'Romboidi'],
      secondary: ['Bicipiti', 'Trapezio', 'Erettori Spinali']
    }
  },
  {
    id: 'back-row-dumbbell',
    name: 'Rematore Manubrio',
    nameEn: 'Dumbbell Row',
    muscleGroup: 'back',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    image: '/exercises/back-row-dumbbell.jpg',
    musclesActivated: {
      primary: ['Gran Dorsale'],
      secondary: ['Bicipiti', 'Romboidi']
    }
  },
  {
    id: 'back-pullup',
    name: 'Trazioni alla Sbarra',
    nameEn: 'Pull-up',
    muscleGroup: 'back',
    equipment: 'bodyweight',
    difficulty: 'advanced',
    image: '/exercises/back-pullup.jpg',
    musclesActivated: {
      primary: ['Gran Dorsale'],
      secondary: ['Bicipiti', 'Romboidi', 'Core']
    }
  },
  {
    id: 'back-seated-row',
    name: 'Pulley Basso',
    nameEn: 'Seated Cable Row',
    muscleGroup: 'back',
    equipment: 'cable',
    difficulty: 'beginner',
    image: '/exercises/back-seated-row.jpg',
    musclesActivated: {
      primary: ['Gran Dorsale', 'Romboidi'],
      secondary: ['Bicipiti', 'Trapezio']
    }
  },
  {
    id: 'back-deadlift',
    name: 'Stacco da Terra',
    nameEn: 'Deadlift',
    muscleGroup: 'back',
    equipment: 'barbell',
    difficulty: 'advanced',
    image: '/exercises/back-deadlift.jpg',
    musclesActivated: {
      primary: ['Erettori Spinali', 'Gran Dorsale'],
      secondary: ['Glutei', 'Quadricipiti', 'Trapezio', 'Avambracci']
    }
  },
  {
    id: 'back-tbar-row',
    name: 'T-Bar Row',
    nameEn: 'T-Bar Row',
    muscleGroup: 'back',
    equipment: 'barbell',
    difficulty: 'intermediate',
    image: '/exercises/back-tbar-row.jpg',
    musclesActivated: {
      primary: ['Gran Dorsale', 'Romboidi'],
      secondary: ['Bicipiti', 'Trapezio']
    }
  },
  {
    id: 'back-face-pull',
    name: 'Face Pull',
    nameEn: 'Face Pull',
    muscleGroup: 'back',
    equipment: 'cable',
    difficulty: 'beginner',
    image: '/exercises/back-face-pull.jpg',
    musclesActivated: {
      primary: ['Deltoide Posteriore', 'Trapezio'],
      secondary: ['Romboidi', 'Cuffia dei Rotatori']
    }
  },
  {
    id: 'back-hyperextension',
    name: 'Hyperextension',
    nameEn: 'Back Extension',
    muscleGroup: 'back',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    image: '/exercises/back-hyperextension.jpg',
    musclesActivated: {
      primary: ['Erettori Spinali'],
      secondary: ['Glutei', 'Bicipiti Femorali']
    }
  },
  {
    id: 'back-shrug',
    name: 'Scrollate (Shrugs)',
    nameEn: 'Barbell Shrug',
    muscleGroup: 'back',
    equipment: 'barbell',
    difficulty: 'beginner',
    image: '/exercises/back-shrug.jpg',
    musclesActivated: {
      primary: ['Trapezio'],
      secondary: []
    }
  },

  // ============== SPALLE (SHOULDERS) ==============
  {
    id: 'shoulders-press-barbell',
    name: 'Military Press',
    nameEn: 'Overhead Barbell Press',
    muscleGroup: 'shoulders',
    equipment: 'barbell',
    difficulty: 'intermediate',
    image: '/exercises/shoulders-military-press.jpg',
    musclesActivated: {
      primary: ['Deltoide Anteriore', 'Deltoide Laterale'],
      secondary: ['Tricipiti', 'Trapezio']
    }
  },
  {
    id: 'shoulders-press-dumbbell',
    name: 'Shoulder Press Manubri',
    nameEn: 'Dumbbell Shoulder Press',
    muscleGroup: 'shoulders',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    image: '/exercises/shoulders-dumbbell-press.jpg',
    musclesActivated: {
      primary: ['Deltoide Anteriore', 'Deltoide Laterale'],
      secondary: ['Tricipiti']
    }
  },
  {
    id: 'shoulders-lateral-raise',
    name: 'Alzate Laterali',
    nameEn: 'Lateral Raise',
    muscleGroup: 'shoulders',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    image: '/exercises/shoulders-lateral-raise.jpg',
    musclesActivated: {
      primary: ['Deltoide Laterale'],
      secondary: ['Trapezio']
    }
  },
  {
    id: 'shoulders-front-raise',
    name: 'Alzate Frontali',
    nameEn: 'Front Raise',
    muscleGroup: 'shoulders',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    image: '/exercises/shoulders-front-raise.jpg',
    musclesActivated: {
      primary: ['Deltoide Anteriore'],
      secondary: ['Pettorale Alto']
    }
  },
  {
    id: 'shoulders-rear-delt-fly',
    name: 'Alzate Posteriori',
    nameEn: 'Rear Delt Fly',
    muscleGroup: 'shoulders',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    image: '/exercises/shoulders-rear-delt.jpg',
    musclesActivated: {
      primary: ['Deltoide Posteriore'],
      secondary: ['Romboidi', 'Trapezio']
    }
  },
  {
    id: 'shoulders-arnold-press',
    name: 'Arnold Press',
    nameEn: 'Arnold Press',
    muscleGroup: 'shoulders',
    equipment: 'dumbbell',
    difficulty: 'intermediate',
    image: '/exercises/shoulders-arnold-press.jpg',
    musclesActivated: {
      primary: ['Deltoide Anteriore', 'Deltoide Laterale'],
      secondary: ['Tricipiti']
    }
  },
  {
    id: 'shoulders-upright-row',
    name: 'Tirate al Mento',
    nameEn: 'Upright Row',
    muscleGroup: 'shoulders',
    equipment: 'barbell',
    difficulty: 'intermediate',
    image: '/exercises/shoulders-upright-row.jpg',
    musclesActivated: {
      primary: ['Deltoide Laterale', 'Trapezio'],
      secondary: ['Bicipiti']
    }
  },
  {
    id: 'shoulders-cable-lateral',
    name: 'Alzate Laterali ai Cavi',
    nameEn: 'Cable Lateral Raise',
    muscleGroup: 'shoulders',
    equipment: 'cable',
    difficulty: 'beginner',
    image: '/exercises/shoulders-cable-lateral.jpg',
    musclesActivated: {
      primary: ['Deltoide Laterale'],
      secondary: []
    }
  },

  // ============== BICIPITI (BICEPS) ==============
  {
    id: 'biceps-curl-barbell',
    name: 'Curl Bilanciere',
    nameEn: 'Barbell Curl',
    muscleGroup: 'biceps',
    equipment: 'barbell',
    difficulty: 'beginner',
    image: '/exercises/biceps-curl-barbell.jpg',
    musclesActivated: {
      primary: ['Bicipite Brachiale'],
      secondary: ['Brachiale', 'Brachioradiale']
    }
  },
  {
    id: 'biceps-curl-dumbbell',
    name: 'Curl Manubri',
    nameEn: 'Dumbbell Curl',
    muscleGroup: 'biceps',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    image: '/exercises/biceps-curl-dumbbell.jpg',
    musclesActivated: {
      primary: ['Bicipite Brachiale'],
      secondary: ['Brachiale']
    }
  },
  {
    id: 'biceps-hammer-curl',
    name: 'Hammer Curl',
    nameEn: 'Hammer Curl',
    muscleGroup: 'biceps',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    image: '/exercises/biceps-hammer-curl.jpg',
    musclesActivated: {
      primary: ['Brachiale', 'Brachioradiale'],
      secondary: ['Bicipite Brachiale']
    }
  },
  {
    id: 'biceps-preacher-curl',
    name: 'Curl alla Panca Scott',
    nameEn: 'Preacher Curl',
    muscleGroup: 'biceps',
    equipment: 'barbell',
    difficulty: 'beginner',
    image: '/exercises/biceps-preacher-curl.jpg',
    musclesActivated: {
      primary: ['Bicipite Brachiale'],
      secondary: ['Brachiale']
    }
  },
  {
    id: 'biceps-incline-curl',
    name: 'Curl Inclinato',
    nameEn: 'Incline Dumbbell Curl',
    muscleGroup: 'biceps',
    equipment: 'dumbbell',
    difficulty: 'intermediate',
    image: '/exercises/biceps-incline-curl.jpg',
    musclesActivated: {
      primary: ['Bicipite Brachiale (capo lungo)'],
      secondary: ['Brachiale']
    }
  },
  {
    id: 'biceps-concentration-curl',
    name: 'Curl Concentrato',
    nameEn: 'Concentration Curl',
    muscleGroup: 'biceps',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    image: '/exercises/biceps-concentration-curl.jpg',
    musclesActivated: {
      primary: ['Bicipite Brachiale'],
      secondary: []
    }
  },
  {
    id: 'biceps-cable-curl',
    name: 'Curl ai Cavi',
    nameEn: 'Cable Curl',
    muscleGroup: 'biceps',
    equipment: 'cable',
    difficulty: 'beginner',
    image: '/exercises/biceps-cable-curl.jpg',
    musclesActivated: {
      primary: ['Bicipite Brachiale'],
      secondary: ['Brachiale']
    }
  },

  // ============== TRICIPITI (TRICEPS) ==============
  {
    id: 'triceps-pushdown',
    name: 'Push Down ai Cavi',
    nameEn: 'Tricep Pushdown',
    muscleGroup: 'triceps',
    equipment: 'cable',
    difficulty: 'beginner',
    image: '/exercises/triceps-pushdown.jpg',
    musclesActivated: {
      primary: ['Tricipite Brachiale'],
      secondary: []
    }
  },
  {
    id: 'triceps-dip',
    name: 'Dip per Tricipiti',
    nameEn: 'Tricep Dip',
    muscleGroup: 'triceps',
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    image: '/exercises/triceps-dip.jpg',
    musclesActivated: {
      primary: ['Tricipite Brachiale'],
      secondary: ['Pettorale', 'Deltoide Anteriore']
    }
  },
  {
    id: 'triceps-overhead-extension',
    name: 'French Press',
    nameEn: 'Overhead Tricep Extension',
    muscleGroup: 'triceps',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    image: '/exercises/triceps-french-press.jpg',
    musclesActivated: {
      primary: ['Tricipite Brachiale (capo lungo)'],
      secondary: []
    }
  },
  {
    id: 'triceps-skullcrusher',
    name: 'Skull Crusher',
    nameEn: 'Skull Crusher',
    muscleGroup: 'triceps',
    equipment: 'barbell',
    difficulty: 'intermediate',
    image: '/exercises/triceps-skullcrusher.jpg',
    musclesActivated: {
      primary: ['Tricipite Brachiale'],
      secondary: []
    }
  },
  {
    id: 'triceps-kickback',
    name: 'Kickback',
    nameEn: 'Tricep Kickback',
    muscleGroup: 'triceps',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    image: '/exercises/triceps-kickback.jpg',
    musclesActivated: {
      primary: ['Tricipite Brachiale'],
      secondary: []
    }
  },
  {
    id: 'triceps-close-grip-bench',
    name: 'Panca Presa Stretta',
    nameEn: 'Close Grip Bench Press',
    muscleGroup: 'triceps',
    equipment: 'barbell',
    difficulty: 'intermediate',
    image: '/exercises/triceps-close-grip.jpg',
    musclesActivated: {
      primary: ['Tricipite Brachiale'],
      secondary: ['Pettorale', 'Deltoide Anteriore']
    }
  },
  {
    id: 'triceps-rope-pushdown',
    name: 'Push Down con Corda',
    nameEn: 'Rope Pushdown',
    muscleGroup: 'triceps',
    equipment: 'cable',
    difficulty: 'beginner',
    image: '/exercises/triceps-rope-pushdown.jpg',
    musclesActivated: {
      primary: ['Tricipite Brachiale'],
      secondary: []
    }
  },

  // ============== GAMBE (LEGS) ==============
  {
    id: 'legs-squat-barbell',
    name: 'Squat Bilanciere',
    nameEn: 'Barbell Back Squat',
    muscleGroup: 'legs',
    equipment: 'barbell',
    difficulty: 'intermediate',
    image: '/exercises/legs-squat.jpg',
    musclesActivated: {
      primary: ['Quadricipiti', 'Glutei'],
      secondary: ['Bicipiti Femorali', 'Core', 'Erettori Spinali']
    }
  },
  {
    id: 'legs-front-squat',
    name: 'Front Squat',
    nameEn: 'Front Squat',
    muscleGroup: 'legs',
    equipment: 'barbell',
    difficulty: 'advanced',
    image: '/exercises/legs-front-squat.jpg',
    musclesActivated: {
      primary: ['Quadricipiti'],
      secondary: ['Glutei', 'Core']
    }
  },
  {
    id: 'legs-leg-press',
    name: 'Leg Press',
    nameEn: 'Leg Press',
    muscleGroup: 'legs',
    equipment: 'machine',
    difficulty: 'beginner',
    image: '/exercises/legs-leg-press.jpg',
    musclesActivated: {
      primary: ['Quadricipiti', 'Glutei'],
      secondary: ['Bicipiti Femorali']
    }
  },
  {
    id: 'legs-lunge',
    name: 'Affondi',
    nameEn: 'Lunges',
    muscleGroup: 'legs',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    image: '/exercises/legs-lunge.jpg',
    musclesActivated: {
      primary: ['Quadricipiti', 'Glutei'],
      secondary: ['Bicipiti Femorali', 'Core']
    }
  },
  {
    id: 'legs-leg-extension',
    name: 'Leg Extension',
    nameEn: 'Leg Extension',
    muscleGroup: 'legs',
    equipment: 'machine',
    difficulty: 'beginner',
    image: '/exercises/legs-leg-extension.jpg',
    musclesActivated: {
      primary: ['Quadricipiti'],
      secondary: []
    }
  },
  {
    id: 'legs-leg-curl',
    name: 'Leg Curl',
    nameEn: 'Leg Curl',
    muscleGroup: 'legs',
    equipment: 'machine',
    difficulty: 'beginner',
    image: '/exercises/legs-leg-curl.jpg',
    musclesActivated: {
      primary: ['Bicipiti Femorali'],
      secondary: ['Polpacci']
    }
  },
  {
    id: 'legs-romanian-deadlift',
    name: 'Stacco Rumeno',
    nameEn: 'Romanian Deadlift',
    muscleGroup: 'legs',
    equipment: 'barbell',
    difficulty: 'intermediate',
    image: '/exercises/legs-romanian-deadlift.jpg',
    musclesActivated: {
      primary: ['Bicipiti Femorali', 'Glutei'],
      secondary: ['Erettori Spinali']
    }
  },
  {
    id: 'legs-hack-squat',
    name: 'Hack Squat',
    nameEn: 'Hack Squat',
    muscleGroup: 'legs',
    equipment: 'machine',
    difficulty: 'intermediate',
    image: '/exercises/legs-hack-squat.jpg',
    musclesActivated: {
      primary: ['Quadricipiti'],
      secondary: ['Glutei']
    }
  },
  {
    id: 'legs-bulgarian-split',
    name: 'Bulgarian Split Squat',
    nameEn: 'Bulgarian Split Squat',
    muscleGroup: 'legs',
    equipment: 'dumbbell',
    difficulty: 'intermediate',
    image: '/exercises/legs-bulgarian-split.jpg',
    musclesActivated: {
      primary: ['Quadricipiti', 'Glutei'],
      secondary: ['Bicipiti Femorali', 'Core']
    }
  },
  {
    id: 'legs-goblet-squat',
    name: 'Goblet Squat',
    nameEn: 'Goblet Squat',
    muscleGroup: 'legs',
    equipment: 'kettlebell',
    difficulty: 'beginner',
    image: '/exercises/legs-goblet-squat.jpg',
    musclesActivated: {
      primary: ['Quadricipiti', 'Glutei'],
      secondary: ['Core']
    }
  },

  // ============== GLUTEI (GLUTES) ==============
  {
    id: 'glutes-hip-thrust',
    name: 'Hip Thrust',
    nameEn: 'Barbell Hip Thrust',
    muscleGroup: 'glutes',
    equipment: 'barbell',
    difficulty: 'intermediate',
    image: '/exercises/glutes-hip-thrust.jpg',
    musclesActivated: {
      primary: ['Grande Gluteo'],
      secondary: ['Bicipiti Femorali', 'Core']
    }
  },
  {
    id: 'glutes-glute-bridge',
    name: 'Glute Bridge',
    nameEn: 'Glute Bridge',
    muscleGroup: 'glutes',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    image: '/exercises/glutes-bridge.jpg',
    musclesActivated: {
      primary: ['Grande Gluteo'],
      secondary: ['Bicipiti Femorali']
    }
  },
  {
    id: 'glutes-cable-kickback',
    name: 'Kickback ai Cavi',
    nameEn: 'Cable Glute Kickback',
    muscleGroup: 'glutes',
    equipment: 'cable',
    difficulty: 'beginner',
    image: '/exercises/glutes-cable-kickback.jpg',
    musclesActivated: {
      primary: ['Grande Gluteo'],
      secondary: ['Bicipiti Femorali']
    }
  },
  {
    id: 'glutes-sumo-deadlift',
    name: 'Stacco Sumo',
    nameEn: 'Sumo Deadlift',
    muscleGroup: 'glutes',
    equipment: 'barbell',
    difficulty: 'intermediate',
    image: '/exercises/glutes-sumo-deadlift.jpg',
    musclesActivated: {
      primary: ['Glutei', 'Adduttori'],
      secondary: ['Quadricipiti', 'Erettori Spinali']
    }
  },
  {
    id: 'glutes-abduction-machine',
    name: 'Abductor Machine',
    nameEn: 'Hip Abduction Machine',
    muscleGroup: 'glutes',
    equipment: 'machine',
    difficulty: 'beginner',
    image: '/exercises/glutes-abduction.jpg',
    musclesActivated: {
      primary: ['Medio Gluteo', 'Piccolo Gluteo'],
      secondary: []
    }
  },
  {
    id: 'glutes-step-up',
    name: 'Step Up',
    nameEn: 'Step Up',
    muscleGroup: 'glutes',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    image: '/exercises/glutes-step-up.jpg',
    musclesActivated: {
      primary: ['Grande Gluteo', 'Quadricipiti'],
      secondary: ['Bicipiti Femorali']
    }
  },

  // ============== CORE ==============
  {
    id: 'core-plank',
    name: 'Plank',
    nameEn: 'Plank',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    image: '/exercises/core-plank.jpg',
    musclesActivated: {
      primary: ['Retto Addominale', 'Trasverso'],
      secondary: ['Obliqui', 'Erettori Spinali']
    }
  },
  {
    id: 'core-crunch',
    name: 'Crunch',
    nameEn: 'Crunch',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    image: '/exercises/core-crunch.jpg',
    musclesActivated: {
      primary: ['Retto Addominale'],
      secondary: ['Obliqui']
    }
  },
  {
    id: 'core-leg-raise',
    name: 'Leg Raise',
    nameEn: 'Hanging Leg Raise',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    image: '/exercises/core-leg-raise.jpg',
    musclesActivated: {
      primary: ['Retto Addominale (parte bassa)'],
      secondary: ['Flessori dell\'Anca']
    }
  },
  {
    id: 'core-russian-twist',
    name: 'Russian Twist',
    nameEn: 'Russian Twist',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    image: '/exercises/core-russian-twist.jpg',
    musclesActivated: {
      primary: ['Obliqui'],
      secondary: ['Retto Addominale']
    }
  },
  {
    id: 'core-cable-crunch',
    name: 'Crunch ai Cavi',
    nameEn: 'Cable Crunch',
    muscleGroup: 'core',
    equipment: 'cable',
    difficulty: 'beginner',
    image: '/exercises/core-cable-crunch.jpg',
    musclesActivated: {
      primary: ['Retto Addominale'],
      secondary: []
    }
  },
  {
    id: 'core-ab-wheel',
    name: 'Ab Wheel Rollout',
    nameEn: 'Ab Wheel Rollout',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    difficulty: 'advanced',
    image: '/exercises/core-ab-wheel.jpg',
    musclesActivated: {
      primary: ['Retto Addominale'],
      secondary: ['Obliqui', 'Gran Dorsale', 'Tricipiti']
    }
  },
  {
    id: 'core-mountain-climber',
    name: 'Mountain Climber',
    nameEn: 'Mountain Climber',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    image: '/exercises/core-mountain-climber.jpg',
    musclesActivated: {
      primary: ['Retto Addominale', 'Flessori dell\'Anca'],
      secondary: ['Spalle', 'Quadricipiti']
    }
  },
  {
    id: 'core-dead-bug',
    name: 'Dead Bug',
    nameEn: 'Dead Bug',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    image: '/exercises/core-dead-bug.jpg',
    musclesActivated: {
      primary: ['Trasverso', 'Retto Addominale'],
      secondary: []
    }
  },

  // ============== POLPACCI (CALVES) ==============
  {
    id: 'calves-standing-raise',
    name: 'Calf Raise in Piedi',
    nameEn: 'Standing Calf Raise',
    muscleGroup: 'calves',
    equipment: 'machine',
    difficulty: 'beginner',
    image: '/exercises/calves-standing-raise.jpg',
    musclesActivated: {
      primary: ['Gastrocnemio'],
      secondary: ['Soleo']
    }
  },
  {
    id: 'calves-seated-raise',
    name: 'Calf Raise Seduto',
    nameEn: 'Seated Calf Raise',
    muscleGroup: 'calves',
    equipment: 'machine',
    difficulty: 'beginner',
    image: '/exercises/calves-seated-raise.jpg',
    musclesActivated: {
      primary: ['Soleo'],
      secondary: ['Gastrocnemio']
    }
  },
  {
    id: 'calves-donkey-raise',
    name: 'Donkey Calf Raise',
    nameEn: 'Donkey Calf Raise',
    muscleGroup: 'calves',
    equipment: 'machine',
    difficulty: 'intermediate',
    image: '/exercises/calves-donkey-raise.jpg',
    musclesActivated: {
      primary: ['Gastrocnemio'],
      secondary: ['Soleo']
    }
  },

  // ============== AVAMBRACCI (FOREARMS) ==============
  {
    id: 'forearms-wrist-curl',
    name: 'Wrist Curl',
    nameEn: 'Wrist Curl',
    muscleGroup: 'forearms',
    equipment: 'barbell',
    difficulty: 'beginner',
    image: '/exercises/forearms-wrist-curl.jpg',
    musclesActivated: {
      primary: ['Flessori dell\'Avambraccio'],
      secondary: []
    }
  },
  {
    id: 'forearms-reverse-curl',
    name: 'Reverse Curl',
    nameEn: 'Reverse Curl',
    muscleGroup: 'forearms',
    equipment: 'barbell',
    difficulty: 'beginner',
    image: '/exercises/forearms-reverse-curl.jpg',
    musclesActivated: {
      primary: ['Brachioradiale', 'Estensori dell\'Avambraccio'],
      secondary: ['Bicipiti']
    }
  },
  {
    id: 'forearms-farmer-walk',
    name: 'Farmer Walk',
    nameEn: 'Farmer Walk',
    muscleGroup: 'forearms',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    image: '/exercises/forearms-farmer-walk.jpg',
    musclesActivated: {
      primary: ['Avambracci', 'Trapezio'],
      secondary: ['Core', 'Spalle']
    }
  },
];

// Helper functions
export function getExercisesByMuscleGroup(muscleGroup: string): Exercise[] {
  return EXERCISE_DATABASE.filter(e => e.muscleGroup === muscleGroup);
}

export function getExercisesByEquipment(equipment: string): Exercise[] {
  return EXERCISE_DATABASE.filter(e => e.equipment === equipment);
}

export function getExercisesByDifficulty(difficulty: string): Exercise[] {
  return EXERCISE_DATABASE.filter(e => e.difficulty === difficulty);
}

export function searchExercises(query: string): Exercise[] {
  const q = query.toLowerCase();
  return EXERCISE_DATABASE.filter(e => 
    e.name.toLowerCase().includes(q) || 
    e.nameEn.toLowerCase().includes(q) ||
    e.musclesActivated.primary.some(m => m.toLowerCase().includes(q)) ||
    e.musclesActivated.secondary.some(m => m.toLowerCase().includes(q))
  );
}

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISE_DATABASE.find(e => e.id === id);
}

export function getMuscleGroupColor(muscleGroup: string): string {
  return MUSCLE_GROUPS.find(m => m.id === muscleGroup)?.color || '#6b7280';
}

export function getMuscleGroupName(muscleGroup: string): string {
  return MUSCLE_GROUPS.find(m => m.id === muscleGroup)?.name || muscleGroup;
}
