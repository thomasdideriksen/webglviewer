attribute vec4 PositionTexCoord;
varying vec2 TexCoord;
uniform mat3 Matrix;

void main(void) {
    TexCoord = PositionTexCoord.zw;
    vec3 pos = Matrix * vec3(PositionTexCoord.xy, 1.0);
    gl_Position = vec4(pos.xy, 0.0, 1.0);
}