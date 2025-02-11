uniform float u_time;
uniform vec2 u_resolution;
varying vec2 vUv;

void main() {
    // Create bars that move independently
    float numBars = 20.0; // Number of bars
    
    // Calculate sine wave movement
    float yOffset = sin(u_time) * 0.2; // Reduced amplitude for testing
    
    // Offset the vertical position
    float offsetY = vUv.y - yOffset;
    float barIndex = floor(offsetY * numBars);
    float bars = 0.0;
    
    if (barIndex == 10.0) {
        float barPattern = fract(offsetY * numBars);
        bars = step(0.4, barPattern) * step(barPattern, 0.6);
    }
    
    // Add some color variation
    vec3 color = vec3(0.0);
    color.r = bars * 0.8;
    color.g = bars * 0.6;
    color.b = bars * 0.9;
    
    gl_FragColor = vec4(color, 1.0);
} 