# Raster Bars Demo

A Three.js demo that creates a classic demoscene-style raster bars effect with a centered "Symbio" logo. The demo features independently controlled raster bars for both background and text, with real-time parameter adjustment.

**[View Live Demo](https://cunya.github.io/Rasterbars/)**

This project is part of a series of experiments in LLM-assisted code generation, developed entirely through conversation with Claude (Anthropic's Claude-3-Sonnet) using the Cursor editor.

![Demo Preview](preview.png)

## Features

- Independent raster bar controls for background and text
- Real-time parameter adjustment via GUI controls
- Smooth sine wave animations with configurable offsets
- Gradient coloring with adjustable brightness and contrast
- Horizontal wave effects for dynamic movement
- Choice between brightness-based or index-based bar overlapping
- Centered 3D text with complementary colors
- Responsive design that adapts to window size

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

## Controls

### Background Bars
- Number of bars (default: 30, range: 1-96)
- Animation speed (default: 0.43, range: 0.1-2.0)
- Bar offset (default: 0.46, range: 0.05-0.5)
- Bar thickness (default: 0.007, range: 0.005-0.05)
- Brightness (default: 0.791, range: 0.01-1.0)
- Contrast (default: 1.0, range: 0.1-3.0)
- Color shift (default: 1.0, range: 0.0-1.0)
- Sine offset (default: 0.46, range: 0.0-1.0)
- Wave Amount (default: 0.01, range: 0.0-1.2)
- Wave Speed (default: 8.0, range: 0.1-8.0)
- Wave Phase (default: 6.0, range: 0.0-6.28)
- Brightness Based Overlapping (default: false)

### Text Bars
- Number of bars (default: 31, range: 1-96)
- Animation speed (default: 0.89, range: 0.1-2.0)
- Bar offset (default: 0.2, range: 0.05-0.5)
- Bar thickness (default: 0.025, range: 0.005-0.05)
- Brightness (default: 0.889, range: 0.01-1.0)
- Contrast (default: 1.1, range: 0.1-3.0)
- Color shift (default: 1.0, range: 0.0-1.0)
- Sine offset (default: 1.0, range: 0.0-1.0)
- Wave Amount (default: 0.07, range: 0.0-1.2)
- Wave Speed (default: 0.5, range: 0.1-8.0)
- Wave Phase (default: 6.0, range: 0.0-6.28)
- Solid Black Background (default: true)
- Brightness Based Overlapping (default: false)

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

