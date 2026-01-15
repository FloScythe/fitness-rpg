/**
 * FitnessRPG - Debug Loader
 * Script temporaire pour vérifier le chargement des modules
 * À supprimer une fois l'app stable
 */

console.log('🔍 Debug: Vérification des modules...');

// Attendre que le DOM soit chargé
window.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM chargé');

  // Vérifier chaque module
  const modules = [
    'fitnessDB',
    'Helpers',
    'RPG_CONFIG',
    'RPG_FORMULAS',
    'RPGManager',
    'WorkoutManager',
    'SmartCoach',
    'NotificationManager',
    'TimerManager',
    'SyncQueueManager',
    'router'
  ];

  modules.forEach(moduleName => {
    if (window[moduleName]) {
      console.log(`✅ ${moduleName} chargé`);
    } else {
      console.error(`❌ ${moduleName} MANQUANT`);
    }
  });

  // Vérifier les fonctions globales
  const globalFunctions = [
    'seedExercises',
    'selectExercise',
    'syncData',
    'logout'
  ];

  globalFunctions.forEach(funcName => {
    if (typeof window[funcName] === 'function') {
      console.log(`✅ ${funcName}() disponible`);
    } else {
      console.warn(`⚠️ ${funcName}() non disponible`);
    }
  });

  console.log('🔍 Fin de la vérification des modules');
});