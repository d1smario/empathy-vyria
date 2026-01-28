import { NextResponse } from 'next/server';

const RAPIDAPI_KEY = process.env.RAPID_API_KEY;
// AscendAPI "Exercise DB with Videos and Images"
const RAPIDAPI_HOST = 'exercise-db-with-videos-and-images-by-ascendapi.p.rapidapi.com';

// FALLBACK LOCAL EXERCISES - Used when API key is not available
const LOCAL_EXERCISES: Record<string, any[]> = {
  'chest': [
    { id: 'chest-1', name: 'Bench Press', bodyPart: 'chest', target: 'pectorals', equipment: 'barbell' },
    { id: 'chest-2', name: 'Incline Dumbbell Press', bodyPart: 'chest', target: 'upper pectorals', equipment: 'dumbbell' },
    { id: 'chest-3', name: 'Chest Fly', bodyPart: 'chest', target: 'pectorals', equipment: 'dumbbell' },
    { id: 'chest-4', name: 'Push-Up', bodyPart: 'chest', target: 'pectorals', equipment: 'body weight' },
    { id: 'chest-5', name: 'Cable Crossover', bodyPart: 'chest', target: 'pectorals', equipment: 'cable' },
    { id: 'chest-6', name: 'Decline Bench Press', bodyPart: 'chest', target: 'lower pectorals', equipment: 'barbell' },
    { id: 'chest-7', name: 'Dips', bodyPart: 'chest', target: 'pectorals', equipment: 'body weight' },
    { id: 'chest-8', name: 'Machine Chest Press', bodyPart: 'chest', target: 'pectorals', equipment: 'machine' },
  ],
  'back': [
    { id: 'back-1', name: 'Lat Pulldown', bodyPart: 'back', target: 'lats', equipment: 'cable' },
    { id: 'back-2', name: 'Barbell Row', bodyPart: 'back', target: 'lats', equipment: 'barbell' },
    { id: 'back-3', name: 'Pull-Up', bodyPart: 'back', target: 'lats', equipment: 'body weight' },
    { id: 'back-4', name: 'Seated Cable Row', bodyPart: 'back', target: 'middle back', equipment: 'cable' },
    { id: 'back-5', name: 'Dumbbell Row', bodyPart: 'back', target: 'lats', equipment: 'dumbbell' },
    { id: 'back-6', name: 'T-Bar Row', bodyPart: 'back', target: 'middle back', equipment: 'barbell' },
    { id: 'back-7', name: 'Face Pull', bodyPart: 'back', target: 'rear delts', equipment: 'cable' },
    { id: 'back-8', name: 'Deadlift', bodyPart: 'back', target: 'lower back', equipment: 'barbell' },
  ],
  'shoulders': [
    { id: 'shoulders-1', name: 'Overhead Press', bodyPart: 'shoulders', target: 'deltoids', equipment: 'barbell' },
    { id: 'shoulders-2', name: 'Lateral Raise', bodyPart: 'shoulders', target: 'lateral deltoid', equipment: 'dumbbell' },
    { id: 'shoulders-3', name: 'Front Raise', bodyPart: 'shoulders', target: 'anterior deltoid', equipment: 'dumbbell' },
    { id: 'shoulders-4', name: 'Rear Delt Fly', bodyPart: 'shoulders', target: 'posterior deltoid', equipment: 'dumbbell' },
    { id: 'shoulders-5', name: 'Arnold Press', bodyPart: 'shoulders', target: 'deltoids', equipment: 'dumbbell' },
    { id: 'shoulders-6', name: 'Upright Row', bodyPart: 'shoulders', target: 'deltoids', equipment: 'barbell' },
    { id: 'shoulders-7', name: 'Shrugs', bodyPart: 'shoulders', target: 'trapezius', equipment: 'dumbbell' },
    { id: 'shoulders-8', name: 'Machine Shoulder Press', bodyPart: 'shoulders', target: 'deltoids', equipment: 'machine' },
  ],
  'upper arms': [
    { id: 'arms-1', name: 'Barbell Curl', bodyPart: 'upper arms', target: 'biceps', equipment: 'barbell' },
    { id: 'arms-2', name: 'Tricep Pushdown', bodyPart: 'upper arms', target: 'triceps', equipment: 'cable' },
    { id: 'arms-3', name: 'Hammer Curl', bodyPart: 'upper arms', target: 'biceps', equipment: 'dumbbell' },
    { id: 'arms-4', name: 'Skull Crusher', bodyPart: 'upper arms', target: 'triceps', equipment: 'ez barbell' },
    { id: 'arms-5', name: 'Preacher Curl', bodyPart: 'upper arms', target: 'biceps', equipment: 'ez barbell' },
    { id: 'arms-6', name: 'Tricep Dips', bodyPart: 'upper arms', target: 'triceps', equipment: 'body weight' },
    { id: 'arms-7', name: 'Concentration Curl', bodyPart: 'upper arms', target: 'biceps', equipment: 'dumbbell' },
    { id: 'arms-8', name: 'Overhead Tricep Extension', bodyPart: 'upper arms', target: 'triceps', equipment: 'dumbbell' },
  ],
  'upper legs': [
    { id: 'legs-1', name: 'Squat', bodyPart: 'upper legs', target: 'quadriceps', equipment: 'barbell' },
    { id: 'legs-2', name: 'Leg Press', bodyPart: 'upper legs', target: 'quadriceps', equipment: 'machine' },
    { id: 'legs-3', name: 'Romanian Deadlift', bodyPart: 'upper legs', target: 'hamstrings', equipment: 'barbell' },
    { id: 'legs-4', name: 'Leg Curl', bodyPart: 'upper legs', target: 'hamstrings', equipment: 'machine' },
    { id: 'legs-5', name: 'Leg Extension', bodyPart: 'upper legs', target: 'quadriceps', equipment: 'machine' },
    { id: 'legs-6', name: 'Lunges', bodyPart: 'upper legs', target: 'quadriceps', equipment: 'dumbbell' },
    { id: 'legs-7', name: 'Hip Thrust', bodyPart: 'upper legs', target: 'glutes', equipment: 'barbell' },
    { id: 'legs-8', name: 'Bulgarian Split Squat', bodyPart: 'upper legs', target: 'quadriceps', equipment: 'dumbbell' },
  ],
  'lower legs': [
    { id: 'calves-1', name: 'Standing Calf Raise', bodyPart: 'lower legs', target: 'calves', equipment: 'machine' },
    { id: 'calves-2', name: 'Seated Calf Raise', bodyPart: 'lower legs', target: 'calves', equipment: 'machine' },
    { id: 'calves-3', name: 'Donkey Calf Raise', bodyPart: 'lower legs', target: 'calves', equipment: 'body weight' },
    { id: 'calves-4', name: 'Single Leg Calf Raise', bodyPart: 'lower legs', target: 'calves', equipment: 'body weight' },
  ],
  'waist': [
    { id: 'core-1', name: 'Crunch', bodyPart: 'waist', target: 'abs', equipment: 'body weight' },
    { id: 'core-2', name: 'Plank', bodyPart: 'waist', target: 'core', equipment: 'body weight' },
    { id: 'core-3', name: 'Russian Twist', bodyPart: 'waist', target: 'obliques', equipment: 'body weight' },
    { id: 'core-4', name: 'Leg Raise', bodyPart: 'waist', target: 'lower abs', equipment: 'body weight' },
    { id: 'core-5', name: 'Cable Crunch', bodyPart: 'waist', target: 'abs', equipment: 'cable' },
    { id: 'core-6', name: 'Ab Wheel Rollout', bodyPart: 'waist', target: 'abs', equipment: 'body weight' },
    { id: 'core-7', name: 'Mountain Climber', bodyPart: 'waist', target: 'core', equipment: 'body weight' },
    { id: 'core-8', name: 'Side Plank', bodyPart: 'waist', target: 'obliques', equipment: 'body weight' },
  ],
  'lower arms': [
    { id: 'forearm-1', name: 'Wrist Curl', bodyPart: 'lower arms', target: 'forearms', equipment: 'dumbbell' },
    { id: 'forearm-2', name: 'Reverse Wrist Curl', bodyPart: 'lower arms', target: 'forearms', equipment: 'dumbbell' },
    { id: 'forearm-3', name: 'Farmer Walk', bodyPart: 'lower arms', target: 'forearms', equipment: 'dumbbell' },
    { id: 'forearm-4', name: 'Plate Pinch', bodyPart: 'lower arms', target: 'forearms', equipment: 'barbell' },
  ],
  'cardio': [
    { id: 'cardio-1', name: 'Jumping Jacks', bodyPart: 'cardio', target: 'cardio', equipment: 'body weight' },
    { id: 'cardio-2', name: 'Burpees', bodyPart: 'cardio', target: 'full body', equipment: 'body weight' },
    { id: 'cardio-3', name: 'High Knees', bodyPart: 'cardio', target: 'cardio', equipment: 'body weight' },
    { id: 'cardio-4', name: 'Box Jump', bodyPart: 'cardio', target: 'cardio', equipment: 'body weight' },
    { id: 'cardio-5', name: 'Jump Rope', bodyPart: 'cardio', target: 'cardio', equipment: 'body weight' },
    { id: 'cardio-6', name: 'Battle Ropes', bodyPart: 'cardio', target: 'full body', equipment: 'cable' },
  ],
  'neck': [
    { id: 'neck-1', name: 'Neck Curl', bodyPart: 'neck', target: 'neck', equipment: 'body weight' },
    { id: 'neck-2', name: 'Neck Extension', bodyPart: 'neck', target: 'neck', equipment: 'body weight' },
    { id: 'neck-3', name: 'Neck Side Bend', bodyPart: 'neck', target: 'neck', equipment: 'body weight' },
  ],
};

// Cache per evitare chiamate ripetute
const exerciseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 ora

// Mappatura gruppi muscolari per ricerca
const BODYPART_SEARCH_TERMS: Record<string, string[]> = {
  'chest': ['chest', 'pec', 'bench press', 'fly'],
  'back': ['back', 'lat', 'row', 'pull'],
  'shoulders': ['shoulder', 'delt', 'press', 'lateral raise'],
  'upper arms': ['bicep', 'tricep', 'curl', 'extension'],
  'upper legs': ['leg', 'quad', 'hamstring', 'squat', 'lunge'],
  'lower legs': ['calf', 'calves', 'tibialis'],
  'waist': ['ab', 'core', 'crunch', 'plank'],
  'lower arms': ['forearm', 'wrist', 'grip'],
  'cardio': ['cardio', 'run', 'jump', 'burpee'],
  'neck': ['neck', 'trap'],
};

async function fetchFromAPI(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`https://${RAPIDAPI_HOST}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  console.log('[v0] Fetching from API:', url.toString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY || '',
      'x-rapidapi-host': RAPIDAPI_HOST,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[v0] API Error: ${response.status}`, errorBody);
    throw new Error(`API Error: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

function formatExercise(ex: any) {
  return {
    id: ex.exerciseId || ex.id || Math.random().toString(36).substr(2, 9),
    name: ex.name || 'Unknown Exercise',
    bodyPart: ex.bodyPart || 'general',
    target: ex.targetMuscle || ex.target || ex.bodyPart,
    secondaryMuscles: ex.secondaryMuscles || [],
    equipment: ex.equipments?.[0] || ex.equipment || 'body weight',
    gifUrl: ex.imageUrl || ex.gifUrl,
    imageUrl: ex.imageUrl,
    instructions: ex.instructions || [],
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bodyPart = searchParams.get('bodyPart') || searchParams.get('muscle');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') || '30';

    console.log('[v0] Exercise API request:', { bodyPart, search, limit, hasApiKey: !!RAPIDAPI_KEY });

    // USE LOCAL FALLBACK if no API key
    if (!RAPIDAPI_KEY) {
      console.log('[v0] No RAPID_API_KEY, using local exercises');
      
      let exercises: any[] = [];
      
      if (search) {
        // Search across all local exercises
        const searchLower = search.toLowerCase();
        for (const [_, exList] of Object.entries(LOCAL_EXERCISES)) {
          exercises.push(...exList.filter(ex => 
            ex.name.toLowerCase().includes(searchLower) ||
            ex.target.toLowerCase().includes(searchLower) ||
            ex.equipment.toLowerCase().includes(searchLower)
          ));
        }
      } else if (bodyPart) {
        exercises = LOCAL_EXERCISES[bodyPart.toLowerCase()] || [];
      } else {
        // Return all exercises
        for (const [_, exList] of Object.entries(LOCAL_EXERCISES)) {
          exercises.push(...exList);
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        exercises: exercises.slice(0, parseInt(limit)),
        total: exercises.length,
        source: 'local'
      });
    }

    // Cerca per nome usando endpoint search
    if (search) {
      const cacheKey = `search_${search}_${limit}`;
      const cached = exerciseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('[v0] Returning cached search results');
        return NextResponse.json(cached.data);
      }

      try {
        // Endpoint: /api/v1/exercises/search?search=xxx
        const result = await fetchFromAPI('/api/v1/exercises/search', { search: search });
        
        let rawExercises: any[] = [];
        if (result.success && result.data) {
          rawExercises = result.data;
        } else if (Array.isArray(result)) {
          rawExercises = result;
        }
        
        const exercises = rawExercises.slice(0, parseInt(limit)).map(formatExercise);
        console.log('[v0] Search results:', exercises.length);
        
        const responseData = { success: true, exercises, total: exercises.length };
        exerciseCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
        return NextResponse.json(responseData);
      } catch (err) {
        console.error('[v0] Search failed:', err);
        return NextResponse.json({ success: false, exercises: [], error: 'Search failed' });
      }
    }

    // Cerca per gruppo muscolare usando search
    if (bodyPart) {
      const cacheKey = `bodypart_${bodyPart}_${limit}`;
      const cached = exerciseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('[v0] Returning cached bodyPart results for:', bodyPart);
        return NextResponse.json(cached.data);
      }

      try {
        // Usa il primo termine di ricerca per il bodyPart
        const searchTerms = BODYPART_SEARCH_TERMS[bodyPart.toLowerCase()];
        const searchTerm = searchTerms ? searchTerms[0] : bodyPart;
        
        // Endpoint: /api/v1/exercises/search?search=xxx
        const result = await fetchFromAPI('/api/v1/exercises/search', { search: searchTerm });
        
        let rawExercises: any[] = [];
        if (result.success && result.data) {
          rawExercises = result.data;
        } else if (Array.isArray(result)) {
          rawExercises = result;
        }
        
        // Filtra per bodyPart se necessario
        const filteredExercises = rawExercises.filter(ex => {
          const exBodyPart = (ex.bodyPart || '').toLowerCase();
          const exTarget = (ex.targetMuscle || ex.target || '').toLowerCase();
          const exName = (ex.name || '').toLowerCase();
          
          // Controlla se l'esercizio corrisponde al gruppo muscolare
          if (searchTerms) {
            return searchTerms.some(term => 
              exBodyPart.includes(term) || 
              exTarget.includes(term) || 
              exName.includes(term)
            );
          }
          return true;
        });
        
        const exercises = filteredExercises.slice(0, parseInt(limit)).map(formatExercise);
        console.log('[v0] Fetched exercises for', bodyPart, ':', exercises.length);
        
        const responseData = { success: true, exercises, total: exercises.length };
        exerciseCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
        return NextResponse.json(responseData);
      } catch (err) {
        console.error('[v0] BodyPart fetch failed:', err);
        return NextResponse.json({ success: false, exercises: [], error: 'Fetch failed' });
      }
    }

    // Lista tutti gli esercizi
    const cacheKey = `all_${limit}`;
    const cached = exerciseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    try {
      // Endpoint: /api/v1/exercises
      const result = await fetchFromAPI('/api/v1/exercises');
      
      let rawExercises: any[] = [];
      if (result.success && result.data) {
        rawExercises = result.data;
      } else if (Array.isArray(result)) {
        rawExercises = result;
      }
      
      const exercises = rawExercises.slice(0, parseInt(limit)).map(formatExercise);
      const responseData = { success: true, exercises, total: exercises.length };
      exerciseCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
      return NextResponse.json(responseData);
    } catch (err) {
      console.error('[v0] All exercises fetch failed:', err);
      return NextResponse.json({ success: false, exercises: [], error: 'Fetch failed' });
    }

  } catch (error) {
    console.error('[v0] Exercise API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exercises', exercises: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'getBodyParts') {
      return NextResponse.json({ 
        success: true, 
        bodyParts: ['back', 'cardio', 'chest', 'lower arms', 'lower legs', 'neck', 'shoulders', 'upper arms', 'upper legs', 'waist']
      });
    }

    if (action === 'getEquipments') {
      return NextResponse.json({ 
        success: true, 
        equipments: ['barbell', 'dumbbell', 'cable', 'machine', 'body weight', 'kettlebell', 'band', 'ez barbell', 'smith machine']
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[v0] Exercise API POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch data' }, { status: 500 });
  }
}
