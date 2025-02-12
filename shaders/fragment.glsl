uniform float u_time;
uniform vec2 u_resolution;
uniform bool u_isText;
varying vec2 vUv;
varying vec3 vPosition;

vec3 getRasterColor(float barPattern, float barIndex, bool isText) {
    float center = 1.0 - barPattern;
    center = pow(center, 1.5);
    
    float hue = barIndex / 12.0;
    if (isText) {
        hue = fract(hue + 0.5);
    }
    
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
    
    if (isText) {
        outerColor = outerColor * 0.8;
        return mix(outerColor, vec3(1.0), center);
    } else {
        outerColor = outerColor * 0.4;
        return mix(outerColor, vec3(0.9), center);
    }
}

void main() {
    vec3 color = vec3(0.0);
    float maxBrightness = -1.0;
    
    // Use different coordinate systems for text and background
    float yPos;
    if (u_isText) {
        yPos = vPosition.y + 0.5;
    } else {
        yPos = vUv.y;
    }
    
    for (float i = 0.0; i < 12.0; i++) {
        float phase = (i / 12.0) * 3.14159;
        float yOffset = sin(u_time * 0.5 + phase) * 0.2;
        
        float barY = 0.5 + yOffset;
        float distanceFromBar = abs(yPos - barY);
        float thickness = u_isText ? 0.02 : 0.01;
        
        if (distanceFromBar < thickness) {
            float normalizedPattern = distanceFromBar / thickness;
            vec3 barColor = getRasterColor(normalizedPattern, i, u_isText);
            float brightness = dot(barColor, vec3(0.299, 0.587, 0.114));
            
            if (brightness > maxBrightness) {
                color = barColor;
                maxBrightness = brightness;
            }
        }
    }
    
    if (u_isText) {
        gl_FragColor = vec4(color, maxBrightness > -1.0 ? 1.0 : 0.0);
    } else {
        gl_FragColor = vec4(color, 1.0);
    }
} 