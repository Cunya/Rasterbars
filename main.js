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
            bgNumBars: 11,
            bgBarSpeed: 0.53,
            bgBarOffset: 0.28,
            bgBarThickness: 0.01,
            bgBrightness: 0.2,
            bgSineOffset: 0.46,
            // Text parameters
            textNumBars: 5,
            textBarSpeed: 0.89,
            textBarOffset: 0.2,
            textBarThickness: 0.02,
            textBrightness: 0.2,
            textSineOffset: 0.4,
            // Shared parameters
            colorShift: 1.0,
            // Add new parameters for x-wave
            xWaveAmplitude: 0.1,
            xWaveFrequency: 0.5
        };
        
        this.setup();
        this.createScene();
        this.loadText();
        this.setupGUI();
        this.animate();
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
                u_colorShift: { value: this.params.colorShift },
                u_xWaveAmplitude: { value: this.params.xWaveAmplitude },
                u_xWaveFrequency: { value: this.params.xWaveFrequency }
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
            if (gui.domElement.style.display === 'none') {
                gui.domElement.style.display = 'block';
                closeButton.textContent = 'Close Controls';
            } else {
                gui.domElement.style.display = 'none';
                closeButton.textContent = 'Open Controls';
            }
        });
        
        // Background controls
        const bgFolder = gui.addFolder('Background Bars');
        bgFolder.add(this.params, 'bgNumBars', 1, 24, 1).onChange(() => this.updateUniforms());
        bgFolder.add(this.params, 'bgBarSpeed', 0.1, 2.0).onChange(() => this.updateUniforms());
        bgFolder.add(this.params, 'bgBarOffset', 0.05, 0.5).onChange(() => this.updateUniforms());
        bgFolder.add(this.params, 'bgBarThickness', 0.005, 0.05).onChange(() => this.updateUniforms());
        bgFolder.add(this.params, 'bgBrightness', 0.2, 1.0).onChange(() => this.updateUniforms());
        bgFolder.add(this.params, 'bgSineOffset', 0.0, 1.0).onChange(() => this.updateUniforms());
        bgFolder.add(this.params, 'xWaveAmplitude', 0.0, 0.3).name('X Wave Amount').onChange(() => this.updateUniforms());
        bgFolder.add(this.params, 'xWaveFrequency', 0.1, 2.0).name('X Wave Speed').onChange(() => this.updateUniforms());
        bgFolder.open();

        // Text controls
        const textFolder = gui.addFolder('Text Bars');
        textFolder.add(this.params, 'textNumBars', 1, 24, 1).onChange(() => this.updateUniforms());
        textFolder.add(this.params, 'textBarSpeed', 0.1, 2.0).onChange(() => this.updateUniforms());
        textFolder.add(this.params, 'textBarOffset', 0.05, 0.5).onChange(() => this.updateUniforms());
        textFolder.add(this.params, 'textBarThickness', 0.005, 0.05).onChange(() => this.updateUniforms());
        textFolder.add(this.params, 'textBrightness', 0.2, 1.0).onChange(() => this.updateUniforms());
        textFolder.add(this.params, 'textSineOffset', 0.0, 1.0).onChange(() => this.updateUniforms());
        textFolder.open();

        // Color controls
        const colorFolder = gui.addFolder('Color Settings');
        colorFolder.add(this.params, 'colorShift', 0.0, 1.0).onChange(() => this.updateUniforms());
        colorFolder.open();
    }

    updateUniforms() {
        // Update background uniforms
        this.mesh.material.uniforms.u_numBars.value = this.params.bgNumBars;
        this.mesh.material.uniforms.u_barSpeed.value = this.params.bgBarSpeed;
        this.mesh.material.uniforms.u_barOffset.value = this.params.bgBarOffset;
        this.mesh.material.uniforms.u_barThickness.value = this.params.bgBarThickness;
        this.mesh.material.uniforms.u_brightness.value = this.params.bgBrightness;
        this.mesh.material.uniforms.u_sineOffset.value = this.params.bgSineOffset;
        this.mesh.material.uniforms.u_colorShift.value = this.params.colorShift;
        this.mesh.material.uniforms.u_xWaveAmplitude.value = this.params.xWaveAmplitude;
        this.mesh.material.uniforms.u_xWaveFrequency.value = this.params.xWaveFrequency;

        // Update text uniforms if text mesh exists
        if (this.textMesh) {
            this.textMesh.material.uniforms.u_numBars.value = this.params.textNumBars;
            this.textMesh.material.uniforms.u_barSpeed.value = this.params.textBarSpeed;
            this.textMesh.material.uniforms.u_barOffset.value = this.params.textBarOffset;
            this.textMesh.material.uniforms.u_barThickness.value = this.params.textBarThickness;
            this.textMesh.material.uniforms.u_brightness.value = this.params.textBrightness;
            this.textMesh.material.uniforms.u_sineOffset.value = this.params.textSineOffset;
            this.textMesh.material.uniforms.u_colorShift.value = this.params.colorShift;
            this.textMesh.material.uniforms.u_xWaveAmplitude.value = this.params.xWaveAmplitude;
            this.textMesh.material.uniforms.u_xWaveFrequency.value = this.params.xWaveFrequency;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = performance.now() * 0.001;
        // Update time uniform for both materials
        this.mesh.material.uniforms.u_time.value = time;
        if (this.textMesh) {
            this.textMesh.material.uniforms.u_time.value = time;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the demo when the page loads
window.addEventListener('load', () => {
    new RasterBarsDemo();
}); 