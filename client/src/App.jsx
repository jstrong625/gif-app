import { useState } from 'react';
import PromptForm from './components/PromptForm';
import ResultDisplay from './components/ResultDisplay';
import LoadingSpinner from './components/LoadingSpinner';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [currentMode, setCurrentMode] = useState('gif');
  const [error, setError] = useState(null);

  async function handleGenerate({ prompt, mode, topText, bottomText, contentLevel, style, image }) {
    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentMode(mode);

    try {
      let imageBase64 = null;
      if (image) {
        imageBase64 = await fileToBase64(image);
      }
      const headers = { 'Content-Type': 'application/json' };
      const body = JSON.stringify({ prompt, mode, topText, bottomText, contentLevel, style, imageBase64 });

      const res = await fetch('/api/generate', { method: 'POST', headers, body });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }

      const blob = await res.blob();
      const base64 = await blobToBase64(blob);
      setResult(base64);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 768;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.75).split(',')[1]);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white">
      <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            AI GIF & Meme Maker
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">Describe what you want or upload a photo</p>
        </div>

        {!result && !loading && <PromptForm onGenerate={handleGenerate} loading={loading} />}

        {loading && (
          <LoadingSpinner message={
            currentMode === 'gif' ? 'Animating your GIF...' : 'Generating your meme...'
          } />
        )}

        {result && !loading && (
          <ResultDisplay result={result} mode={currentMode} onReset={() => setResult(null)} />
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-500/40 rounded-lg text-red-300 text-sm">
            <strong>Error:</strong> {error}
            <button onClick={() => setError(null)} className="ml-3 underline hover:no-underline">Dismiss</button>
          </div>
        )}
      </div>
    </div>
  );
}
