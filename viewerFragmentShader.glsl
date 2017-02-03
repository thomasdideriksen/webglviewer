precision mediump float;
uniform sampler2D Texture;
varying vec2 TexCoord;
uniform float Alpha;

void main(void) {
    gl_FragColor = vec4(texture2D(Texture, TexCoord).rgb, Alpha);
}