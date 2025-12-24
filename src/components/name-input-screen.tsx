import React, { useState } from 'react';

interface IPropsForNameInputScreen {
  onStartGame: (name: string) => void;
}

const NameInputScreen: React.FC<IPropsForNameInputScreen> = ({ onStartGame }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onStartGame(name.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-900 text-white p-4">
      <h1 className="text-4xl md:text-6xl font-bold mb-8 text-center text-hospital-blue">
        <p>Gigili</p>
        <p className="text-xs">(this game is developed to honor the memory of all healthcare workers who put their lives on the line)</p>
      </h1>
      <div className="text-6xl mb-8 animate-bounce">👩‍⚕️</div>
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-full max-w-md">
        <label htmlFor="playerName" className="text-xl">
          Enter Your Name:
        </label>
        <input
          id="playerName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 focus:border-hospital-blue focus:outline-none text-center text-xl"
          placeholder="your name"
          autoFocus
          required
          maxLength={15}
        />
        <button
          type="submit"
          className="mt-4 px-8 py-3 bg-hospital-blue hover:bg-blue-600 rounded-lg text-xl font-bold transition-colors w-full"
        >
          Start Shift
        </button>
      </form>
      <div className="mt-12 text-slate-400 text-center text-sm">
        <p>Use WASD or Arrow Keys to move</p>
        <p>Collect all supplies 💊 🩹 💉 🩸</p>
        <p>Avoid the patients 🤰🏻</p>
      </div>
    </div>
  );
};

export default NameInputScreen;
