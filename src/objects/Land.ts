import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import { threeToCannon } from "three-to-cannon";

import LevelScene, { COLLISION_GROUPS } from '../scenes/BaseScene';

// Import land model as a URL using Vite's syntax
import MODEL from './level1.glb?url';

// NO LONGER USING THIS FILE
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
            collisionFilterGroup: COLLISION_GROUPS.SCENE,
            collisionFilterMask: COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.SCENE | COLLISION_GROUPS.OBJECTS
        }); // nothing for now
        parent.world.addBody(this.body);

        const loader = new GLTFLoader();

        this.name = 'land';

        loader.load(MODEL, (gltf) => {
            this.add(gltf.scene);
            gltf.scene.children.forEach((c) => {
                const result = threeToCannon(c);
                const { shape, offset, quaternion } = result;
                this.body.addShape(shape, offset, quaternion);
            })
        });
    }
}

export default Land;
