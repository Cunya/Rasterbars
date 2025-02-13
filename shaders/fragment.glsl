uniform float u_time;
uniform vec2 u_resolution;
uniform bool u_isText;
uniform float u_numBars;
uniform float u_barSpeed;
uniform float u_barOffset;
uniform float u_barThickness;
uniform float u_brightness;
uniform float u_sineOffset;
uniform float u_colorShift;
uniform float u_xWaveAmplitude;
uniform float u_xWaveFrequency;
uniform float u_xWaveOffset;
uniform float u_textXWaveAmplitude;
uniform float u_textXWaveFrequency;
uniform float u_textXWaveOffset;
uniform bool u_textSolidBlack;
uniform float u_contrast;
uniform bool u_useBrightness;
uniform float u_saturation;

varying vec2 vUv;
varying vec3 vPosition;

vec3 getRasterColor(float barPattern, float barIndex, bool isText) {
    float center = 1.0 - barPattern;
    center = pow(center, 1.5);
    
    float hue = barIndex / u_numBars;
    hue = fract(hue + u_colorShift);
    
    // Generate base color
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
    
    float brightness = isText ? u_brightness : u_brightness;
    float contrast = max(0.1, isText ? u_contrast : u_contrast);
    float saturation = max(0.0, isText ? u_saturation : u_saturation);
    
    // Create grayscale version
    float luminance = dot(outerColor, vec3(0.2126, 0.7152, 0.0722));
    vec3 grayscale = vec3(luminance);
    
    // Apply saturation to base color
    outerColor = mix(grayscale, outerColor, saturation);
    
    // Create center color with brightness
    vec3 centerColor = vec3(brightness);
    
    // Mix between outer and center colors
    vec3 color = mix(outerColor * brightness, centerColor, center);
    
    // Apply contrast
    color = pow(clamp(color, 0.001, 1.0), vec3(1.0 / max(0.001, contrast)));
    
    return clamp(color, 0.0, 1.0);
}

void main() {
    vec2 pos = u_isText ? vPosition.xy : vUv;
    float time = u_time * u_barSpeed;
    
    vec3 color = vec3(0.0);
    float maxValue = -1.0;  // Will store either brightness or index
    
    float yPos = u_isText ? (pos.y + 0.5) : pos.y;
    
    for (float i = 0.0; i < 96.0; i++) {
        if (i >= u_numBars) break;
        
        float phase = (i / u_numBars) * 3.14159;
        float sinePhase = phase * u_sineOffset;
        float yOffset = sin(time + sinePhase) * u_barOffset;
        
        float waveAmplitude = u_isText ? u_textXWaveAmplitude : u_xWaveAmplitude;
        float waveFrequency = u_isText ? u_textXWaveFrequency : u_xWaveFrequency;
        float wavePhase = u_isText ? u_textXWaveOffset : u_xWaveOffset;
        
        float barPhase = wavePhase * (i / u_numBars);
        float horizontalOffset = sin(pos.x * 3.14159 * 2.0 + time * waveFrequency + barPhase) * waveAmplitude;
        
        float barY = 0.5 + yOffset + horizontalOffset;
        float distanceFromBar = abs(yPos - barY);
        
        if (distanceFromBar < u_barThickness) {
            float normalizedPattern = distanceFromBar / u_barThickness;
            vec3 barColor = getRasterColor(normalizedPattern, i, u_isText);
            
            bool shouldUpdate;
            if (u_useBrightness) {
                float brightness = dot(barColor, vec3(0.299, 0.587, 0.114));
                shouldUpdate = brightness > maxValue;
            } else {
                shouldUpdate = i > maxValue;
            }
            
            if (shouldUpdate) {
                color = barColor;
                maxValue = u_useBrightness ? dot(barColor, vec3(0.299, 0.587, 0.114)) : i;
            }
        }
    }
    
    if (u_isText) {
        float alpha = maxValue > -1.0 ? 1.0 : (u_textSolidBlack ? 1.0 : 0.0);
        gl_FragColor = vec4(color, alpha);
    } else {
        gl_FragColor = vec4(color, 1.0);
    }
} 