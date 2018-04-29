#version 300 es
precision mediump float;
uniform sampler2D tex;
uniform float alpha;
in vec2 uv;
out vec4 color;

void main(void) {
    color = vec4(texture(tex, uv).rgb, alpha);
}