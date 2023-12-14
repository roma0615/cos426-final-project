import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import { threeToCannon } from 'three-to-cannon';

import LevelScene from '../scenes/LevelScene';

// Import land model as a URL using Vite's syntax
import MODEL from './landing_pad.glb?url';
import { threeVectorToCannon } from '../utils';

interface Options {
    offset: Vector3;
    bodyType: CANNON.BodyType;
    mass: number;
    collideCallback: ((self: LevelObject, e: any) => void) | undefined;
    updateCallback: ((timeStamp: number) => void) | undefined;
    show_wireframe: boolean;
}

// base class for object
class LevelObject extends Group {
    body: CANNON.Body;
    modelName: string;
    bodyType: CANNON.BodyType | undefined;
    initialOffset: Vector3;
    mass: number;
    collideCallback: ((self: LevelObject, e: any) => void) | undefined;
    updateCallback: ((timeStamp: number) => void) | undefined;

    constructor(
        parent: LevelScene,
        modelName: string,
        options: Partial<Options>
    ) {
        // Call parent Group() constructor
        super();
        this.modelName = `src/objects/${modelName}.glb?url`;
        this.initialOffset = options.offset || new Vector3(0, 0, 0);
        this.bodyType = options.bodyType || CANNON.Body.DYNAMIC;
        this.mass = options.mass || 1;
        this.collideCallback = options.collideCallback;
        this.updateCallback = options.updateCallback;

        // Init body
        this.body = new CANNON.Body({
            type: this.bodyType,
            mass: this.mass,
            position: this.initialOffset as any,
        });
        // this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        parent.world.addBody(this.body);

        const loader = new GLTFLoader();

        this.name = modelName;

        loader.load(this.modelName, (gltf) => {
            this.add(gltf.scene);
            const result = threeToCannon(gltf.scene);
            const {
                shape,
                offset,
                quaternion,
            }: { shape: any; offset: CANNON.Vec3; quaternion: any } = result;
            // const offset2 = offset.vadd(
            //     threeVectorToCannon(this.initialOffset)
            // );
            this.body.addShape(shape, offset, quaternion);
        });

        this.body.addEventListener('collide', this.collideHandler.bind(this));

        parent.addToUpdateList(this);

        this.position.add(this.initialOffset);
    }

    collideHandler(e: any) {
        if (this.collideCallback) this.collideCallback(this, e);
    }

    update(timeStamp: number) {
        if (this.updateCallback) this.updateCallback(timeStamp);

        if (this.bodyType == CANNON.Body.DYNAMIC) {
            // copy cannon physics to group mesh
            this.position.copy(this.body.position as any);
            this.quaternion.copy(this.body.quaternion as any);
        }
    }
}

export default LevelObject;
