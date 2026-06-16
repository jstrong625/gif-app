export default function LoadingSpinner({ message }) {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <div className="w-14 h-14 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">{message || 'Generating...'}</p>
    </div>
  );
}
