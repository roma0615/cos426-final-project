import { Group, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';

import SeedScene from '../scenes/SeedScene';

// Import land model as a URL using Vite's syntax
import MODEL from './land.gltf?url';

class Land extends Group {
    body: CANNON.Body;

    constructor(parent: SeedScene, show_wireframe = false) {
        // Call parent Group() constructor
        super();

        // Init body
        this.body = new CANNON.Body({
            type: CANNON.Body.STATIC,
            shape: new CANNON.Plane(),
        });
        this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        parent.world.addBody(this.body);

        // Wireframe mesh for visual debugging
        if (show_wireframe){
            const geometry = new PlaneGeometry(10, 10, 10);
            geometry.rotateX(-Math.PI / 2);
            const material = new MeshBasicMaterial({ color: 0x000000, wireframe: true });
            const wireframe = new Mesh(geometry, material);
            this.add(wireframe);
        }

        const loader = new GLTFLoader();

        this.name = 'land';

        loader.load(MODEL, (gltf) => {
            this.add(gltf.scene);
        });
    }
}

export default Land;
