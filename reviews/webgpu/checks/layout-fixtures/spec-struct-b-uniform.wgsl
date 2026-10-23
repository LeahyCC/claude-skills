struct A { u: f32, v: f32, w: vec2<f32>, @size(16) x: f32 }
struct B { a: vec2<f32>, b: vec3<f32>, c: f32, d: f32, @align(16) e: A, f: vec3<f32>, g: array<A, 3>, h: i32 }
