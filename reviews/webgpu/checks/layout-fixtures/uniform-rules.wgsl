struct S { x: f32 }
struct Invalid { a: S, b: f32 }
struct Valid { a: S, @align(16) b: f32 }
struct Mats { m3: mat3x3f, m4: mat4x4<f32>, h: vec3h, bad: array<f32, 8> }
