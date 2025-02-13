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

varying vec2 vUv;
varying vec3 vPosition;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec2 pos = u_isText ? vPosition.xy : vUv;
    float time = u_time * u_barSpeed;
    
    // Simple horizontal wave based on x position
    float horizontalOffset = sin(pos.x * 3.14159 * 2.0) * u_xWaveAmplitude;
    float verticalWave = sin(time * u_xWaveFrequency) * u_xWaveAmplitude;
    
    // Combine both waves
    float finalOffset = horizontalOffset * verticalWave;
    
    // Apply the offset to the vertical position
    float verticalPos = pos.y + finalOffset;
    
    float bars = floor(verticalPos * u_numBars) / u_numBars;
    float yOffset = sin(time + bars * u_sineOffset * 6.28318) * u_barOffset;
    float bar = fract((verticalPos + yOffset) * u_numBars);
    
    float brightness = smoothstep(0.5 - u_barThickness, 0.5, bar) * 
                      (1.0 - smoothstep(0.5, 0.5 + u_barThickness, bar));
    
    brightness *= u_brightness;
    
    float hue = u_isText ? (1.0 - fract(time * 0.1 + u_colorShift)) : fract(time * 0.1 + u_colorShift);
    vec3 color = hsv2rgb(vec3(hue, 1.0, brightness));
    
    gl_FragColor = vec4(color, brightness);
} 