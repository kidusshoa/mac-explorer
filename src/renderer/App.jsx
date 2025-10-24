import React, { useState, useEffect } from 'react';

function App() {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load home directory on mount
    const loadHomeDir = async () => {
      try {
        const homeDir = await window.electronAPI.getHomeDir();
        setCurrentPath(homeDir);
        await loadDirectory(homeDir);
      } catch (error) {
        console.error('Error loading home directory:', error);
      }
    };

    loadHomeDir();
  }, []);

  const loadDirectory = async (path) => {
    setLoading(true);
    try {
      const dirContents = await window.electronAPI.readDirectory(path);
      setFiles(dirContents);
    } catch (error) {
      console.error('Error reading directory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (file) => {
    if (file.isDirectory) {
      setCurrentPath(file.path);
      loadDirectory(file.path);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-xl font-semibold text-gray-800">Mac Explorer</h1>
      </div>

      {/* Address Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">📁</span>
          <input
            type="text"
            value={currentPath}
            onChange={(e) => setCurrentPath(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                loadDirectory(currentPath);
              }
            }}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-1">
            {files.map((file, index) => (
              <div
                key={index}
                onClick={() => handleFileClick(file)}
                className={`px-4 py-2 rounded cursor-pointer hover:bg-blue-50 flex items-center space-x-2 ${
                  file.isDirectory ? 'font-medium' : ''
                }`}
              >
                <span>{file.isDirectory ? '📁' : '📄'}</span>
                <span className="text-sm text-gray-800">{file.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <p className="text-xs text-gray-600">
          {files.length} items
        </p>
      </div>
    </div>
  );
}

export default App;
