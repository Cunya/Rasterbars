uniform float u_time;
uniform vec2 u_resolution;
varying vec2 vUv;

vec3 getRasterColor(float barPattern, float barIndex) {
    // Create a single gradient peak at the center
    float center = 1.0 - barPattern; // Linear falloff from center
    center = pow(center, 1.5); // Adjust gradient shape
    
    // Create unique colors for each bar
    float hue = barIndex / 12.0; // Distribute hues evenly
    
    // Convert HSV to RGB (simplified)
    vec3 outerColor;
    float h = hue * 6.0;
    float i = floor(h);
    float f = h - i;
    float p = 0.0;
    float q = 1.0 - f;
    float t = f;

    if (i == 0.0) outerColor = vec3(1.0, t, p);
    else if (i == 1.0) outerColor = vec3(q, 1.0, p);
    else if (i == 2.0) outerColor = vec3(p, 1.0, t);
    else if (i == 3.0) outerColor = vec3(p, q, 1.0);
    else if (i == 4.0) outerColor = vec3(t, p, 1.0);
    else outerColor = vec3(1.0, p, q);
    
    // Adjust saturation and brightness
    outerColor = outerColor * 0.8 + 0.2;
    
    vec3 innerColor = vec3(1.0); // Keep white center
    
    return mix(outerColor, innerColor, center);
}

void main() {
    // Create bars that move independently
    float numBars = 20.0; // Number of bars
    vec3 color = vec3(0.0);
    float maxBrightness = 0.0;
    
    // Base Y position for all bars
    float baseY = 0.5; // Center of screen
    
    // Create 12 bars with different phases
    for (float i = 0.0; i < 12.0; i++) {
        // Calculate phase offset for each bar (distribute across 2π)
        float phase = (i / 12.0) * 6.28318;
        float yOffset = sin(u_time + phase) * 0.2;
        
        // Calculate position relative to base Y
        float barY = baseY + yOffset;
        float distanceFromBar = abs(vUv.y - barY);
        
        // Draw bar if within thickness range (halved from 0.02 to 0.01)
        if (distanceFromBar < 0.01) {
            float normalizedPattern = distanceFromBar / 0.01;
            vec3 barColor = getRasterColor(normalizedPattern, i);
            float brightness = (barColor.r + barColor.g + barColor.b) / 3.0;
            
            // Take the brighter color when bars overlap
            if (brightness > maxBrightness) {
                color = barColor;
                maxBrightness = brightness;
            }
        }
    }
    
    gl_FragColor = vec4(color, 1.0);
} 