import React, { useState, useEffect } from 'react';
import { WorkoutTemplate, TemplateExercise } from '../../types';
import { templateService } from '../../services/templateService';
import { getExerciseById } from '../../data/exerciseDatabase';

interface TemplatesProps {}

const Templates: React.FC<TemplatesProps> = () => {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<WorkoutTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const muscleGroups = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Abs'];

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedDifficulty, selectedMuscleGroup, showFavoritesOnly]);

  const loadTemplates = () => {
    const allTemplates = templateService.getTemplates();
    setTemplates(allTemplates);
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (searchQuery) {
      filtered = templateService.searchTemplates(searchQuery);
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(t => t.difficulty === selectedDifficulty);
    }

    if (selectedMuscleGroup !== 'all') {
      filtered = filtered.filter(t => t.targetMuscleGroups.includes(selectedMuscleGroup));
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(t => t.isFavorite);
    }

    setFilteredTemplates(filtered);
  };

  const handleUseTemplate = (template: WorkoutTemplate) => {
    templateService.useTemplate(template.id);
    loadTemplates();
    // Here you would typically navigate to workout log with template loaded
    alert(`Using template: ${template.name}\n\nThis would normally load the template into the workout log.`);
  };

  const handleToggleFavorite = (template: WorkoutTemplate) => {
    templateService.toggleFavorite(template.id);
    loadTemplates();
  };

  const handleDeleteTemplate = (template: WorkoutTemplate) => {
    if (confirm(`Delete template "${template.name}"?`)) {
      templateService.deleteTemplate(template.id);
      loadTemplates();
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Workout Templates</h1>
          <p className="text-gray-300">Save and reuse your favorite workout routines</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Create Template
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Muscle Group Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Muscle Group</label>
            <select
              value={selectedMuscleGroup}
              onChange={(e) => setSelectedMuscleGroup(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Muscle Groups</option>
              {muscleGroups.map(mg => (
                <option key={mg} value={mg}>{mg}</option>
              ))}
            </select>
          </div>

          {/* Favorites Toggle */}
          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showFavoritesOnly}
                onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-200">Favorites only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <div key={template.id} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all">
            {/* Template Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">{template.name}</h3>
                {template.description && (
                  <p className="text-gray-300 text-sm mb-3">{template.description}</p>
                )}
              </div>
              <button
                onClick={() => handleToggleFavorite(template)}
                className={`p-2 rounded-lg transition-colors ${
                  template.isFavorite 
                    ? 'text-yellow-400 hover:text-yellow-300' 
                    : 'text-gray-400 hover:text-yellow-400'
                }`}
              >
                ★
              </button>
            </div>

            {/* Template Info */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Duration:</span>
                <span className="text-white font-medium">{formatDuration(template.estimatedDuration)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Exercises:</span>
                <span className="text-white font-medium">{template.exercises.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Difficulty:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  template.difficulty === 'beginner' ? 'bg-green-500/20 text-green-300' :
                  template.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                  {template.difficulty}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Used:</span>
                <span className="text-white font-medium">{template.useCount} times</span>
              </div>
            </div>

            {/* Muscle Groups */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {template.targetMuscleGroups.slice(0, 3).map(mg => (
                  <span key={mg} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                    {mg}
                  </span>
                ))}
                {template.targetMuscleGroups.length > 3 && (
                  <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded">
                    +{template.targetMuscleGroups.length - 3} more
                  </span>
                )}
              </div>
            </div>

            {/* Exercise Preview */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-200 mb-2">Exercises:</h4>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {template.exercises.slice(0, 3).map(exercise => (
                  <div key={exercise.exerciseId} className="text-xs text-gray-300">
                    {exercise.exerciseName} - {exercise.targetSets} sets
                  </div>
                ))}
                {template.exercises.length > 3 && (
                  <div className="text-xs text-gray-400">
                    +{template.exercises.length - 3} more exercises
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleUseTemplate(template)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                Use Template
              </button>
              <button
                onClick={() => handleDeleteTemplate(template)}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            {templates.length === 0 ? (
              <>
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold mb-2">No templates yet</h3>
                <p>Create your first workout template to get started</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">No templates found</h3>
                <p>Try adjusting your filters or search query</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create Template Modal would go here */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Create Template</h3>
            <p className="text-gray-300 mb-4">
              Template creation from the workout log is coming soon! You'll be able to save your completed workouts as reusable templates.
            </p>
            <button
              onClick={() => setShowCreateForm(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Templates;
