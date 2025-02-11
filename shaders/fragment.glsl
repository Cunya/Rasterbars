uniform float u_time;
uniform vec2 u_resolution;
varying vec2 vUv;

void main() {
    // Create bars that move independently
    float numBars = 20.0; // Number of bars
    float barIndex = floor(vUv.y * numBars); // Which bar we're currently rendering
    
    // Calculate vertical offset for each bar
    // Phase offset based on bar position
    float phaseOffset = barIndex * 0.5;
    float yOffset = sin(u_time * 2.0 + phaseOffset) * 0.1;
    
    // Create the bar pattern
    float barPattern = fract(vUv.y * numBars);
    float bar = smoothstep(0.4, 0.6, barPattern);
    
    // Apply the vertical offset
    float offsetY = vUv.y + yOffset;
    float bars = step(0.4, fract(offsetY * numBars));
    
    // Add some color variation
    vec3 color = vec3(0.0);
    color.r = bars * (sin(barIndex * 0.5) * 0.5 + 0.5);
    color.g = bars * (cos(barIndex * 0.3) * 0.5 + 0.5);
    color.b = bars * (sin(barIndex * 0.7) * 0.5 + 0.5);
    
    gl_FragColor = vec4(color, 1.0);
} 