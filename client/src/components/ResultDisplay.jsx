export default function ResultDisplay({ result, mode, onReset }) {
  const isGif = mode === 'gif';
  const mimeType = isGif ? 'image/gif' : 'image/png';
  const ext = isGif ? 'gif' : 'png';
  const dataUrl = `data:${mimeType};base64,${result}`;

  function handleDownload() {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `ai-${mode}-${Date.now()}.${ext}`;
    a.click();
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10 w-full max-w-sm mx-auto">
        <img src={dataUrl} alt="Generated result" className="w-full h-auto" />
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button
          onClick={handleDownload}
          className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors text-base"
        >
          Download {ext.toUpperCase()}
        </button>
        <button
          onClick={onReset}
          className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors text-base"
        >
          Generate Another
        </button>
      </div>
    </div>
  );
}
