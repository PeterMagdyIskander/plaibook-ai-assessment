import { useRef, useState, useEffect } from "react";
import { io } from "socket.io-client";
import "./App.css";

export default function App() {
  const videoRef = useRef(null);
  const sourceCanvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const [frameCount, setFrameCount] = useState(0);
  const socketRef = useRef(null);

  // Queue system refs
  const frameQueue = useRef([]);
  const isProcessing = useRef(false);
  const pendingFrames = useRef([]);
  const animationFrameId = useRef(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:3000");

    socketRef.current.on("frame_processed", (points) => {
      if (pendingFrames.current.length > 0) {
        // Get the oldest pending frame
        const frameData = pendingFrames.current.shift();
        drawProcessedFrame(frameData, points);
        setFrameCount(prev => prev + 1);
        isProcessing.current = false;
        processNextFrame();
      }
    });

    return () => {
      socketRef.current?.disconnect();
      cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  const drawProcessedFrame = (frameData, points) => {
    const canvas = processedCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      drawPoints(ctx, points, img.width, img.height);
    };
    img.src = frameData;
  };

  const drawPoints = (ctx, points, width, height) => {
    // Helper function to sort points in convex hull order
    const convexHull = (originalPoints) => {
        if (originalPoints.length < 3) return originalPoints;
        const points = [...originalPoints];
        
        // Find centroid
        const centroid = points.reduce((acc, p) => ({
            x: acc.x + p.x,
            y: acc.y + p.y
        }), { x: 0, y: 0 });
        centroid.x /= points.length;
        centroid.y /= points.length;

        // Sort by polar angle from centroid
        return points.sort((a, b) => {
            const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
            const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
            return angleA - angleB;
        });
    };

    // Process red points (set1)
    const sortedRed = convexHull(points.set1);
    ctx.beginPath();
    sortedRed.forEach((p, i) => {
        const x = p.x * width;
        const y = p.y * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();

    // Process blue points (set2)
    const sortedBlue = convexHull(points.set2);
    ctx.beginPath();
    sortedBlue.forEach((p, i) => {
        const x = p.x * width;
        const y = p.y * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.6)';
    ctx.fill();
    ctx.stroke();

    // Draw points and semicircles (unchanged)
    points.set1.forEach(p => {
        const x = p.x * width;
        const y = p.y * height;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI);
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.stroke();
    });

    points.set2.forEach(p => {
        const x = p.x * width;
        const y = p.y * height;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 255, 0.8)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI);
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.stroke();
    });
};

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || video.paused || video.ended) return;

    const canvas = sourceCanvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Add frame to queue
    frameQueue.current.push({
      dataUrl: canvas.toDataURL("image/jpeg"),
      width: canvas.width,
      height: canvas.height,
      timestamp: video.currentTime
    });

    // Continue processing
    animationFrameId.current = requestAnimationFrame(captureFrame);
  };

  const processNextFrame = () => {
    if (!isProcessing.current && frameQueue.current.length > 0) {
      isProcessing.current = true;
      const nextFrame = frameQueue.current.shift();
      pendingFrames.current.push(nextFrame.dataUrl);
      socketRef.current.emit("process_frame");
    }
  };

  const startProcessing = () => {
    const video = videoRef.current;
    if (!video) return;

    // Reset queue state
    frameQueue.current = [];
    pendingFrames.current = [];
    isProcessing.current = false;

    video.play();
    animationFrameId.current = requestAnimationFrame(captureFrame);

    // Start processing loop
    const processInterval = setInterval(() => {
      if (video.paused || video.ended) {
        clearInterval(processInterval);
        return;
      }
      processNextFrame();
    }, 100);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) videoRef.current.src = URL.createObjectURL(file);
  };

  return (
    <div className="container">
      <h1>Plaibook AI Assessment</h1>
      <input type="file" accept="video/*" onChange={handleFileUpload} />
      <button onClick={startProcessing}>Start Processing</button>
      <div className="counter">Frames Analyzed: {frameCount}</div>

      <div className="video-container">
        <div className="video-panel">
          <h3>Original Video</h3>
          <video ref={videoRef} controls className="video-player" />
        </div>

        <div className="result-panel">
          <h3>Processed Frame</h3>
          <canvas
            ref={processedCanvasRef}
            className="processed-canvas"
            style={{ backgroundColor: '#000' }}
          />
        </div>
      </div>
      <canvas ref={sourceCanvasRef} style={{ display: 'none' }} />
    </div>
  );
}