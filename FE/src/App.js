"use client"
import { useRef, useState, useEffect } from "react";
import { io } from "socket.io-client";
import "./App.css";

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const [frameCount, setFrameCount] = useState(0);
  const socketRef = useRef(null);
  const processingQueue = useRef([]);
  const isProcessing = useRef(false);
  const currentFrameIndex = useRef(0);

  useEffect(() => {
    socketRef.current = io("http://localhost:3000");
    
    socketRef.current.on("frame_processed", ({ id, points }) => {
      const frameIndex = processingQueue.current.findIndex(f => f.id === id);
      if (frameIndex >= 0) {
        processingQueue.current[frameIndex].processed = true;
        processingQueue.current[frameIndex].points = points;
        tryProcessQueue();
      }
    });

    return () => socketRef.current?.disconnect();
  }, []);

  const tryProcessQueue = () => {
    // Find the next unprocessed frame
    const nextFrame = processingQueue.current.find(f => !f.processed);
    if (nextFrame && !isProcessing.current) {
      isProcessing.current = true;
      socketRef.current.emit("process_frame", { id: nextFrame.id });
    }

    // Display frames in order
    let displayIndex = 0;
    while (displayIndex < processingQueue.current.length) {
      const frame = processingQueue.current[displayIndex];
      if (frame.processed && frame.displayIndex === undefined) {
        frame.displayIndex = currentFrameIndex.current++;
        drawProcessedFrame(frame);
        setFrameCount(prev => prev + 1);
      }
      displayIndex++;
    }
  };

  const drawProcessedFrame = (frame) => {
    const canvas = processedCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = frame.width;
    canvas.height = frame.height;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      drawShapes(ctx, frame.points, frame.width, frame.height);
    };
    img.src = frame.dataUrl;
  };

  const drawShapes = (ctx, points, width, height) => {
    // Draw red shape (5 points)
    ctx.beginPath();
    points.set1.forEach((p, i) => {
      const x = p.x * width;
      const y = p.y * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    points.set1.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.fill();
    });

    // Draw blue shape (4 points)
    ctx.beginPath();
    points.set2.forEach((p, i) => {
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

    points.set2.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 255, 0.8)';
      ctx.fill();
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) videoRef.current.src = URL.createObjectURL(file);
  };

  const captureFrames = async () => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    const duration = video.duration;
    const fps = 25; // Adjust based on actual video FPS
    const frameTime = 1 / fps;

    for (let currentTime = 0; currentTime < duration; currentTime += frameTime) {
      await new Promise(resolve => {
        video.currentTime = currentTime;
        
        video.onseeked = () => {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);

          const frameId = `frame-${currentTime.toFixed(3)}`;
          const frameData = canvas.toDataURL("image/jpeg", 0.8);
          
          processingQueue.current.push({
            id: frameId,
            dataUrl: frameData,
            width: canvas.width,
            height: canvas.height,
            processed: false,
            points: null
          });

          tryProcessQueue();
          resolve();
        };
      });
    }
  };

  return (
    <div className="container">
      <h1>Video Frame Analyzer</h1>
      <input type="file" accept="video/*" onChange={handleFileUpload} />
      <button onClick={captureFrames}>Start Processing</button>
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
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}