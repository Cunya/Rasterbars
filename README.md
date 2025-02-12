# Raster Bars Demo

A Three.js demo that creates a classic demoscene-style raster bars effect with a centered "Symbio" logo. The demo features smoothly animated color bars using GLSL shaders and 3D text with complementary colored bars.

![Demo Preview](preview.png)

## Features

- Smooth raster bar animations using GLSL shaders
- 12 independently moving color bars
- Gradient coloring with bright centers
- Centered 3D text with complementary colored bars
- Responsive design that adapts to window size

## Technical Details

### Stack
- Three.js for 3D rendering
- GLSL shaders for the raster bar effect
- Vite as the development server and bundler

### Implementation Details
- Uses orthographic camera for consistent 2D-style rendering
- Synchronized raster bars on both background and text
- HSV to RGB color conversion in shaders for smooth color transitions
- Custom UV coordinate generation for text geometry
- Depth-aware rendering with proper transparency

### Project Structure 