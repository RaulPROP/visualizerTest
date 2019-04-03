
precision highp float;

varying vec3 vColor;
varying float vDiscard;

void main()
{

  if (vDiscard == 1.0) {

    discard;

  }
  else {

    gl_FragColor = vec4(vColor, (1.0 - vDiscard));

  }

}
