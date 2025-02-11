import * as THREE from 'three';

class RasterBarsDemo {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.setup();
        this.createScene();
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

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update time uniform
        this.mesh.material.uniforms.u_time.value = performance.now() * 0.001;
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the demo when the page loads
window.addEventListener('load', () => {
    new RasterBarsDemo();
}); 