export async function initGpu(canvas: HTMLCanvasElement) {
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })
  const device = await adapter!.requestDevice({
    requiredFeatures: ['shader-f16', 'timestamp-query'],
  })
  const context = canvas.getContext('webgpu')!
  context.configure({ device, format: navigator.gpu.getPreferredCanvasFormat() })
  return { device, context }
}
