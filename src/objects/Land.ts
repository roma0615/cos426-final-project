import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';

import LevelScene from '../scenes/LevelScene';

// Import land model as a URL using Vite's syntax
import MODEL from './level1.glb?url';

class Land extends Group {
    parent: LevelScene;
    body: CANNON.Body;

    constructor(parent: LevelScene, show_wireframe = false) {
        // Call parent Group() constructor
        super();

        // Init body
        this.parent = parent;
        this.body = new CANNON.Body({
            type: CANNON.Body.STATIC,
            shape: new CANNON.Box(new CANNON.Vec3(10.75, 2.5, 10.75)),
            position: new CANNON.Vec3(0, -2.5, 0),
        });
        console.log("body", this.body);
        // this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        parent.world.addBody(this.body);

        // Wireframe mesh for visual debugging
        // if (show_wireframe){
        //     const geometry = new BoxGeometry(10.75*2, 5, 10.75*2);
        //     geometry.translate(0, -2.5, 0);
        //     const material = new MeshBasicMaterial({ color: 0x000000, wireframe: true });
        //     const wireframe = new Mesh(geometry, material);
        //     this.add(wireframe);
        // }

        const loader = new GLTFLoader();

        this.name = 'land';

        loader.load(MODEL, (gltf) => {
            console.log("LOADED LAND");
            this.add(gltf.scene);
            gltf.scenes.
            // const body = threeToCannon(gltf.scene);
            // this.body.
            // this.body.type = CANNON.Body.STATIC;
            // console.log(this.body);
            // this.parent.world.addBody(this.body);
            // this.body.position.y -= 10;
        });
    }
}

export default Land;
