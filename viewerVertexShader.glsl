#version 300 es
uniform mat3 matrix;
in vec4 data;
out vec2 uv;

void main(void) {
    uv = data.zw;
    vec3 pos = matrix * vec3(data.xy, 1.0);
    gl_Position = vec4(pos.xy, 0.0, 1.0);
}