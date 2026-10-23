export async function setup(device: GPUDevice, module: GPUShaderModule, format: GPUTextureFormat, cameraBuffer: GPUBuffer) {
  const mesh = await device.createRenderPipelineAsync({
    layout: 'auto',
    vertex: { module, entryPoint: 'vsMesh' },
    fragment: { module, entryPoint: 'fsMesh', targets: [{ format }] },
  })
  const outline = await device.createRenderPipelineAsync({
    layout: 'auto',
    vertex: { module, entryPoint: 'vsOutline' },
    fragment: { module, entryPoint: 'fsOutline', targets: [{ format }] },
  })
  const camera = device.createBindGroup({
    layout: mesh.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: cameraBuffer } }],
  })
  return { mesh, outline, camera }
}

export function draw(pass: GPURenderPassEncoder, p: Awaited<ReturnType<typeof setup>>, count: number) {
  pass.setPipeline(p.mesh)
  pass.setBindGroup(0, p.camera)
  pass.draw(count)
  pass.setPipeline(p.outline)
  pass.setBindGroup(0, p.camera) // validation error here
  pass.draw(count)
}
