import { useState } from 'react';
import PromptForm from './components/PromptForm';
import ResultDisplay from './components/ResultDisplay';
import LoadingSpinner from './components/LoadingSpinner';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [currentMode, setCurrentMode] = useState('gif');
  const [error, setError] = useState(null);

  async function handleGenerate({ prompt, mode, topText, bottomText, contentLevel, image }) {
    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentMode(mode);

    try {
      let body;
      let headers = {};

      if (image) {
        const fd = new FormData();
        fd.append('image', image);
        fd.append('prompt', prompt);
        fd.append('mode', mode);
        fd.append('topText', topText);
        fd.append('bottomText', bottomText);
        fd.append('contentLevel', contentLevel);
        body = fd;
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({ prompt, mode, topText, bottomText, contentLevel });
      }

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
