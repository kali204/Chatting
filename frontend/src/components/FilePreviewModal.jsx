import { useState, useEffect } from "react";

// A generic document icon for non-image files
const DocumentIcon = () => (
  <svg width={60} height={60} viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-400">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export default function FilePreviewModal({ fileData, onClose, onSend }) {
  const [caption, setCaption] = useState("");

  // Clean up the object URL to prevent memory leaks when the modal is closed
  useEffect(() => {
    return () => {
      if (fileData.url) {
        URL.revokeObjectURL(fileData.url);
      }
    };
  }, [fileData.url]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center p-4">
      <div className="bg-[#111B21] rounded-lg shadow-xl w-full max-w-lg flex flex-col relative text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-300 hover:text-white z-10 p-2 rounded-full bg-black bg-opacity-20"
          aria-label="Close preview"
        >
          ✕
        </button>

        {/* Preview Content */}
        <div className="flex-1 flex justify-center items-center p-8 min-h-[300px] max-h-[70vh]">
          {fileData.type === 'image' ? (
            <img
              src={fileData.url}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-md"
            />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <DocumentIcon />
              <span className="text-lg font-medium truncate max-w-xs">
                {fileData.file.name}
              </span>
            </div>
          )}
        </div>

        {/* Caption Input and Send Button */}
        <div className="flex items-center gap-3 p-4 bg-[#202C33]">
          <input
            type="text"
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="flex-1 px-4 py-2 bg-[#2A3942] rounded-full text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={() => onSend(fileData.file, caption)}
            className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-green-600 hover:bg-green-700 text-white transition-transform transform hover:scale-110"
            aria-label="Send file"
          >
            {/* Send Icon */}
            <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
