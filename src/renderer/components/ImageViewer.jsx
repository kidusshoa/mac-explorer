import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

function ImageViewer({ imagePath, onClose }) {
  const [imageData, setImageData] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (imagePath) {
      loadImage();
    }
  }, [imagePath]);

  const loadImage = async () => {
    try {
      const buffer = await window.electronAPI.readFile(imagePath);
      const blob = new Blob([buffer]);
      const url = URL.createObjectURL(blob);
      setImageData(url);
    } catch (error) {
      console.error('Failed to load image:', error);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  if (!imagePath) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      >
        {/* Controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleZoomIn}
            className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-lg backdrop-blur-sm transition-colors"
          >
            <ZoomIn className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleZoomOut}
            className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-lg backdrop-blur-sm transition-colors"
          >
            <ZoomOut className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRotate}
            className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-lg backdrop-blur-sm transition-colors"
          >
            <RotateCw className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-lg backdrop-blur-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Image */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        >
          {imageData && (
            <motion.img
              src={imageData}
              alt="Preview"
              animate={{ scale: zoom, rotate: rotation }}
              transition={{ type: 'spring', damping: 20 }}
              className="max-w-full max-h-full object-contain"
            />
          )}
        </motion.div>

        {/* Filename */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
          <p className="text-white text-sm font-medium">
            {imagePath.split('/').pop()}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ImageViewer;
