import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import * as dat from 'dat.gui';

class RasterBarsDemo {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.params = {
            numBars: 12,
            barSpeed: 0.5,
            barOffset: 0.2,
            textBarThickness: 0.02,
            bgBarThickness: 0.01,
            textBrightness: 0.8,
            bgBrightness: 0.4,
            colorShift: 0.5
        };
        
        this.setup();
        this.createScene();
        this.loadText();
        this.setupGUI();
        this.animate();
    }

    async setup() {
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        this.camera.position.z = 1;

        this.scene = new THREE.Scene();

        window.addEventListener('resize', () => this.onResize());
    }

    async createScene() {
        const geometry = new THREE.PlaneGeometry(2, 2);
        const backgroundMaterial = await this.createMaterial(false);
        this.mesh = new THREE.Mesh(geometry, backgroundMaterial);
        this.scene.add(this.mesh);
    }

    async createMaterial(isText) {
        const response = await fetch(isText ? 'shaders/text_vertex.glsl' : 'shaders/background_vertex.glsl');
        const vertexShader = await response.text();
        return new THREE.ShaderMaterial({
            uniforms: {
                u_time: { value: 0 },
                u_resolution: { value: new THREE.Vector2() },
                u_isText: { value: isText },
                u_numBars: { value: this.params.numBars },
                u_barSpeed: { value: this.params.barSpeed },
                u_barOffset: { value: this.params.barOffset },
                u_textBarThickness: { value: this.params.textBarThickness },
                u_bgBarThickness: { value: this.params.bgBarThickness },
                u_textBrightness: { value: this.params.textBrightness },
                u_bgBrightness: { value: this.params.bgBrightness },
                u_colorShift: { value: this.params.colorShift }
            },
            vertexShader: vertexShader,
            fragmentShader: await this.loadShader('shaders/fragment.glsl'),
            transparent: isText,
            side: THREE.DoubleSide,
            depthWrite: isText,
            depthTest: true
        });
    }

    async loadShader(url) {
        const response = await fetch(url);
        return await response.text();
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
        const textMaterial = await this.createMaterial(true);
        this.textMesh = new THREE.Mesh(textGeometry, textMaterial);
        
        // Adjust text position to align with background coordinates
        this.textMesh.position.x = -textWidth / 2;
        this.textMesh.position.y = -textHeight / 2;
        this.textMesh.position.z = 0.1;

        this.scene.add(this.textMesh);
    }

    setupGUI() {
        const gui = new dat.GUI();
        
        // Bar controls
        const barsFolder = gui.addFolder('Bars');
        barsFolder.add(this.params, 'numBars', 1, 24, 1).onChange(() => this.updateUniforms());
        barsFolder.add(this.params, 'barSpeed', 0.1, 2.0).onChange(() => this.updateUniforms());
        barsFolder.add(this.params, 'barOffset', 0.05, 0.5).onChange(() => this.updateUniforms());
        barsFolder.open();

        // Thickness controls
        const thicknessFolder = gui.addFolder('Thickness');
        thicknessFolder.add(this.params, 'textBarThickness', 0.005, 0.05).onChange(() => this.updateUniforms());
        thicknessFolder.add(this.params, 'bgBarThickness', 0.005, 0.05).onChange(() => this.updateUniforms());
        thicknessFolder.open();

        // Color controls
        const colorFolder = gui.addFolder('Colors');
        colorFolder.add(this.params, 'textBrightness', 0.2, 1.0).onChange(() => this.updateUniforms());
        colorFolder.add(this.params, 'bgBrightness', 0.2, 1.0).onChange(() => this.updateUniforms());
        colorFolder.add(this.params, 'colorShift', 0.0, 1.0).onChange(() => this.updateUniforms());
        colorFolder.open();
    }

    updateUniforms() {
        const uniforms = {
            u_numBars: { value: this.params.numBars },
            u_barSpeed: { value: this.params.barSpeed },
            u_barOffset: { value: this.params.barOffset },
            u_textBarThickness: { value: this.params.textBarThickness },
            u_bgBarThickness: { value: this.params.bgBarThickness },
            u_textBrightness: { value: this.params.textBrightness },
            u_bgBrightness: { value: this.params.bgBrightness },
            u_colorShift: { value: this.params.colorShift }
        };

        // Update both materials
        Object.entries(uniforms).forEach(([key, value]) => {
            this.mesh.material.uniforms[key] = value;
            if (this.textMesh) {
                this.textMesh.material.uniforms[key] = value;
            }
        });
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