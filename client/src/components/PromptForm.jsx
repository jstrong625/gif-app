import { useState, useRef } from 'react';

const CONTENT_LEVELS = [
  { value: 'sfw', label: 'Safe' },
  { value: 'adult', label: 'Adult' },
  { value: 'explicit', label: 'Explicit' },
];

export default function PromptForm({ onGenerate, loading }) {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('gif');
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [contentLevel, setContentLevel] = useState('sfw');
  const [style, setStyle] = useState('realistic');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef();

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function clearImage() {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!prompt.trim() && !image) return;
    onGenerate({ prompt: prompt.trim(), mode, topText, bottomText, contentLevel, style, image });
  }

  const promptRequired = !image;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-xl mx-auto">
      {/* Mode toggle */}
      <div className="flex rounded-lg overflow-hidden border border-white/15 w-full">
        {['gif', 'meme'].map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`flex-1 py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors ${
              mode === m ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
            {m === 'gif' ? 'Animated GIF' : 'Meme'}
          </button>
        ))}
      </div>

      {/* Style toggle */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-400">Style</label>
        <div className="flex rounded-lg overflow-hidden border border-white/15 w-full">
          {[['realistic', 'Realistic'], ['cartoon', 'Cartoon']].map(([val, lbl]) => (
            <button key={val} type="button" onClick={() => setStyle(val)}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                style === val ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Content level */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-400">Content level</label>
        <div className="flex rounded-lg overflow-hidden border border-white/15 w-full">
          {CONTENT_LEVELS.map(({ value, label }) => (
            <button key={value} type="button" onClick={() => setContentLevel(value)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                contentLevel === value
                  ? value === 'explicit' ? 'bg-red-700 text-white'
                    : value === 'adult' ? 'bg-orange-600 text-white'
                    : 'bg-green-700 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              {label}
            </button>
          ))}
        </div>
        {contentLevel !== 'sfw' && (
          <p className="text-xs text-orange-300">You are responsible for the content you generate.</p>
        )}
      </div>

      {/* Image upload */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-400">Upload image (optional)</label>
        {imagePreview ? (
          <div className="relative w-full rounded-lg overflow-hidden border border-white/15">
            <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover" />
            <button type="button" onClick={clearImage}
              className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-black">
              ✕
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`w-full border-2 border-dashed rounded-lg py-6 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
              dragging ? 'border-purple-400 bg-purple-900/20' : 'border-white/20 hover:border-white/40'}`}>
            <span className="text-2xl">📷</span>
            <span className="text-sm text-gray-400">Tap to upload or drag & drop</span>
            <span className="text-xs text-gray-500">JPG, PNG up to 10MB</span>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => handleFile(e.target.files[0])} />
      </div>

      {/* Prompt */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-400">
          Describe what you want{image ? ' (optional — leave blank to just animate your image)' : ''}
        </label>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
          placeholder={image ? 'Leave blank to animate the image, or describe a style...' :
            mode === 'gif' ? 'e.g. a flirty woman in a vintage dress winking at the camera'
              : 'e.g. a smug cat sitting on a throne'}
          rows={3}
          className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500 transition-colors text-base"
          disabled={loading} />
      </div>

      {/* Meme captions */}
      {mode === 'meme' && (
        <div className="flex flex-col gap-3">
          {[['topText', setTopText, topText, 'Top text (optional)', 'TOP TEXT'],
            ['bottomText', setBottomText, bottomText, 'Bottom text (optional)', 'BOTTOM TEXT']
          ].map(([key, setter, val, lbl, ph]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-sm text-gray-400">{lbl}</label>
              <input value={val} onChange={(e) => setter(e.target.value)} placeholder={ph}
                className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors text-base"
                disabled={loading} />
            </div>
          ))}
        </div>
      )}

      <button type="submit" disabled={loading || (promptRequired && !prompt.trim())}
        className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-base">
        {loading ? 'Generating...' : `Create ${mode === 'gif' ? 'Animated GIF' : 'Meme'}`}
      </button>

      {mode === 'gif' && (
        <p className="text-xs text-gray-500 text-center">
          {image ? 'Your image will be animated instantly with smooth motion'
            : 'AI generates an image then animates it (~15–20s)'}
        </p>
      )}
    </form>
  );
}
