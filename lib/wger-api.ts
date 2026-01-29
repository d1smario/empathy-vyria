// Wger.de API Integration
// License: Exercise data is Creative Commons (CC-BY-SA) - commercial use allowed with attribution
// Source: https://wger.de - Free and Open Source fitness/workout manager

const WGER_API_BASE = 'https://wger.de/api/v2';

// Muscle groups mapping (Wger IDs)
export const MUSCLE_GROUPS = {
  chest: { id: 4, name: 'Petto', color: '#ef4444' },         // Pectoralis major
  back: { id: 12, name: 'Dorsali', color: '#3b82f6' },       // Latissimus dorsi
  shoulders: { id: 2, name: 'Spalle', color: '#f97316' },    // Deltoid
  biceps: { id: 1, name: 'Bicipiti', color: '#22c55e' },     // Biceps brachii
  triceps: { id: 5, name: 'Tricipiti', color: '#a855f7' },   // Triceps brachii
  legs: { id: 10, name: 'Gambe', color: '#06b6d4' },         // Quadriceps
  glutes: { id: 8, name: 'Glutei', color: '#ec4899' },       // Gluteus maximus
  core: { id: 6, name: 'Addominali', color: '#eab308' },     // Rectus abdominis
  calves: { id: 7, name: 'Polpacci', color: '#14b8a6' },     // Gastrocnemius
  forearms: { id: 13, name: 'Avambracci', color: '#78716c' }, // Brachioradialis
  hamstrings: { id: 11, name: 'Femorali', color: '#0891b2' }, // Biceps femoris
};

// Equipment mapping (Wger IDs)
export const EQUIPMENT = {
  barbell: { id: 1, name: 'Bilanciere' },
  dumbbell: { id: 3, name: 'Manubri' },
  machine: { id: 6, name: 'Macchina' },
  cable: { id: 9, name: 'Cavi' },
  bodyweight: { id: 7, name: 'Corpo libero' },
  kettlebell: { id: 10, name: 'Kettlebell' },
  bench: { id: 8, name: 'Panca' },
  pullUpBar: { id: 4, name: 'Sbarra' },
  ezBar: { id: 2, name: 'Bilanciere EZ' },
  none: { id: 7, name: 'Nessuno' },
};

export interface WgerExercise {
  id: number;
  uuid: string;
  name: string;
  description: string;
  muscles: number[];
  muscles_secondary: number[];
  equipment: number[];
  category: number;
  images: WgerImage[];
  videos: WgerVideo[];
}

export interface WgerImage {
  id: number;
  uuid: string;
  image: string;
  is_main: boolean;
  style: string;
  license: number;
  license_author: string;
}

export interface WgerVideo {
  id: number;
  uuid: string;
  video: string;
  is_main: boolean;
  license: number;
  license_author: string;
}

export interface WgerMuscle {
  id: number;
  name: string;
  name_en: string;
  is_front: boolean;
  image_url_main: string;
  image_url_secondary: string;
}

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

async function fetchWithCache<T>(url: string): Promise<T> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Wger API error: ${response.status}`);
  }

  const data = await response.json();
  cache.set(url, { data, timestamp: Date.now() });
  return data as T;
}

// Get all muscles
export async function getMuscles(): Promise<WgerMuscle[]> {
  const response = await fetchWithCache<{ results: WgerMuscle[] }>(
    `${WGER_API_BASE}/muscle/`
  );
  return response.results;
}

// Get exercises by muscle group
export async function getExercisesByMuscle(
  muscleId: number,
  language: number = 5 // 5 = Italian, 2 = English
): Promise<WgerExercise[]> {
  const response = await fetchWithCache<{ results: any[] }>(
    `${WGER_API_BASE}/exerciseinfo/?muscles=${muscleId}&language=${language}&limit=100`
  );
  
  // Fallback to English if no results in Italian
  if (response.results.length === 0 && language === 5) {
    return getExercisesByMuscle(muscleId, 2);
  }
  
  return response.results.map(mapToWgerExercise);
}

// Get exercises by equipment
export async function getExercisesByEquipment(
  equipmentId: number,
  language: number = 5
): Promise<WgerExercise[]> {
  const response = await fetchWithCache<{ results: any[] }>(
    `${WGER_API_BASE}/exerciseinfo/?equipment=${equipmentId}&language=${language}&limit=100`
  );
  
  if (response.results.length === 0 && language === 5) {
    return getExercisesByEquipment(equipmentId, 2);
  }
  
  return response.results.map(mapToWgerExercise);
}

// Get exercise by ID
export async function getExerciseById(id: number): Promise<WgerExercise | null> {
  try {
    const response = await fetchWithCache<any>(
      `${WGER_API_BASE}/exerciseinfo/${id}/`
    );
    return mapToWgerExercise(response);
  } catch {
    return null;
  }
}

// Search exercises by name
export async function searchExercises(
  query: string,
  language: number = 5
): Promise<WgerExercise[]> {
  const response = await fetchWithCache<{ results: any[] }>(
    `${WGER_API_BASE}/exerciseinfo/?name=${encodeURIComponent(query)}&language=${language}&limit=50`
  );
  
  // Also search in English
  const englishResponse = await fetchWithCache<{ results: any[] }>(
    `${WGER_API_BASE}/exerciseinfo/?name=${encodeURIComponent(query)}&language=2&limit=50`
  );
  
  const allResults = [...response.results, ...englishResponse.results];
  const uniqueResults = allResults.filter(
    (item, index, self) => index === self.findIndex((t) => t.id === item.id)
  );
  
  return uniqueResults.map(mapToWgerExercise);
}

// Get all exercise categories
export async function getCategories(): Promise<{ id: number; name: string }[]> {
  const response = await fetchWithCache<{ results: { id: number; name: string }[] }>(
    `${WGER_API_BASE}/exercisecategory/`
  );
  return response.results;
}

// Map API response to our interface
function mapToWgerExercise(data: any): WgerExercise {
  return {
    id: data.id,
    uuid: data.uuid || '',
    name: data.name || data.exercises?.[0]?.name || 'Unknown',
    description: stripHtml(data.description || data.exercises?.[0]?.description || ''),
    muscles: data.muscles?.map((m: any) => m.id || m) || [],
    muscles_secondary: data.muscles_secondary?.map((m: any) => m.id || m) || [],
    equipment: data.equipment?.map((e: any) => e.id || e) || [],
    category: data.category?.id || data.category || 0,
    images: data.images || [],
    videos: data.videos || [],
  };
}

// Strip HTML tags from description
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

// Get muscle name by ID
export function getMuscleNameById(id: number): string {
  const muscle = Object.values(MUSCLE_GROUPS).find((m) => m.id === id);
  return muscle?.name || 'Altro';
}

// Get muscle color by ID
export function getMuscleColorById(id: number): string {
  const muscle = Object.values(MUSCLE_GROUPS).find((m) => m.id === id);
  return muscle?.color || '#6b7280';
}

// Get equipment name by ID
export function getEquipmentNameById(id: number): string {
  const equipment = Object.values(EQUIPMENT).find((e) => e.id === id);
  return equipment?.name || 'Altro';
}

// Get primary image URL for an exercise
export function getExerciseImageUrl(exercise: WgerExercise): string {
  const mainImage = exercise.images.find((img) => img.is_main);
  if (mainImage) return mainImage.image;
  if (exercise.images.length > 0) return exercise.images[0].image;
  return '/placeholder.svg?height=200&width=200';
}

// Get all images for an exercise
export function getExerciseImages(exercise: WgerExercise): string[] {
  return exercise.images.map((img) => img.image);
}

// Category mapping (Wger categories to our groups)
export const CATEGORY_TO_MUSCLE: Record<number, string> = {
  8: 'chest',     // Chest
  9: 'chest',     // Chest
  10: 'back',     // Back
  11: 'shoulders', // Shoulders
  12: 'biceps',   // Arms (Biceps)
  13: 'triceps',  // Arms (Triceps)
  14: 'legs',     // Legs
  15: 'calves',   // Calves
  16: 'core',     // Abs
};
