struct PointLight { position : vec3f, color : vec3f, }
struct LightStorage { pointCount : u32, point : array<PointLight>, }
