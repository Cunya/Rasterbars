import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import * as dat from 'dat.gui';

// Import shaders directly
import backgroundVertexShader from './shaders/background_vertex.glsl?raw'
import textVertexShader from './shaders/text_vertex.glsl?raw'
import fragmentShader from './shaders/fragment.glsl?raw'

class RasterBarsDemo {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.params = {
            // Background parameters
            bgNumBars: 30,
            bgBarSpeed: 0.43,
            bgBarOffset: 0.46,
            bgBarThickness: 0.007,
            bgBrightness: 0.791,
            bgContrast: 1.0,
            bgSaturation: 1.0,
            bgSineOffset: 0.46,
            bgColorShift: 1.0,
            bgUseBrightness: false,
            // Background x-wave parameters
            bgXWaveAmplitude: 0.01,
            bgXWaveFrequency: 8.0,
            bgXWaveOffset: 6.0,
            
            // Text parameters
            textNumBars: 31,
            textBarSpeed: 0.89,
            textBarOffset: 0.2,
            textBarThickness: 0.025,
            textBrightness: 0.889,
            textContrast: 1.1,
            textSaturation: 1.0,
            textSineOffset: 1.0,
            textColorShift: 1.0,
            textUseBrightness: false,
            // Text x-wave parameters
            textXWaveAmplitude: 0.07,
            textXWaveFrequency: 0.5,
            textXWaveOffset: 6.0,
            textSolidBlack: true,
            
            // Remove unused parameters
            xWaveAmplitude: 0.1,
            xWaveFrequency: 0.5
        };
        
        this.gui = null;
        this.presets = this.loadPresets();
        this.currentPresetIndex = 0;
        this.isTransitioning = false;
        this.cyclePresets = true;
        this.animateValues = false;
        this.lastTransitionTime = 0;
        this.cyclePeriod = 30; // Default cycle period in seconds
        this.transitionDuration = 15000; // 15 second transition
        this.cycleWaitDuration = 15000; // Initial wait duration (will be updated by setCyclePeriod)
        this.transitionStartParams = null;
        this.cycleTimeoutId = null;
        this.guiVisible = false;
        
        this.setup();
        this.createScene();
        this.loadText();
        this.setupGUI();
        this.animate();
        
        // Start cycling immediately if enabled
        if (this.cyclePresets && this.presets.length > 1) {
            setTimeout(() => {
                this.loadPreset(1); // Start with the second preset
            }, this.cycleWaitDuration); // Use cycleWaitDuration instead of 1000ms
        }
    }

    setup() {
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        this.camera.position.z = 1;

        this.scene = new THREE.Scene();

        window.addEventListener('resize', () => this.onResize());
    }

    createScene() {
        const geometry = new THREE.PlaneGeometry(2, 2);
        const backgroundMaterial = this.createMaterial(false);
        this.mesh = new THREE.Mesh(geometry, backgroundMaterial);
        this.scene.add(this.mesh);
    }

    createMaterial(isText) {
        return new THREE.ShaderMaterial({
            uniforms: {
                u_time: { value: 0 },
                u_resolution: { value: new THREE.Vector2() },
                u_isText: { value: isText },
                u_numBars: { value: isText ? this.params.textNumBars : this.params.bgNumBars },
                u_barSpeed: { value: isText ? this.params.textBarSpeed : this.params.bgBarSpeed },
                u_barOffset: { value: isText ? this.params.textBarOffset : this.params.bgBarOffset },
                u_barThickness: { value: isText ? this.params.textBarThickness : this.params.bgBarThickness },
                u_brightness: { value: isText ? this.params.textBrightness : this.params.bgBrightness },
                u_sineOffset: { value: isText ? this.params.textSineOffset : this.params.bgSineOffset },
                u_colorShift: { value: isText ? this.params.textColorShift : this.params.bgColorShift },
                u_xWaveAmplitude: { value: this.params.bgXWaveAmplitude },
                u_xWaveFrequency: { value: this.params.bgXWaveFrequency },
                u_xWaveOffset: { value: this.params.bgXWaveOffset },
                u_textXWaveAmplitude: { value: this.params.textXWaveAmplitude },
                u_textXWaveFrequency: { value: this.params.textXWaveFrequency },
                u_textXWaveOffset: { value: this.params.textXWaveOffset },
                u_textSolidBlack: { value: this.params.textSolidBlack },
                u_contrast: { value: isText ? this.params.textContrast : this.params.bgContrast },
                u_saturation: { value: isText ? this.params.textSaturation : this.params.bgSaturation },
                u_useBrightness: { value: isText ? this.params.textUseBrightness : this.params.bgUseBrightness }
            },
            vertexShader: isText ? textVertexShader : backgroundVertexShader,
            fragmentShader: fragmentShader,
            transparent: isText,
            side: THREE.DoubleSide,
            depthWrite: isText,
            depthTest: true
        });
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.renderer.setSize(width, height);
        this.mesh.material.uniforms.u_resolution.value.set(width, height);
        if (this.textMesh) {
            this.textMesh.material.uniforms.u_resolution.value.set(width, height);
        }
    }

    async loadText() {
        const loader = new FontLoader();
        
        // Load a font
        const font = await new Promise((resolve) => {
            loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', resolve);
        });

        // Create text geometry
        const textGeometry = new TextGeometry('Symbio', {
            font: font,
            size: 0.2,
            height: 0.05,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.01,
            bevelSize: 0.005,
            bevelOffset: 0,
            bevelSegments: 5
        });

        // Compute UVs for the text geometry
        textGeometry.computeVertexNormals();
        textGeometry.computeBoundingBox();
        const textBounds = textGeometry.boundingBox;
        const textWidth = textBounds.max.x - textBounds.min.x;
        const textHeight = textBounds.max.y - textBounds.min.y;

        // Create material and mesh
        const textMaterial = this.createMaterial(true);
        this.textMesh = new THREE.Mesh(textGeometry, textMaterial);
        
        // Adjust text position to align with background coordinates
        this.textMesh.position.x = -textWidth / 2;
        this.textMesh.position.y = -textHeight / 2;
        this.textMesh.position.z = 0.1;

        this.scene.add(this.textMesh);
    }

    setupGUI() {
        const gui = new dat.GUI({ autoPlace: false });
        this.gui = gui;
        gui.domElement.style.position = 'absolute';
        gui.domElement.style.top = '30px';
        gui.domElement.style.right = '2px';
        document.body.appendChild(gui.domElement);
        
        // Add custom close button
        const closeButton = document.createElement('div');
        closeButton.className = 'custom-close-button';
        closeButton.style.cssText = `
            position: absolute;
            right: 70px;
            top: 10px;
            color: white;
            cursor: pointer;
            padding: 5px;
            z-index: 1001;
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 14px;
        `;
        closeButton.textContent = 'Open Controls';
        document.body.appendChild(closeButton);

        // Hide GUI initially
        gui.domElement.style.display = 'none';

        // Hide the default close button after a short delay
        setTimeout(() => {
            const defaultCloseButton = gui.domElement.querySelector('.close-button');
            if (defaultCloseButton) {
                defaultCloseButton.style.display = 'none';
            }
        }, 100);

        closeButton.addEventListener('click', () => {
            this.guiVisible = !this.guiVisible;
            gui.domElement.style.display = this.guiVisible ? 'block' : 'none';
            closeButton.textContent = this.guiVisible ? 'Close Controls' : 'Open Controls';
        });
        
        // Set initial visibility
        gui.domElement.style.display = this.guiVisible ? 'block' : 'none';
        
        // Background controls
        const bgFolder = gui.addFolder('Background Bars');
        bgFolder.add(this.params, 'bgNumBars', 1, 96, 1).onChange(() => this.updateUniforms());
        bgFolder.add(this.params, 'bgBarSpeed', 0.1, 2.0).onChange(() => this.updateUniforms());
        bgFolder.add(this.params, 'bgBarOffset', 0.05, 0.5).onChange(() => this.updateUniforms());
        bgFolder.add(this.params, 'bgBarThickness', 0.005, 0.05).onChange(() => this.updateUniforms());
        bgFolder.add(this.params, 'bgBrightness', 0.01, 1.0).onChange(() => this.updateUniforms());
        bgFolder.add(this.params, 'bgContrast', 0.1, 3.0).onChange(() => this.updateUniforms());
        bgFolder.add(this.params, 'bgSaturation', 0.0, 2.0).onChange(() => this.updateUniforms());
        bgFolder.add(this.params, 'bgColorShift', 0.0, 1.0).onChange(() => this.updateUniforms());
        bgFolder.add(this.params, 'bgSineOffset', 0.0, 1.0).onChange(() => this.updateUniforms());
        bgFolder.add(this.params, 'bgXWaveAmplitude', 0.0, 1.2).name('Wave Amount').onChange(() => this.updateUniforms());
        bgFolder.add(this.params, 'bgXWaveFrequency', 0.1, 8.0).name('Wave Speed').onChange(() => this.updateUniforms());
        bgFolder.add(this.params, 'bgXWaveOffset', 0.0, 6.28).name('Wave Phase').onChange(() => this.updateUniforms());
        bgFolder.add(this.params, 'bgUseBrightness').name('Brightness Based Overlapping').onChange(() => this.updateUniforms());
        bgFolder.open();

        // Text controls
        const textFolder = gui.addFolder('Text Bars');
        textFolder.add(this.params, 'textNumBars', 1, 96, 1).onChange(() => this.updateUniforms());
        textFolder.add(this.params, 'textBarSpeed', 0.1, 2.0).onChange(() => this.updateUniforms());
        textFolder.add(this.params, 'textBarOffset', 0.05, 0.5).onChange(() => this.updateUniforms());
        textFolder.add(this.params, 'textBarThickness', 0.005, 0.05).onChange(() => this.updateUniforms());
        textFolder.add(this.params, 'textBrightness', 0.01, 1.0).onChange(() => this.updateUniforms());
        textFolder.add(this.params, 'textContrast', 0.1, 3.0).onChange(() => this.updateUniforms());
        textFolder.add(this.params, 'textSaturation', 0.0, 2.0).onChange(() => this.updateUniforms());
        textFolder.add(this.params, 'textColorShift', 0.0, 1.0).onChange(() => this.updateUniforms());
        textFolder.add(this.params, 'textSineOffset', 0.0, 1.0).onChange(() => this.updateUniforms());
        textFolder.add(this.params, 'textXWaveAmplitude', 0.0, 1.2).name('Wave Amount').onChange(() => this.updateUniforms());
        textFolder.add(this.params, 'textXWaveFrequency', 0.1, 8.0).name('Wave Speed').onChange(() => this.updateUniforms());
        textFolder.add(this.params, 'textXWaveOffset', 0.0, 6.28).name('Wave Phase').onChange(() => this.updateUniforms());
        textFolder.add(this.params, 'textSolidBlack').name('Solid Black Background').onChange(() => this.updateUniforms());
        textFolder.add(this.params, 'textUseBrightness').name('Brightness Based Overlapping').onChange(() => this.updateUniforms());
        textFolder.open();

        // Presets controls
        const presetsFolder = gui.addFolder('Presets');
        presetsFolder.open();
        this.updatePresetFolder();
    }

    updateUniforms() {
        // Update background uniforms
        this.mesh.material.uniforms.u_numBars.value = this.params.bgNumBars;
        this.mesh.material.uniforms.u_barSpeed.value = this.params.bgBarSpeed;
        this.mesh.material.uniforms.u_barOffset.value = this.params.bgBarOffset;
        this.mesh.material.uniforms.u_barThickness.value = this.params.bgBarThickness;
        this.mesh.material.uniforms.u_brightness.value = this.params.bgBrightness;
        this.mesh.material.uniforms.u_sineOffset.value = this.params.bgSineOffset;
        this.mesh.material.uniforms.u_colorShift.value = this.params.bgColorShift;
        this.mesh.material.uniforms.u_xWaveAmplitude.value = this.params.bgXWaveAmplitude;
        this.mesh.material.uniforms.u_xWaveFrequency.value = this.params.bgXWaveFrequency;
        this.mesh.material.uniforms.u_xWaveOffset.value = this.params.bgXWaveOffset;
        this.mesh.material.uniforms.u_textXWaveAmplitude.value = this.params.textXWaveAmplitude;
        this.mesh.material.uniforms.u_textXWaveFrequency.value = this.params.textXWaveFrequency;
        this.mesh.material.uniforms.u_textXWaveOffset.value = this.params.textXWaveOffset;
        this.mesh.material.uniforms.u_textSolidBlack.value = this.params.textSolidBlack;
        this.mesh.material.uniforms.u_contrast.value = this.params.bgContrast;
        this.mesh.material.uniforms.u_saturation.value = this.params.bgSaturation;
        this.mesh.material.uniforms.u_useBrightness.value = this.params.bgUseBrightness;

        // Update text uniforms if text mesh exists
        if (this.textMesh) {
            this.textMesh.material.uniforms.u_numBars.value = this.params.textNumBars;
            this.textMesh.material.uniforms.u_barSpeed.value = this.params.textBarSpeed;
            this.textMesh.material.uniforms.u_barOffset.value = this.params.textBarOffset;
            this.textMesh.material.uniforms.u_barThickness.value = this.params.textBarThickness;
            this.textMesh.material.uniforms.u_brightness.value = this.params.textBrightness;
            this.textMesh.material.uniforms.u_sineOffset.value = this.params.textSineOffset;
            this.textMesh.material.uniforms.u_colorShift.value = this.params.textColorShift;
            this.textMesh.material.uniforms.u_xWaveAmplitude.value = this.params.bgXWaveAmplitude;
            this.textMesh.material.uniforms.u_xWaveFrequency.value = this.params.bgXWaveFrequency;
            this.textMesh.material.uniforms.u_xWaveOffset.value = this.params.bgXWaveOffset;
            this.textMesh.material.uniforms.u_textXWaveAmplitude.value = this.params.textXWaveAmplitude;
            this.textMesh.material.uniforms.u_textXWaveFrequency.value = this.params.textXWaveFrequency;
            this.textMesh.material.uniforms.u_textXWaveOffset.value = this.params.textXWaveOffset;
            this.textMesh.material.uniforms.u_textSolidBlack.value = this.params.textSolidBlack;
            this.textMesh.material.uniforms.u_contrast.value = this.params.textContrast;
            this.textMesh.material.uniforms.u_saturation.value = this.params.textSaturation;
            this.textMesh.material.uniforms.u_useBrightness.value = this.params.textUseBrightness;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = performance.now();
        const deltaTime = time - this.lastTransitionTime;

        // Handle preset transitions
        if (this.isTransitioning) {
            const progress = Math.min(deltaTime / this.transitionDuration, 1);
            const targetParams = this.presets[this.currentPresetIndex].params;

            // Interpolate parameters based on animation setting
            for (const key in this.params) {
                if (typeof this.params[key] === 'number') {
                    this.params[key] = this.animateValues ? 
                        this.transitionStartParams[key] + (targetParams[key] - this.transitionStartParams[key]) * progress :
                        targetParams[key];
                } else if (typeof this.params[key] === 'boolean') {
                    this.params[key] = this.animateValues ?
                        (progress > 0.5 ? targetParams[key] : this.transitionStartParams[key]) :
                        targetParams[key];
                }
            }

            this.updateUniforms();

            if (progress === 1) {
                this.isTransitioning = false;
                
                // If cycling is enabled, queue up the next transition
                if (this.cyclePresets) {
                    this.cycleTimeoutId = setTimeout(() => {
                        const nextIndex = (this.currentPresetIndex + 1) % this.presets.length;
                        this.loadPreset(nextIndex);
                    }, this.cycleWaitDuration);
                }
            }
        }

        // Update time uniform for both materials
        this.mesh.material.uniforms.u_time.value = time * 0.001;
        if (this.textMesh) {
            this.textMesh.material.uniforms.u_time.value = time * 0.001;
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    loadPresets() {
        const savedPresets = localStorage.getItem('rasterBarsPresets');
        if (savedPresets) {
            const presets = JSON.parse(savedPresets);
            // Ensure all presets have saturation values
            presets.forEach(preset => {
                if (preset.params.bgSaturation === undefined) {
                    preset.params.bgSaturation = 1.0;
                }
                if (preset.params.textSaturation === undefined) {
                    preset.params.textSaturation = 1.0;
                }
            });
            return presets;
        }
        // Default presets
        return [{
            name: 'Default',
            params: { ...this.params }
        },
        {
            name: 'Neon Waves',
            params: {
                // Background parameters
                bgNumBars: 72,
                bgBarSpeed: 0.25,
                bgBarOffset: 0.18,
                bgBarThickness: 0.04,
                bgBrightness: 0.28,
                bgContrast: 3.0,
                bgSaturation: 1.313,
                bgColorShift: 0.243,
                bgSineOffset: 0.92,
                bgXWaveAmplitude: 0.1,  // Wave Amount
                bgXWaveFrequency: 7.4,  // Wave Speed
                bgXWaveOffset: 3.7,     // Wave Phase
                bgUseBrightness: false,
                
                // Text parameters
                textNumBars: 95,
                textBarSpeed: 1.8,
                textBarOffset: 0.49,
                textBarThickness: 0.021,
                textBrightness: 0.35,
                textContrast: 0.3,
                textSaturation: 0.58,
                textColorShift: 0.902,
                textSineOffset: 0.17,
                textXWaveAmplitude: 0.57,  // Wave Amount
                textXWaveFrequency: 4.99,  // Wave Speed
                textXWaveOffset: 4.5,      // Wave Phase
                textSolidBlack: true,
                textUseBrightness: false
            }
        },
        {
            name: 'Soft Glow',
            params: {
                // Background parameters
                bgNumBars: 46,
                bgBarSpeed: 0.57,
                bgBarOffset: 0.49,
                bgBarThickness: 0.035,
                bgBrightness: 0.51,
                bgContrast: 0.3,
                bgSaturation: 1.6,
                bgColorShift: 0.8,
                bgSineOffset: 0.44,
                bgXWaveAmplitude: 0.124,  // Wave Amount
                bgXWaveFrequency: 3.2,    // Wave Speed
                bgXWaveOffset: 3.3,       // Wave Phase
                bgUseBrightness: false,
                
                // Text parameters
                textNumBars: 68,
                textBarSpeed: 0.17,
                textBarOffset: 0.34,
                textBarThickness: 0.044,
                textBrightness: 0.87,
                textContrast: 2.8,
                textSaturation: 1.4,
                textColorShift: 0.8,
                textSineOffset: 0.8,
                textXWaveAmplitude: 0.061,  // Wave Amount
                textXWaveFrequency: 1.28,   // Wave Speed
                textXWaveOffset: 2.1,       // Wave Phase
                textSolidBlack: false,
                textUseBrightness: false
            }
        },
        {
            name: 'Minimal Lines',
            params: {
                // Background parameters
                bgNumBars: 47,
                bgBarSpeed: 0.19,
                bgBarOffset: 0.47,
                bgBarThickness: 0.047,
                bgBrightness: 0.34,
                bgContrast: 2.5,
                bgSaturation: 0.1,
                bgColorShift: 0.1,
                bgSineOffset: 0.93,
                bgXWaveAmplitude: 1.08,  // Wave Amount
                bgXWaveFrequency: 2.0,   // Wave Speed
                bgXWaveOffset: 5.6,      // Wave Phase
                bgUseBrightness: true,   // Brightness Based
                
                // Text parameters
                textNumBars: 13,
                textBarSpeed: 1.33,
                textBarOffset: 0.2,
                textBarThickness: 0.042,
                textBrightness: 0.83,
                textContrast: 2.3,
                textSaturation: 0.2,
                textColorShift: 0.0,
                textSineOffset: 0.2,
                textXWaveAmplitude: 0.809,  // Wave Amount
                textXWaveFrequency: 0.62,   // Wave Speed
                textXWaveOffset: 1.9,       // Wave Phase
                textSolidBlack: false,       // Solid Black
                textUseBrightness: false     // Brightness Based
            }
        },
        {
            name: 'Subtle Motion',
            params: {
                // Background parameters
                bgNumBars: 26,
                bgBarSpeed: 0.38,
                bgBarOffset: 0.41,
                bgBarThickness: 0.012,
                bgBrightness: 0.45,
                bgContrast: 1.7,
                bgSaturation: 0.8,
                bgColorShift: 0.7,
                bgSineOffset: 0.8,
                bgXWaveAmplitude: 0.197,  // Wave Amount
                bgXWaveFrequency: 2.2,    // Wave Speed
                bgXWaveOffset: 0.1,       // Wave Phase
                bgUseBrightness: true,    // Brightness Based
                
                // Text parameters
                textNumBars: 66,
                textBarSpeed: 1.36,
                textBarOffset: 0.15,
                textBarThickness: 0.015,
                textBrightness: 0.89,
                textContrast: 0.8,
                textSaturation: 0.2,
                textColorShift: 0.7,
                textSineOffset: 0.3,
                textXWaveAmplitude: 0.314,  // Wave Amount
                textXWaveFrequency: 0.81,   // Wave Speed
                textXWaveOffset: 1.1,       // Wave Phase
                textSolidBlack: false,       // Solid Black
                textUseBrightness: false     // Brightness Based
            }
        },
        {
            name: 'Slow Waves',
            params: {
                // Background parameters
                bgNumBars: 96,
                bgBarSpeed: 0.1,
                bgBarOffset: 0.27,
                bgBarThickness: 0.015,
                bgBrightness: 0.63,
                bgContrast: 0.7,
                bgSaturation: 1.7,
                bgColorShift: 0.5,
                bgSineOffset: 0.57,
                bgXWaveAmplitude: 0.95,   // Wave Amount
                bgXWaveFrequency: 0.1,    // Wave Speed
                bgXWaveOffset: 4.1,       // Wave Phase
                bgUseBrightness: true,    // Brightness Based
                
                // Text parameters
                textNumBars: 21,
                textBarSpeed: 0.53,
                textBarOffset: 0.45,
                textBarThickness: 0.027,
                textBrightness: 0.69,
                textContrast: 1.3,
                textSaturation: 0.6,
                textColorShift: 0.2,
                textSineOffset: 0.7,
                textXWaveAmplitude: 0.235,  // Wave Amount
                textXWaveFrequency: 5.38,   // Wave Speed
                textXWaveOffset: 2.1,       // Wave Phase
                textSolidBlack: true,       // Solid Black
                textUseBrightness: true     // Brightness Based
            }
        }];
    }

    savePresets() {
        localStorage.setItem('rasterBarsPresets', JSON.stringify(this.presets));
    }

    saveCurrentAsPreset() {
        const name = prompt('Enter preset name:', `Preset ${this.presets.length + 1}`);
        if (name) {
            this.presets.push({
                name,
                params: { ...this.params }
            });
            this.savePresets();
            
            const wasVisible = this.guiVisible;
            
            // Remove all folders and rebuild them
            Object.keys(this.gui.__folders).forEach(name => {
                this.gui.removeFolder(this.gui.__folders[name]);
            });
            
            // Recreate all folders
            this.setupGUI();
            
            // Restore visibility
            this.guiVisible = wasVisible;
            this.gui.domElement.style.display = wasVisible ? 'block' : 'none';
            
            // If cycling is enabled, make sure we include the new preset
            if (this.cyclePresets && !this.isTransitioning && this.cycleTimeoutId) {
                clearTimeout(this.cycleTimeoutId);
                const nextIndex = (this.currentPresetIndex + 1) % this.presets.length;
                this.loadPreset(nextIndex);
            }
        }
    }

    deletePreset(index) {
        if (this.presets.length <= 1) {
            alert('Cannot delete the last preset');
            return;
        }
        
        if (confirm(`Delete preset "${this.presets[index].name}"?`)) {
            // If we're deleting the current preset, switch to another one first
            if (index === this.currentPresetIndex) {
                const nextIndex = (index + 1) % this.presets.length;
                if (nextIndex === index) { // If it would loop back to the same index
                    this.loadPreset((index - 1 + this.presets.length) % this.presets.length);
                } else {
                    this.loadPreset(nextIndex);
                }
            } else if (index < this.currentPresetIndex) {
                // Adjust currentPresetIndex if we're deleting a preset before it
                this.currentPresetIndex--;
            }
            
            this.presets.splice(index, 1);
            this.savePresets();
            
            const wasVisible = this.guiVisible;
            
            // Remove all folders and rebuild them
            Object.keys(this.gui.__folders).forEach(name => {
                this.gui.removeFolder(this.gui.__folders[name]);
            });
            
            // Recreate all folders
            this.setupGUI();
            
            // Restore visibility
            this.guiVisible = wasVisible;
            this.gui.domElement.style.display = wasVisible ? 'block' : 'none';
            
            // If cycling is enabled, reset the timeout
            if (this.cyclePresets && this.cycleTimeoutId) {
                clearTimeout(this.cycleTimeoutId);
                const nextIndex = (this.currentPresetIndex + 1) % this.presets.length;
                this.loadPreset(nextIndex);
            }
        }
    }

    loadPreset(index) {
        if (index >= 0 && index < this.presets.length) {
            const preset = this.presets[index];
            this.transitionStartParams = { ...this.params };
            this.currentPresetIndex = index;
            
            // Start the transition
            this.isTransitioning = true;
            this.lastTransitionTime = performance.now();
            
            // Ensure saturation values are properly loaded
            if (preset.params.bgSaturation === undefined) {
                preset.params.bgSaturation = 1.0;
            }
            if (preset.params.textSaturation === undefined) {
                preset.params.textSaturation = 1.0;
            }
            
            // Update GUI controllers
            if (this.gui) {
                for (const folder in this.gui.__folders) {
                    const controllers = this.gui.__folders[folder].__controllers;
                    controllers.forEach(controller => {
                        if (controller.property in preset.params) {
                            controller.setValue(preset.params[controller.property]);
                        }
                    });
                }
            }
        }
    }

    updatePresetFolder() {
        if (!this.gui || !this.gui.__folders['Presets']) {
            return;
        }

        // Remove old preset controls
        const presetFolder = this.gui.__folders['Presets'];
        for (const controller of presetFolder.__controllers.slice()) {
            presetFolder.remove(controller);
        }
        
        // Add preset controls
        presetFolder.add(this, 'cyclePresets')
            .name('Auto Cycle Presets')
            .onChange(enabled => {
                if (!enabled && this.cycleTimeoutId) {
                    clearTimeout(this.cycleTimeoutId);
                    this.cycleTimeoutId = null;
                } else if (enabled && this.presets.length > 1) {
                    const nextIndex = (this.currentPresetIndex + 1) % this.presets.length;
                    this.loadPreset(nextIndex);
                }
            });
        
        presetFolder.add(this, 'animateValues')
            .name('Animate Values')
            .onChange(() => {
                // If we're currently transitioning, immediately apply target values if animation is disabled
                if (this.isTransitioning && !this.animateValues) {
                    const targetParams = this.presets[this.currentPresetIndex].params;
                    Object.assign(this.params, targetParams);
                    this.updateUniforms();
                }
            });
        
        presetFolder.add(this, 'cyclePeriod', 5, 120, 1)
            .name('Cycle Period (seconds)')
            .onChange(value => this.setCyclePeriod(value));
        
        // Add randomize button
        presetFolder.add({ randomize: () => this.randomizeParams() }, 'randomize')
            .name('Randomize Values');
        
        // Add dump button
        presetFolder.add({ dump: () => this.dumpCurrentParams() }, 'dump')
            .name('Dump Settings to Console');
        
        presetFolder.add({ savePreset: () => this.saveCurrentAsPreset() }, 'savePreset')
            .name('Save Current as Preset');
        
        // Add buttons for each preset
        this.presets.forEach((preset, index) => {
            const presetControls = {
                load: () => this.loadPreset(index),
                delete: () => this.deletePreset(index)  // Add delete for all presets
            };
            
            const row = presetFolder.addFolder(preset.name);
            row.add(presetControls, 'load').name('Load');
            row.add(presetControls, 'delete').name('Delete');  // Show delete for all presets
            row.open();
        });
    }

    setCyclePeriod(seconds) {
        this.cyclePeriod = seconds;
        this.transitionDuration = Math.min(15000, seconds * 1000 * 0.5); // 50% of period, max 15 seconds
        this.cycleWaitDuration = (seconds * 1000) - this.transitionDuration;
    }

    randomizeParams() {
        // Helper to get random number in range
        const rand = (min, max) => min + Math.random() * (max - min);
        
        // Randomize background parameters
        this.params.bgNumBars = Math.floor(rand(1, 96));
        this.params.bgBarSpeed = rand(0.1, 2.0);
        this.params.bgBarOffset = rand(0.05, 0.5);
        this.params.bgBarThickness = rand(0.005, 0.05);
        this.params.bgBrightness = rand(0.01, 1.0);
        this.params.bgContrast = rand(0.1, 3.0);
        this.params.bgSaturation = rand(0.0, 2.0);
        this.params.bgColorShift = rand(0.0, 1.0);
        this.params.bgSineOffset = rand(0.0, 1.0);
        this.params.bgXWaveAmplitude = rand(0.0, 1.2);
        this.params.bgXWaveFrequency = rand(0.1, 8.0);
        this.params.bgXWaveOffset = rand(0.0, 6.28);
        this.params.bgUseBrightness = Math.random() > 0.5;

        // Randomize text parameters
        this.params.textNumBars = Math.floor(rand(1, 96));
        this.params.textBarSpeed = rand(0.1, 2.0);
        this.params.textBarOffset = rand(0.05, 0.5);
        this.params.textBarThickness = rand(0.005, 0.05);
        this.params.textBrightness = rand(0.01, 1.0);
        this.params.textContrast = rand(0.1, 3.0);
        this.params.textSaturation = rand(0.0, 2.0);
        this.params.textColorShift = rand(0.0, 1.0);
        this.params.textSineOffset = rand(0.0, 1.0);
        this.params.textXWaveAmplitude = rand(0.0, 1.2);
        this.params.textXWaveFrequency = rand(0.1, 8.0);
        this.params.textXWaveOffset = rand(0.0, 6.28);
        this.params.textSolidBlack = Math.random() > 0.5;
        this.params.textUseBrightness = Math.random() > 0.5;

        // Update all GUI controllers
        for (const folder in this.gui.__folders) {
            const controllers = this.gui.__folders[folder].__controllers;
            controllers.forEach(controller => {
                if (controller.property in this.params) {
                    controller.setValue(this.params[controller.property]);
                }
            });
        }

        // Update uniforms
        this.updateUniforms();
    }

    dumpCurrentParams() {
        console.log('Background Bars');
        console.log('bgNumBars\n' + this.params.bgNumBars);
        console.log('bgBarSpeed\n' + this.params.bgBarSpeed);
        console.log('bgBarOffset\n' + this.params.bgBarOffset);
        console.log('bgBarThickness\n' + this.params.bgBarThickness);
        console.log('bgBrightness\n' + this.params.bgBrightness);
        console.log('bgContrast\n' + this.params.bgContrast);
        console.log('bgSaturation\n' + this.params.bgSaturation);
        console.log('bgColorShift\n' + this.params.bgColorShift);
        console.log('bgSineOffset\n' + this.params.bgSineOffset);
        console.log('Wave Amount\n' + this.params.bgXWaveAmplitude);
        console.log('Wave Speed\n' + this.params.bgXWaveFrequency);
        console.log('Wave Phase\n' + this.params.bgXWaveOffset);
        console.log('Brightness Based\n' + this.params.bgUseBrightness);
        console.log('Text Bars');
        console.log('textNumBars\n' + this.params.textNumBars);
        console.log('textBarSpeed\n' + this.params.textBarSpeed);
        console.log('textBarOffset\n' + this.params.textBarOffset);
        console.log('textBarThickness\n' + this.params.textBarThickness);
        console.log('textBrightness\n' + this.params.textBrightness);
        console.log('textContrast\n' + this.params.textContrast);
        console.log('textSaturation\n' + this.params.textSaturation);
        console.log('textColorShift\n' + this.params.textColorShift);
        console.log('textSineOffset\n' + this.params.textSineOffset);
        console.log('Wave Amount\n' + this.params.textXWaveAmplitude);
        console.log('Wave Speed\n' + this.params.textXWaveFrequency);
        console.log('Wave Phase\n' + this.params.textXWaveOffset);
        console.log('Solid Black\n' + this.params.textSolidBlack);
        console.log('Brightness Based\n' + this.params.textUseBrightness);
    }
}

// Start the demo when the page loads
window.addEventListener('load', () => {
    new RasterBarsDemo();
}); 