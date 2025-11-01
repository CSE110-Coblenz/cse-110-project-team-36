import React, { useState } from "react";

interface DifficultySelectionScreenProps {
  onBack: () => void;
  onStartRace: (topic: string, difficulty: string) => void;
}

const DifficultySelectionScreen: React.FC<DifficultySelectionScreenProps> = ({
  onBack,
  onStartRace,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const topics = ["Addition", "Subtraction", "Multiplication", "Division"];
  const difficulties = ["Easy", "Medium", "Hard"];

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic); // Only one topic can be selected at a time
  };

  const handleDifficultySelect = (level: string) => {
    setSelectedDifficulty(level); // Only one difficulty can be selected at a time
  };

  const handleStart = () => {
    if (selectedTopic && selectedDifficulty) {
      onStartRace(selectedTopic, selectedDifficulty);
    }
  };

  // All buttons now have the same static style
  const getButtonClasses = () =>
    "bg-gray-100 text-black px-6 py-3 rounded-md font-medium transition-all duration-300 transform";

  return (
    <div className="flex flex-col h-screen w-full bg-white border border-purple-400 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center px-8 py-4">
        <button onClick={onBack} className="text-lg hover:text-purple-600 transition">
          Back
        </button>
        <button onClick={() => console.log("Settings clicked")} className="text-2xl hover:text-purple-600 transition">
          ⚙️
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center flex-1 space-y-10">
        {/* Topic Selection */}
        <div className="text-2xl font-medium">Choose your math topic</div>
        <div className="flex space-x-10 text-xl">
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() => handleTopicSelect(topic)}
              className={getButtonClasses()}
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Difficulty Selection */}
        <div className="text-2xl font-medium mt-10">Choose difficulty</div>
        <div className="flex space-x-10 text-xl">
          {difficulties.map((level) => (
            <button
              key={level}
              onClick={() => handleDifficultySelect(level)}
              className={getButtonClasses()}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Start Race Button */}
        <button
          onClick={handleStart}
          disabled={!selectedTopic || !selectedDifficulty}
          className={`mt-16 px-8 py-3 rounded-lg text-xl font-semibold transition-all duration-300 ${
            selectedTopic && selectedDifficulty
              ? "bg-purple-700 text-white shadow-md"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          Start Race
        </button>
      </div>
    </div>
  );
};

export default DifficultySelectionScreen;
