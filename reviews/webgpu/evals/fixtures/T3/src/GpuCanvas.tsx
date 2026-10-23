'use client'
import { useEffect, useRef } from 'react'
import { createScene } from './scene'

export function GpuCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let raf = 0
    let device: GPUDevice

    async function init() {
      const adapter = await navigator.gpu.requestAdapter()
      device = await adapter!.requestDevice()
      const context = ref.current!.getContext('webgpu')!
      const format = navigator.gpu.getPreferredCanvasFormat()
      context.configure({ device, format })
      const scene = await createScene(device, format)
      const frame = () => {
        const encoder = device.createCommandEncoder()
        scene.encode(encoder, context.getCurrentTexture())
        device.queue.submit([encoder.finish()])
        raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)
    }
    init()

    return () => {
      cancelAnimationFrame(raf)
      device?.destroy()
    }
  }, [])

  return <canvas ref={ref} className="h-full w-full" />
}
