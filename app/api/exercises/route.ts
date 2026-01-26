import { NextResponse } from 'next/server';

const RAPIDAPI_KEY = process.env.RAPID_API_KEY;
// AscendAPI "Exercise DB with Videos and Images"
const RAPIDAPI_HOST = 'exercise-db-with-videos-and-images-by-ascendapi.p.rapidapi.com';

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

    console.log('[v0] Exercise API request:', { bodyPart, search, limit });

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
