import { useState } from 'react';
import NameInputScreen from './components/name-input-screen';
import GameBoard from './components/game-board';

function App() {
  const [playerName, setPlayerName] = useState<string>('');
  const [gameState, setGameState] = useState<'INPUT' | 'PLAYING' | 'GAME_OVER' | 'VICTORY'>('INPUT');
  const [finalScore, setFinalScore] = useState(0);

  const handleStartGame = (name: string) => {
    setPlayerName(name);
    setGameState('PLAYING');
  };

  const handleGameOver = (score: number) => {
    setFinalScore(score);
    setGameState('GAME_OVER');
  };

  const handleVictory = (score: number) => {
    setFinalScore(score);
    setGameState('VICTORY');
  };

  const handleRestart = () => {
    setGameState('INPUT');
    setPlayerName('');
    setFinalScore(0);
  };

  return (
    <div className="w-full h-full">
      {gameState === 'INPUT' && (
        <NameInputScreen onStartGame={handleStartGame} />
      )}
      
      {gameState === 'PLAYING' && (
        <GameBoard 
          playerName={playerName} 
          onGameOver={handleGameOver} 
          onVictory={handleVictory} 
        />
      )}

      {(gameState === 'GAME_OVER' || gameState === 'VICTORY') && (
        <div className="flex flex-col items-center justify-center w-full h-full bg-slate-900 text-white p-4 z-50 absolute top-0 left-0">
          <h1 className={`text-6xl font-bold mb-4 ${gameState === 'VICTORY' ? 'text-green-500' : 'text-red-500'}`}>
            {gameState === 'VICTORY' ? 'VICTORY!' : 'GAME OVER'}
          </h1>
          <div className="text-4xl mb-8">
            {gameState === 'VICTORY' ? '🏆' : '💀'}
          </div>
          <p className="text-2xl mb-4">name: <span className="text-hospital-blue font-bold">{playerName}</span></p>
          <p className="text-2xl mb-8">Score: <span className="text-yellow-400 font-bold">{finalScore}</span></p>
          
          <button 
            onClick={handleRestart}
            className="px-8 py-3 bg-hospital-blue hover:bg-blue-600 rounded-lg text-xl font-bold transition-colors"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
