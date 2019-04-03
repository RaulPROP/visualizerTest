
precision highp float;


uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform vec3 cameraPosition;
uniform float sceneRadius;
uniform float radius;
uniform float showingOne;
uniform float showingTwo;

attribute vec3 position;

attribute vec3 offset;
attribute vec3 color;
attribute float size;
attribute float nodeType;

varying vec3 vColor;
varying float vDiscard; // [0.. 1] => if 1.0 -> discard; else: opacity = 1.0 - vDiscard;

float distanceToCamera(vec3 myPos)
{

  float dist = sqrt(
  ((myPos.x - cameraPosition.x) * (myPos.x - cameraPosition.x)) +
  ((myPos.y - cameraPosition.y) * (myPos.y - cameraPosition.y)) +
  ((myPos.z - cameraPosition.z) * (myPos.z - cameraPosition.z))
  );

  return dist;

}

float getTransparency(float distance)
{

  float minRange = 2000.0;
  float maxRange = 4000.0;

  if (distance > maxRange) {

    return 0.0;

  }
  else {

    if (distance < minRange) {

      return 1.0;

    }
    else {

      return 1.0 - ((distance - minRange) / (maxRange - minRange));

    }

  }

}

float pow2(float base)
{
  return base * base;
}

void main()
{

  vColor = color;
  vDiscard = 0.0;

  if ((nodeType == 1.0) && (showingOne == 0.0)) {
    vDiscard = 1.0;
  } else if ((nodeType == 2.0) && (showingTwo == 0.0)) {
    vDiscard = 1.0;
  }

  if (vDiscard < 1.0) {

    float distanceToCamera = distance(offset * radius, cameraPosition.xyz);

    float transparency = getTransparency(distanceToCamera);

    if (transparency > 0.0) {

      transparency = 1.0;

    }

    vDiscard = 1.0 - transparency;

  }

  // translation

  mat4 translationMatrix = mat4(
  vec4(1.0,      0.0,      0.0,      0.0),
  vec4(0.0,      1.0,      0.0,      0.0),
  vec4(0.0,      0.0,      1.0,      0.0),
  vec4(offset.x * radius, offset.y * radius, offset.z * radius, 1.0)
  );

  // scale

  float scale_aux = distance(vec3(0), offset);

  mat4 scaleMatrix = mat4(
  vec4(size * scale_aux, 0.0,   0.0,   0.0),
  vec4(0.0,   size * scale_aux, 0.0,   0.0),
  vec4(0.0,   0.0,   size * scale_aux, 0.0),
  vec4(0.0,   0.0,   0.0,   1.0)
  );

  mat4 vPosition = translationMatrix * scaleMatrix;

  gl_Position = projectionMatrix * modelViewMatrix * vPosition * vec4(position.xyz, 1.0);

}
