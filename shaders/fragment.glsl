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
varying vec2 vUv;
varying vec3 vPosition;

vec3 getRasterColor(float barPattern, float barIndex, bool isText) {
    float center = 1.0 - barPattern;
    center = pow(center, 1.5);
    
    float hue = barIndex / u_numBars;
    if (isText) {
        hue = fract(hue + u_colorShift);
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
    
    outerColor = outerColor * u_brightness;
    return mix(outerColor, vec3(1.0), center);
}

void main() {
    vec3 color = vec3(0.0);
    float maxBrightness = -1.0;
    
    float yPos;
    if (u_isText) {
        yPos = vPosition.y + 0.5;
    } else {
        yPos = vUv.y;
    }
    
    for (float i = 0.0; i < 24.0; i++) {
        if (i >= u_numBars) break;
        
        float phase = (i / u_numBars) * 3.14159;
        float sinePhase = phase * u_sineOffset;
        float yOffset = sin(u_time * u_barSpeed + sinePhase) * u_barOffset;
        
        float barY = 0.5 + yOffset;
        float distanceFromBar = abs(yPos - barY);
        
        if (distanceFromBar < u_barThickness) {
            float normalizedPattern = distanceFromBar / u_barThickness;
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