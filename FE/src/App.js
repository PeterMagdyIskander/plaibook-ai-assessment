"use client"

import { useRef, useEffect, useState } from "react"
import { io } from "socket.io-client"
import "./App.css"

function App() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const socketRef = useRef(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const animationFrameRef = useRef(null)
  const pointsRef = useRef({ set1: [], set2: [] })

  useEffect(() => {
    // Initialize WebSocket connection
    socketRef.current = io("http://localhost:3000")

    socketRef.current.on("points", (data) => {
      pointsRef.current = data
    })

    return () => {
      socketRef.current?.disconnect()
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  const handleVideoUpload = (event) => {
    const file = event.target.files[0]
    if (file && videoRef.current) {
      const videoUrl = URL.createObjectURL(file)
      videoRef.current.src = videoUrl
    }
  }

  const processVideo = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    setIsProcessing(true)

    const sendFrame = () => {
      if (video.paused || video.ended) {
        setIsProcessing(false)
        return
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Send frame to backend
      const frameData = canvas.toDataURL("image/jpeg", 0.8)
      socketRef.current?.emit("frame", {
        frame: frameData,
        width: canvas.width,
        height: canvas.height
      })

      // Draw received points
      drawPoints(ctx, canvas.width, canvas.height)
      
      animationFrameRef.current = requestAnimationFrame(sendFrame)
    }

    video.addEventListener("play", sendFrame)
    video.play()
  }

  const drawPoints = (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(videoRef.current, 0, 0, width, height)

    // Draw set1 (4 points)
    if (pointsRef.current.set1.length === 4) {
      drawShape(
        ctx,
        pointsRef.current.set1.map(p => ({
          x: p.x * width,
          y: p.y * height
        })),
        "rgba(255, 0, 0, 0.5)",
        "rgba(255, 0, 0, 0.8)"
      )
    }

    // Draw set2 (5 points)
    if (pointsRef.current.set2.length === 5) {
      drawShape(
        ctx,
        pointsRef.current.set2.map(p => ({
          x: p.x * width,
          y: p.y * height
        })),
        "rgba(0, 0, 255, 0.5)",
        "rgba(0, 0, 255, 0.8)"
      )
    }
  }

  const drawShape = (ctx, points, fillColor, vertexColor) => {
    if (points.length === 0) return

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    points.forEach((point, index) => {
      if (index > 0) ctx.lineTo(point.x, point.y)
    })
    ctx.closePath()
    ctx.fillStyle = fillColor
    ctx.fill()

    points.forEach((point) => {

      //circle
      ctx.beginPath()
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
      <h1>Plaibook AI Assessment</h1>
      <input type="file" accept="video/*" onChange={handleVideoUpload} />
      <br />
      <button onClick={processVideo} disabled={isProcessing}>
        {isProcessing ? "Processing..." : "Process Video"}
      </button>
      <br />
      <div style={{ display: "flex" }}>
        <div>
          <h3>Original Video</h3>
          <video ref={videoRef} controls style={{ width: "400px" }} />
        </div>
        <div>
          <h3>Processed Video</h3>
          <canvas 
            ref={canvasRef} 
            style={{ width: "400px", border: "1px solid black" }}
          />
        </div>
      </div>
    </div>
  )
}

export default App