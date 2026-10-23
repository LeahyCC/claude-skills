import { mat4 } from 'gl-matrix'

// Ported from our WebGL renderer unchanged.
export function viewProjection(aspect: number, eye: [number, number, number]) {
  const proj = mat4.create()
  mat4.perspective(proj, Math.PI / 4, aspect, 0.1, 100)
  const view = mat4.lookAt(mat4.create(), eye, [0, 0, 0], [0, 1, 0])
  return mat4.multiply(mat4.create(), proj, view)
}
