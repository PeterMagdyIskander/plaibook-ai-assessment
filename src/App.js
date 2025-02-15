"use client"

import { useRef, useState, useEffect } from "react"
import "./App.css"

function App() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const handleVideoUpload = (event) => {
    const file = event.target.files[0]
    if (file && videoRef.current) {
      const videoUrl = URL.createObjectURL(file)
      videoRef.current.src = videoUrl
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
  }, [])

  const processVideo = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    let frameCount = 0

    const drawFrame = () => {
      if (video.paused || video.ended) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const currentTime = video.currentTime

      const redShapePoints = [
        {
          x: 400 + Math.sin(currentTime * 0.8) * 150, 
          y: 300 + Math.cos(currentTime * 0.8) * 100
        },
        {
          x: 400 + Math.sin(currentTime * 0.8 + Math.PI / 2) * 150,
          y: 300 + Math.cos(currentTime * 0.8 + Math.PI / 2) * 100
        },
        {
          x: 400 + Math.sin(currentTime * 0.8 + Math.PI) * 150,
          y: 300 + Math.cos(currentTime * 0.8 + Math.PI) * 100
        },
        {
          x: 400 + Math.sin(currentTime * 0.8 + 3 * Math.PI / 2) * 150,
          y: 300 + Math.cos(currentTime * 0.8 + 3 * Math.PI / 2) * 100
        },
        {
          x: 400 + Math.sin(currentTime * 0.8) * 150,
          y: 300 + Math.cos(currentTime * 0.8) * 100
        },
      ];

      const blueShapePoints = [
        {
          x: 400 + Math.sin(currentTime) * 50,  
          y: 250 + Math.cos(currentTime) * 30   
        },
        {
          x: 400 + Math.sin(currentTime) * 50,
          y: 250 - Math.cos(currentTime) * 30
        },
        {
          x: 400 - Math.sin(currentTime) * 50,
          y: 250 - Math.cos(currentTime) * 30
        },
        {
          x: 400 - Math.sin(currentTime) * 50,
          y: 250 + Math.cos(currentTime) * 30
        },
      ];

      
      drawShape(ctx, redShapePoints, "rgba(255, 0, 0, 0.5)", "rgba(255, 0, 0, 0.8)")

      drawShape(ctx, blueShapePoints, "rgba(0, 0, 255, 0.5)", "rgba(0, 0, 255, 0.8)")

      requestAnimationFrame(drawFrame)
    }

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

    points.forEach((point) => {
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
      <h1>Video Shape App</h1>
      <input type="file" accept="video/*" onChange={handleVideoUpload} />
      <br />
      <button onClick={processVideo}>Process Video</button>
      <br />
      <div style={{ display: "flex" }}>
        <div>
          <h3>Original Video</h3>
          <video ref={videoRef} controls style={{ width: "400px" }} />
        </div>
        <div>
          <h3>Processed Video</h3>
          <canvas ref={canvasRef} style={{ width: "400px", border: "1px solid black" }} />
        </div>
      </div>
    </div>
  )
}

export default App

