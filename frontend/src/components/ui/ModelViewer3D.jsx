import { useEffect, useRef, useState } from 'react';
import '@google/model-viewer';
import { FiMaximize2, FiMinimize2, FiRotateCw } from 'react-icons/fi';
import './ModelViewer3D.css';

/**
 * Interactive 3D model viewer using Google's <model-viewer> web component.
 *
 * @param {string}  src        - URL to the .glb 3D model file
 * @param {string}  poster     - URL to a 2D thumbnail shown while loading
 * @param {string}  alt        - Accessible alt text
 * @param {number}  height     - Viewer height in px (default 400)
 * @param {object}  style      - Additional container styles
 */
export default function ModelViewer3D({ src, poster, alt = '3D Model Preview', height = 400, style }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [hintVisible, setHintVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Hide hint after first user interaction or 5s timeout
  useEffect(() => {
    const timer = setTimeout(() => setHintVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Listen to model-viewer events
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const onProgress = (e) => {
      setProgress(Math.round(e.detail.totalProgress * 100));
    };

    const onLoad = () => {
      setLoading(false);
      setProgress(100);
    };

    const onInteraction = () => {
      setHintVisible(false);
    };

    viewer.addEventListener('progress', onProgress);
    viewer.addEventListener('load', onLoad);
    viewer.addEventListener('camera-change', onInteraction);

    return () => {
      viewer.removeEventListener('progress', onProgress);
      viewer.removeEventListener('load', onLoad);
      viewer.removeEventListener('camera-change', onInteraction);
    };
  }, [src]);

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => { });
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => { });
    }
  };

  // Listen for fullscreen exit via Escape
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  if (!src) return null;

  return (
    <div
      ref={containerRef}
      className="model-viewer-3d-container"
      style={{ height: isFullscreen ? '100vh' : height, ...style }}
    >
      {/* The web component */}
      <model-viewer
        ref={viewerRef}
        src={src}
        poster={poster || undefined}
        alt={alt}
        camera-controls=""
        auto-rotate=""
        auto-rotate-delay="2000"
        rotation-per-second="30deg"
        shadow-intensity="1.2"
        shadow-softness="0.8"
        exposure="1.0"
        environment-image="neutral"
        interaction-prompt="none"
        style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
      />

      {/* Loading overlay */}
      <div className={`model-viewer-3d-loading ${!loading ? 'hidden' : ''}`}>
        <div className="model-viewer-3d-loading-icon" />
        <span className="model-viewer-3d-loading-text">Loading 3D model… {progress}%</span>
      </div>

      {/* Progress bar */}
      {loading && (
        <div className="model-viewer-3d-progress">
          <div className="model-viewer-3d-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* 3D badge */}
      <span className="model-viewer-3d-badge">
        <FiRotateCw size={12} /> 3D MODEL
      </span>

      {/* Fullscreen toggle */}
      <button
        className="model-viewer-3d-fullscreen-btn"
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
      >
        {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
      </button>

      {/* Interaction hint */}
      <div className={`model-viewer-3d-hint ${!hintVisible ? 'hidden' : ''}`}>
        <FiRotateCw size={14} />
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}
