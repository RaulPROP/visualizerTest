
precision highp float;


uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform vec3 cameraPosition;
uniform float sceneRadius;
uniform float hoveredIndex;
uniform float radius;
uniform float dark;
uniform float showingOne;
uniform float showingTwo;

attribute vec3 position;

attribute vec3 offset;
attribute vec3 color;
attribute float size;
attribute float nodeType;
attribute float nodeIndex;

varying vec3 vColor;
varying float vDiscard;

float distanceToCamera(vec3 myPos)
{

  float dist = sqrt(
  ((myPos.x - cameraPosition.x) * (myPos.x - cameraPosition.x)) +
  ((myPos.y - cameraPosition.y) * (myPos.y - cameraPosition.y)) +
  ((myPos.z - cameraPosition.z) * (myPos.z - cameraPosition.z))
  );

  return dist;

}

float getTransparency(float distance, float nodeType)
{

  if (nodeType <= 2.0) {

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
  else {

    return 1.0;

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

  if (vDiscard == 0.0) {

    float distanceToCamera = distance(offset * radius, cameraPosition.xyz);

    float transparency = getTransparency(distanceToCamera, nodeType);

    vDiscard = 1.0 - transparency;

    if (hoveredIndex == nodeIndex) {

      vDiscard = 0.0;

      if (dark == 1.0) {
        vColor = vec3(1.0, 1.0, 1.0);
      } else {
        vColor = vec3(0.16862745098039217, 0.16862745098039217, 0.16862745098039217);
      }

    }

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

  if (nodeType > 2.0) {

    scale_aux = 1.0;
    vDiscard = 0.0;

    translationMatrix = mat4(
    vec4(1.0,      0.0,      0.0,      0.0),
    vec4(0.0,      1.0,      0.0,      0.0),
    vec4(0.0,      0.0,      1.0,      0.0),
    vec4(offset.x, offset.y, offset.z, 1.0)
    );

  }

  mat4 scaleMatrix = mat4(
    vec4(size * scale_aux, 0.0,   0.0,   0.0),
    vec4(0.0,   size * scale_aux, 0.0,   0.0),
    vec4(0.0,   0.0,   size * scale_aux, 0.0),
    vec4(0.0,   0.0,   0.0,   1.0)
  );

  mat4 vPosition = translationMatrix * scaleMatrix;

  gl_Position = projectionMatrix * modelViewMatrix * vPosition * vec4(position.xyz, 1.0);

}
