const canvas = document.querySelector('canvas')!
const adapter = (await navigator.gpu.requestAdapter())!
const device = await adapter.requestDevice()
const context = canvas.getContext('webgpu')!
const format = navigator.gpu.getPreferredCanvasFormat()
context.configure({ device, format })

const module = device.createShaderModule({
  code: /* wgsl */ `
    struct U { color: vec4f }
    @group(0) @binding(0) var<uniform> u: U;
    @vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
      var p = array(vec2f(0, 0.5), vec2f(-0.5, -0.5), vec2f(0.5, -0.5));
      return vec4f(p[i], 0, 1);
    }
    @fragment fn fs() -> @location(0) vec4f { return u.color; }
  `,
})

const uniforms = device.createBuffer({
  size: 16,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
})
device.queue.writeBuffer(uniforms, 0, new Float32Array([1, 0, 0, 1]))

const pipeline = device.createRenderPipeline({
  layout: 'auto',
  vertex: { module },
  fragment: { module, targets: [{ format }] },
})
const group = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0),
  entries: [{ binding: 0, resource: { buffer: uniforms } }],
})

function frame() {
  const encoder = device.createCommandEncoder()
  const pass = encoder.beginRenderPass({
    colorAttachments: [{ view: context.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1] }],
  })
  pass.setPipeline(pipeline)
  pass.setBindGroup(0, group)
  pass.draw(3)
  pass.end()
  device.queue.submit([encoder.finish()])
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
