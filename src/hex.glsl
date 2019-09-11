varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform 

void main(){
    // gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    gl_FragColor = texture2D(uSampler, vTextureCoord);

    // if (gl_FragColor.r > 0.5) {
    //     gl_FragColor.rgb = vec3(1.0);
    // }

}