# VisualizerTest

This angular repository tries to reproduce a bug that I'm having when trying to discard fragments with different InstancedGeometryBuffers in a scene.

The problem is that when I discard them, they look like they are flickering, not disappearing completely but showing some pixels with the same colors as the scene's background color.

## How to reproduce the issue

 -  First of all, **the bug seems to appear only on dedicated GPUs** (mainly NVIDIA)
 -  Click the second button in the top-left corner to add elements of the Figure2
 -  Click a couple of times the first button in the top-left corner to add elements of the Figure1
 -  Click the third button in the top-right corner to discard the Figure1 elements.

## What's suppose to happen?

The Figure1 elements discard it's fragments and they don't appear

## What actually happens?

Some Figure1 elements flickers and you can see some pixels with the background color. You can only see these pixels when they overlap with a Figure2 element (that is not discarded).

## Every button functionality

  - Top-Left
    - Add (figure1): Adds instances of the Figure1 Geometry
    - Add (figure2): Adds instances of the Figure2 Geometry
    
  - Top-Right
    - Toggles the background color of the scene
    - Toggles the scene that is currently rendering (the actual scene or the hover scene)
    - Show / Hide element1 instances
    - Show / Hide element2 instances
    
  - Bottom
    - Changes the Figure1 Geometry
    - Changes the Figure2 Geometry
