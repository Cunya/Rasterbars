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
        const backgroundMaterial = new THREE.ShaderMaterial({
            uniforms: {
                u_time: { value: 0 },
                u_resolution: { value: new THREE.Vector2() },
                u_isText: { value: false }
            },
            vertexShader: await this.loadShader('shaders/background_vertex.glsl'),
            fragmentShader: await this.loadShader('shaders/fragment.glsl')
        });

        this.mesh = new THREE.Mesh(geometry, backgroundMaterial);
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

        // Generate UVs
        const positions = textGeometry.attributes.position;
        const uvs = new Float32Array(positions.count * 2);
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            uvs[i * 2] = (x - textBounds.min.x) / textWidth;
            uvs[i * 2 + 1] = (y - textBounds.min.y) / textHeight;
        }
        textGeometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

        // Create material and mesh
        const textMaterial = new THREE.ShaderMaterial({
            uniforms: {
                u_time: { value: 0 },
                u_resolution: { value: new THREE.Vector2() },
                u_isText: { value: true }
            },
            vertexShader: await this.loadShader('shaders/text_vertex.glsl'),
            fragmentShader: await this.loadShader('shaders/fragment.glsl'),
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: true,
            depthTest: true
        });
        this.textMesh = new THREE.Mesh(textGeometry, textMaterial);
        
        // Position the text in the center
        this.textMesh.position.x = -textWidth / 2;
        this.textMesh.position.y = -textHeight / 2;
        this.textMesh.position.z = 0.1; // Smaller z-offset

        this.scene.add(this.textMesh);
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