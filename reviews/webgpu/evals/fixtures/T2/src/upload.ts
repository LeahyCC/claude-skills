export function uploadParticles(device: GPUDevice, buffer: GPUBuffer, ps: { pos: number[]; vel: number[] }[]) {
  const data = new Float32Array(ps.length * 6)
  ps.forEach((p, i) => {
    data.set(p.pos, i * 6)
    data.set(p.vel, i * 6 + 3)
  })
  device.queue.writeBuffer(buffer, 0, data)
}

export function particleBufferSize(count: number) {
  return count * 6 * 4
}
