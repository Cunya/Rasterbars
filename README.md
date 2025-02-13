# Raster Bars Demo

An interactive WebGL demo featuring animated raster bars with customizable parameters and preset management.

## Features

- Customizable raster bar animations for both background and text
- Real-time parameter adjustment through GUI controls
- Preset system with:
  - Auto-cycling between presets with smooth transitions
  - Adjustable cycle period (5-120 seconds)
  - 15-second transitions between presets
  - Save/load/delete functionality
  - Built-in preset collection
  - Randomize function for parameter exploration
- Persistent storage of custom presets
- Color saturation controls
- Wave effects with adjustable amplitude, frequency, and phase
- Brightness-based overlapping option

## Controls

### Background & Text Controls
- Number of bars
- Bar speed
- Bar offset
- Bar thickness
- Brightness
- Contrast
- Saturation
- Color shift
- Sine offset
- Wave Amount (amplitude)
- Wave Speed (frequency)
- Wave Phase
- Brightness Based Overlapping
- Solid Black Background (text only)

### Preset Management
- Auto Cycle Presets: Toggle automatic cycling between presets
- Cycle Period: Adjust the time between preset changes (5-120 seconds)
- Randomize Values: Generate random parameter combinations
- Save Current as Preset: Save current settings as a new preset
- Individual preset controls:
  - Load: Apply the preset
  - Delete: Remove the preset

## Built-in Presets

1. Default: Initial parameter configuration
2. Neon Waves: High contrast, vibrant colors with wave motion
3. Soft Glow: Subtle, smooth transitions with gentle wave effects

## Usage

1. Open the controls panel using the "Open Controls" button
2. Adjust parameters in real-time using the GUI controls
3. Save interesting combinations as presets
4. Enable auto-cycling to automatically transition between presets
5. Use the randomize function to explore new combinations

## Technical Details

- Built with Three.js and dat.gui
- Uses WebGL shaders for efficient rendering
- Smooth parameter interpolation during transitions
- Local storage for preset persistence

**[View Live Demo](https://cunya.github.io/Rasterbars/)**

This project is part of a series of experiments in LLM-assisted code generation, developed entirely through conversation with Claude (Anthropic's Claude-3-Sonnet) using the Cursor editor.

![Demo Preview](preview.png)

## Development Process

This project demonstrates the capabilities of Large Language Models in creative coding:
- Complete implementation generated through natural language conversation
- Iterative refinement of shaders and controls
- Real-time problem solving and debugging
- Complex 3D graphics and shader programming
- Interactive parameter tuning and optimization

The entire codebase, including:
- GLSL shaders
- Three.js setup and integration
- GUI controls
- Parameter optimization
was developed through conversation with Claude-3-Sonnet.

## Technical Details

### Stack
- Three.js for 3D rendering
- GLSL shaders for the raster bar effect
- dat.GUI for real-time controls
- Vite as the development server and bundler

### Implementation Details
- Uses orthographic camera for consistent 2D-style rendering
- Independent shader parameters for text and background
- HSV to RGB color conversion in shaders
- World position based rendering for text bars
- UV coordinate based rendering for background bars
- Depth-aware rendering with proper transparency
- Choice between brightness-based or index-based bar overlapping
- Horizontal wave effects for dynamic movement

### Project Structure
```
project-root/
├── src/
│   ├── main.js           # Main application entry point
│   ├── shaders/
│   │   ├── background_vertex.glsl  # Background vertex shader
│   │   ├── text_vertex.glsl        # Text vertex shader
│   │   └── fragment.glsl          # Shared fragment shader for both materials
│   └── style.css         # Basic styling
├── index.html            # HTML entry point
├── package.json          # Project dependencies
└── vite.config.js       # Vite configuration
```

### Shader Implementation

The demo uses three GLSL shaders to create the raster bar effects:

#### Vertex Shaders
Both `background_vertex.glsl` and `text_vertex.glsl` handle:
- UV coordinate passing for texture mapping
- Position data for world-space calculations
- Standard vertex transformations

#### Fragment Shader
The shared `fragment.glsl` implements the raster bar effect with these key features:
- HSV to RGB color conversion for smooth color transitions
- Independent control of background and text bars
- Sine wave-based animation for bar movement
- Adjustable bar parameters (thickness, brightness, offset)
- Smooth bar edges using smoothstep
- Different coordinate spaces for background (UV) and text (world position)

## Installation

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/raster-bars-demo.git
cd raster-bars-demo
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### GitHub Pages Deployment

1. Add these scripts to your package.json:
```bash
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "deploy": "gh-pages -d dist"
}
```

2. Install gh-pages package:
```bash
npm install --save-dev gh-pages
```

3. Add base URL to vite.config.js:
```js
export default defineConfig({
  base: '/raster-bars-demo/', // Replace with your repo name
  // ... other config options
})
```

4. Build and deploy:
```bash
npm run build
npm run deploy
```

5. On GitHub:
   - Go to your repository settings
   - Navigate to "Pages"
   - Select "gh-pages" branch as source
   - Save changes

The demo will be available at: `https://yourusername.github.io/Rasterbars`

## Usage

1. The demo will start automatically with default parameters
2. Use the GUI controls in the top-right corner to adjust parameters:
   - Expand/collapse sections by clicking on the folders
   - Drag sliders to adjust values
   - Double-click values to enter them manually
   - Click the close button to hide the GUI

