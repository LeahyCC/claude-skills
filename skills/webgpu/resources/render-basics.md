# Render basics

Everything a render pipeline needs beyond a shader: vertex layouts, depth, culling, blending, MSAA, and the coordinate rules that trip up WebGL ports. Sources are in [SOURCES.md](../SOURCES.md).

## Contents

- Coordinates, and porting from WebGL
- Vertex and index buffers
- Depth
- Culling
- Blending
- MSAA
- Video frames
- Checklist

## Coordinates, and porting from WebGL

| Space | WebGPU | WebGL |
| --- | --- | --- |
| Clip-space Z (after divide) | 0 to 1 | -1 to 1 |
| NDC Y | Up. Bottom-left is (-1, -1). | Up |
| Framebuffer and fragment Y | Down. Top-left pixel is (0, 0). | Up from the bottom |
| Texture (0, 0) | First texel in memory, the top row of an uploaded image | Bottom row, unless you set `UNPACK_FLIP_Y_WEBGL` |

WebGPU matches DirectX here, per the spec.

FAIL. A WebGL projection matrix maps depth to -1..1. Half the depth range is clipped away, and near objects vanish.

PASS. Use a projection built for 0..1. In `gl-matrix` that is `mat4.perspectiveZO`, not `mat4.perspective`. In three.js the WebGPU renderer handles it.

Other porting changes, from Chrome's "From WebGL to WebGPU":

- **No global state.** Everything a draw uses is in the pipeline, the bind groups, and the pass.
- **Buffers and textures cannot be resized.** Make a new one, copy, and destroy the old one.
- **No `generateMipmap`.** See [buffers-and-textures.md](./buffers-and-textures.md).
- **No uniform names.** Uniforms are bytes at offsets you choose. See [wgsl.md](./wgsl.md).
- **You own the canvas.** See [canvas.md](./canvas.md).

## Vertex and index buffers

A vertex buffer layout says how to read bytes into `@location` inputs.

```wgsl
struct VertexIn {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f,
}
```

```ts
// One interleaved buffer: position, normal, uv. 8 floats, 32 bytes per vertex.
const vertexLayout: GPUVertexBufferLayout = {
  arrayStride: 32,
  attributes: [
    { shaderLocation: 0, offset: 0, format: 'float32x3' },
    { shaderLocation: 1, offset: 12, format: 'float32x3' },
    { shaderLocation: 2, offset: 24, format: 'float32x2' },
  ],
}
```

Vertex attributes are not WGSL structs in memory. A `float32x3` takes 12 bytes here, with no 16-byte padding. The vec3 rule in [wgsl.md](./wgsl.md) applies to uniform and storage buffers, not to vertex buffers.

| Setting | Notes |
| --- | --- |
| `stepMode` | `'vertex'` by default. `'instance'` advances once per instance. |
| Index format | `'uint16'` or `'uint32'`, set in `setIndexBuffer`. Use 16-bit when the mesh has fewer than 65536 vertices. |
| Topology | `'triangle-list'` by default. Strip topologies need `stripIndexFormat` when indexed. |

For many objects, prefer one storage buffer indexed by `instance_index`. See [pipelines.md](./pipelines.md).

## Depth

There is no depth test unless you add a depth texture and a `depthStencil` state. Without it, later draws paint over earlier ones whatever their distance.

```ts
const depthFormat: GPUTextureFormat = 'depth24plus'

const pipeline = await device.createRenderPipelineAsync({
  label: 'mesh',
  layout,
  vertex: { module, buffers: [vertexLayout] },
  fragment: { module, targets: [{ format: canvasFormat }] },
  primitive: { cullMode: 'back' },
  depthStencil: {
    format: depthFormat,
    depthWriteEnabled: true, // required when the format has depth
    depthCompare: 'less',    // required when depth writes are on
  },
})

// Same size as the canvas. Rebuild on resize (see canvas.md).
const depth = device.createTexture({
  label: 'depth',
  size: [canvas.width, canvas.height],
  format: depthFormat,
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
})

const pass = encoder.beginRenderPass({
  colorAttachments: [colorAttachment],
  depthStencilAttachment: {
    view: depth.createView(),
    depthClearValue: 1,
    depthLoadOp: 'clear',
    depthStoreOp: 'discard', // nothing reads it after the pass
  },
})
```

- **Reversed Z.** For large scenes, clear depth to 0, compare with `'greater'`, and use a projection that maps near to 1. Float depth then keeps precision far away. The spec leaves which end is near to you. See the `reversedZ` sample.
- **Store op.** `'discard'` lets tiled mobile GPUs skip writing depth back to memory. Use `'store'` only when a later pass reads the depth.

## Culling

`cullMode` defaults to `'none'` and `frontFace` to `'ccw'`. Turn on `'back'` for closed meshes. If a mesh disappears when culling is on, its winding is clockwise. Flip `frontFace` rather than re-exporting it.

## Blending

No blend state means the fragment replaces the target. For transparency:

```ts
// Premultiplied alpha: the shader outputs rgb already multiplied by a.
const premultiplied: GPUBlendState = {
  color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
  alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
}

fragment: { module, targets: [{ format: canvasFormat, blend: premultiplied }] }
```

Use premultiplied blending when the canvas uses `alphaMode: 'premultiplied'`. Draw opaque objects first with depth writes on, then transparent objects back to front with depth writes off.

## MSAA

WebGPU supports a `sampleCount` of 1 or 4. Render into a 4-sample texture and resolve to the canvas texture.

```ts
const msaa = device.createTexture({
  label: 'msaa.color',
  size: [canvas.width, canvas.height],
  format: canvasFormat,
  sampleCount: 4,
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
})

// The pipeline must match: multisample: { count: 4 }.
// Its depth texture must also have sampleCount: 4.
const pass = encoder.beginRenderPass({
  colorAttachments: [
    {
      view: msaa.createView(),
      resolveTarget: context.getCurrentTexture().createView(),
      clearValue: [0, 0, 0, 1],
      loadOp: 'clear',
      storeOp: 'discard', // the resolved image is what we keep
    },
  ],
  depthStencilAttachment,
})
```

The MSAA texture, the pipeline, and the depth texture must all use the same sample count. The resolve target must have the same size and format as the MSAA view. Rebuild the MSAA texture on resize.

`alphaToCoverageEnabled: true` in the multisample state gives soft edges to cut-out foliage without sorting. The first color target must have an alpha channel and a blendable format.

## Video frames

`device.importExternalTexture({ source: video })` wraps a video frame without a copy. The shader reads it as `texture_external`, with `textureSampleBaseClampToEdge`.

From an `HTMLVideoElement`, the external texture expires in a task after you import it. Import it inside each frame, and make the bind group that holds it inside each frame too. From a WebCodecs `VideoFrame`, it expires when you close the frame.

```ts
function frame() {
  const external = device.importExternalTexture({ source: video })
  const group = device.createBindGroup({
    layout: videoLayout, // entry: { binding: 0, visibility: FRAGMENT, externalTexture: {} }
    entries: [
      { binding: 0, resource: external },
      { binding: 1, resource: sampler },
    ],
  })
  // ...draw with group...
  video.requestVideoFrameCallback(frame)
}
video.requestVideoFrameCallback(frame)
```

```wgsl
@group(0) @binding(0) var videoTex: texture_external;
@group(0) @binding(1) var videoSampler: sampler;

@fragment
fn fs(@location(0) uv: vec2f) -> @location(0) vec4f {
  return textureSampleBaseClampToEdge(videoTex, videoSampler, uv);
}
```

When to decode on a worker and how to keep audio in sync are in the `spa-performance` skill's audio-video resource.

## Checklist

- [ ] The projection maps depth to 0..1, not -1..1
- [ ] Vertex layouts use attribute offsets, with no WGSL padding
- [ ] Any 3D scene has a depth texture, rebuilt on resize
- [ ] Depth uses `'discard'` unless a later pass reads it
- [ ] Culling is on for closed meshes, and winding is checked
- [ ] Blend state matches the canvas `alphaMode`
- [ ] MSAA texture, pipeline, and depth texture share one sample count
- [ ] Video external textures and their bind groups are made each frame
