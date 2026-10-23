struct P {
  pos: vec3f,
  vel: vec3f,
}
@group(0) @binding(0) var<storage, read_write> particles: array<P>;

@compute @workgroup_size(64)
fn step(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i >= arrayLength(&particles)) { return; }
  particles[i].pos += particles[i].vel * 0.016;
}
