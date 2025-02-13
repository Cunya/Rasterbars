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
        this.lastTransitionTime = 0;
        this.cyclePeriod = 30; // Default cycle period in seconds
        this.transitionDuration = 5000; // 5 second transition
        this.cycleWaitDuration = 25000; // Initial wait duration (will be updated by setCyclePeriod)
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
            }, 1000); // Wait 1 second after initialization
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

            // Interpolate parameters
            for (const key in this.params) {
                if (typeof this.params[key] === 'number') {
                    this.params[key] = this.transitionStartParams[key] + 
                        (targetParams[key] - this.transitionStartParams[key]) * progress;
                } else if (typeof this.params[key] === 'boolean') {
                    // For boolean values, switch at 50% of the transition
                    this.params[key] = progress > 0.5 ? targetParams[key] : this.transitionStartParams[key];
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
            return JSON.parse(savedPresets);
        }
        // Default preset is the initial parameters
        return [{
            name: 'Default',
            params: { ...this.params }
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
        if (index === 0) {
            alert('Cannot delete default preset');
            return;
        }
        if (confirm(`Delete preset "${this.presets[index].name}"?`)) {
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
            
            // If cycling is enabled and we were on the deleted preset, move to the next one
            if (this.cyclePresets) {
                if (this.cycleTimeoutId) {
                    clearTimeout(this.cycleTimeoutId);
                }
                if (index === this.currentPresetIndex) {
                    const nextIndex = index % this.presets.length;
                    this.loadPreset(nextIndex);
                }
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
        
        // Add preset controls with onChange handler for cyclePresets
        presetFolder.add(this, 'cyclePresets')
            .name('Auto Cycle Presets')
            .onChange(enabled => {
                if (!enabled && this.cycleTimeoutId) {
                    clearTimeout(this.cycleTimeoutId);
                    this.cycleTimeoutId = null;
                } else if (enabled && this.presets.length > 1) {
                    // Start cycling if it was just enabled
                    const nextIndex = (this.currentPresetIndex + 1) % this.presets.length;
                    this.loadPreset(nextIndex);
                }
            });
        presetFolder.add(this, 'cyclePeriod', 5, 120, 1)
            .name('Cycle Period (seconds)')
            .onChange(value => this.setCyclePeriod(value));
        presetFolder.add({ savePreset: () => this.saveCurrentAsPreset() }, 'savePreset').name('Save Current as Preset');
        
        // Add buttons for each preset
        this.presets.forEach((preset, index) => {
            const presetControls = {
                load: () => this.loadPreset(index)
            };
            
            // Add delete button for non-default presets
            if (index > 0) {
                presetControls.delete = () => this.deletePreset(index);
            }
            
            const row = presetFolder.addFolder(preset.name);
            row.add(presetControls, 'load').name('Load');
            if (index > 0) {
                row.add(presetControls, 'delete').name('Delete');
            }
            row.open();
        });
    }

    setCyclePeriod(seconds) {
        this.cyclePeriod = seconds;
        this.transitionDuration = Math.min(5000, seconds * 1000 * 0.2); // 20% of period, max 5 seconds
        this.cycleWaitDuration = (seconds * 1000) - this.transitionDuration;
    }
}

// Start the demo when the page loads
window.addEventListener('load', () => {
    new RasterBarsDemo();
}); 