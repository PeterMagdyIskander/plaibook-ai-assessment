"use client"

import { useRef, useState, useEffect } from "react"
import "./App.css"

function App() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [originalFrameCount, setOriginalFrameCount] = useState(0)
  const [processedFrameCount, setProcessedFrameCount] = useState(0)

  const handleVideoUpload = (event) => {
    const file = event.target.files[0]
    if (file && videoRef.current) {
      const videoUrl = URL.createObjectURL(file)
      videoRef.current.src = videoUrl
      setOriginalFrameCount(0)
      setProcessedFrameCount(0)
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateOriginalFrameCount = () => {
      setOriginalFrameCount(Math.floor(video.currentTime * video.playbackRate * 30)) // Assuming 30 fps
    }

    video.addEventListener("timeupdate", updateOriginalFrameCount)

    return () => {
      video.removeEventListener("timeupdate", updateOriginalFrameCount)
    }
  }, [])

  const processVideo = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    let frameCount = 0

    // Draw shapes on each frame
    const drawFrame = () => {
      if (video.paused || video.ended) return

      // Clear the canvas before drawing the next frame
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw the current video frame onto the canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Get the current time of the video
      const currentTime = video.currentTime

      // Generate dynamic points for the blue shape (4 points)
      const blueShapePoints = [
        { x: 50 + Math.sin(currentTime) * 50, y: 50 + Math.cos(currentTime) * 50 },
        { x: 150 + Math.sin(currentTime * 1.2) * 50, y: 50 + Math.cos(currentTime * 1.2) * 50 },
        { x: 150 + Math.sin(currentTime * 0.8) * 50, y: 150 + Math.cos(currentTime * 0.8) * 50 },
        { x: 50 + Math.sin(currentTime * 1.5) * 50, y: 150 + Math.cos(currentTime * 1.5) * 50 },
      ]

      // Generate dynamic points for the red shape (5 points)
      const redShapePoints = [
        { x: 200 + Math.sin(currentTime * 0.5) * 100, y: 200 + Math.cos(currentTime * 0.5) * 100 },
        { x: 300 + Math.sin(currentTime * 0.7) * 100, y: 200 + Math.cos(currentTime * 0.7) * 100 },
        { x: 300 + Math.sin(currentTime * 0.9) * 100, y: 300 + Math.cos(currentTime * 0.9) * 100 },
        { x: 250 + Math.sin(currentTime * 1.1) * 100, y: 350 + Math.cos(currentTime * 1.1) * 100 },
        { x: 200 + Math.sin(currentTime * 1.3) * 100, y: 300 + Math.cos(currentTime * 1.3) * 100 },
      ]

      // Draw the blue shape (4 connected points)
      drawShape(ctx, blueShapePoints, "rgba(0, 0, 255, 0.5)", "rgba(0, 0, 255, 0.8)")

      // Draw the red shape (5 connected points)
      drawShape(ctx, redShapePoints, "rgba(255, 0, 0, 0.5)", "rgba(255, 0, 0, 0.8)")

      // Update processed frame count
      frameCount++
      setProcessedFrameCount(frameCount)

      // Request the next frame
      requestAnimationFrame(drawFrame)
    }

    // Start processing when the video plays
    video.addEventListener("play", drawFrame)
  }

  const drawShape = (ctx, points, fillColor, vertexColor) => {
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    points.forEach((point, index) => {
      if (index > 0) ctx.lineTo(point.x, point.y)
    })
    ctx.closePath()
    ctx.fillStyle = fillColor
    ctx.fill()

    // Draw vertices with specific styles
    points.forEach((point) => {
      ctx.beginPath()

      // Large dot for the vertex
      ctx.arc(point.x, point.y, 15, 0, Math.PI * 2)
      ctx.fillStyle = vertexColor
      ctx.fill()

      // Semi-circle
      ctx.beginPath()
      ctx.arc(point.x, point.y, 20, 0, Math.PI)
      ctx.strokeStyle = vertexColor
      ctx.lineWidth = 3
      ctx.stroke()
    })
  }

  return (
    <div className="App">
      <h1>Video Shape App</h1>
      <input type="file" accept="video/*" onChange={handleVideoUpload} />
      <br />
      <button onClick={processVideo}>Process Video</button>
      <br />
      <div style={{ display: "flex" }}>
        <div>
          <h3>Original Video</h3>
          <video ref={videoRef} controls style={{ width: "400px" }} />
          <p>Frame: {originalFrameCount}</p>
        </div>
        <div>
          <h3>Processed Video</h3>
          <canvas ref={canvasRef} style={{ width: "400px", border: "1px solid black" }} />
          <p>Frame: {processedFrameCount}</p>
        </div>
      </div>
    </div>
  )
}

export default App

