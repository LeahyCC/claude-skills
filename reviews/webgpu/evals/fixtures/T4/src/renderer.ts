export async function createMeshPipeline(device: GPUDevice, module: GPUShaderModule, format: GPUTextureFormat) {
  return device.createRenderPipelineAsync({
    layout: 'auto',
    vertex: { module, buffers: [{ arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] }] },
    fragment: { module, targets: [{ format }] },
    primitive: { cullMode: 'back' },
    depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' },
  })
}
