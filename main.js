import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

class RasterBarsDemo {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.setup();
        this.createScene();
        this.loadText();
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
        // Create a plane that fills the screen
        const geometry = new THREE.PlaneGeometry(2, 2);

        // Create shader material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                u_time: { value: 0 },
                u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
            },
            vertexShader: await this.loadShader('shaders/vertex.glsl'),
            fragmentShader: await this.loadShader('shaders/fragment.glsl')
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);
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

        // Center the text
        textGeometry.computeBoundingBox();
        const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
        const textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;
        
        // Create material and mesh
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.textMesh = new THREE.Mesh(textGeometry, textMaterial);
        
        // Position the text in the center
        this.textMesh.position.x = -textWidth / 2;
        this.textMesh.position.y = -textHeight / 2;
        this.textMesh.position.z = 0.5; // Slightly in front of the raster bars

        this.scene.add(this.textMesh);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update time uniform
        this.mesh.material.uniforms.u_time.value = performance.now() * 0.001;
        
        // Optional: add some subtle text animation
        if (this.textMesh) {
//            this.textMesh.rotation.y = Math.sin(performance.now() * 0.001) * 0.1;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the demo when the page loads
window.addEventListener('load', () => {
    new RasterBarsDemo();
}); 