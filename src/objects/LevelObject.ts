import { Group, Quaternion, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import { threeToCannon } from 'three-to-cannon';

import LevelScene, { COLLISION_GROUPS } from '../scenes/BaseScene';

// Import land model as a URL using Vite's syntax

interface Options {
    offset: Vector3;
    quaternion: Quaternion;
    bodyType: CANNON.BodyType;
    gravity: CANNON.Vec3;
    isTrigger: boolean;
    collisionGroup: COLLISION_GROUPS;
    generateShapesOfChildren: boolean;
    mass: number;
    collideCallback: ((self: LevelObject, e: any) => void) | undefined;
    collideEndCallback: ((self: LevelObject, e: any) => void) | undefined;
    updateCallback: ((timeStamp: number) => void) | undefined;
    show_wireframe: boolean;
}

// base class for object
class LevelObject extends Group {
    body: CANNON.Body;
    gravity: CANNON.Vec3;
    modelName: string;
    bodyType: CANNON.BodyType | undefined;
    isTrigger: boolean;
    initialOffset: Vector3;
    initialQuaternion: Quaternion;
    mass: number;
    generateShapesOfChildren: boolean;
    collideCallback: ((self: LevelObject, e: any) => void) | undefined;
    collideEndCallback: ((self: LevelObject, e: any) => void) | undefined;
    updateCallback: ((timeStamp: number) => void) | undefined;

    constructor(
        parent: LevelScene,
        modelName: string,
        options: Partial<Options>
    ) {
        // Call parent Group() constructor
        super();
        this.modelName = new URL(`/src/assets/${modelName}.glb?url`, import.meta.url).href;
        this.initialOffset = options.offset || new Vector3(0, 0, 0);
        this.initialQuaternion = options.quaternion || new Quaternion();
        this.bodyType = options.bodyType || CANNON.Body.DYNAMIC;
        this.isTrigger = options.isTrigger || false;
        this.mass = options.mass || 1;
        this.gravity = options.gravity || new CANNON.Vec3(0, -9.82, 0);
        this.generateShapesOfChildren =
            options.generateShapesOfChildren || false;
        this.collideCallback = options.collideCallback;
        this.collideEndCallback = options.collideEndCallback;
        this.updateCallback = options.updateCallback;

        // Init body
        this.body = new CANNON.Body({
            type: this.bodyType,
            mass: this.bodyType == CANNON.Body.STATIC ? 0 : this.mass,
            isTrigger: this.isTrigger,
            linearDamping: 0.75,
            material: parent.materials.ground,
            position: this.initialOffset as any,
            quaternion: this.initialQuaternion as any,
            collisionFilterGroup:
                options.collisionGroup || COLLISION_GROUPS.OBJECTS,
            collisionFilterMask:
                COLLISION_GROUPS.PLAYER |
                COLLISION_GROUPS.SCENE |
                COLLISION_GROUPS.OBJECTS,
        });
        // this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        parent.world.addBody(this.body);
        parent.registerBody(this.body, this);

        const loader = new GLTFLoader();

        this.name = modelName;

        loader.load(this.modelName, (gltf) => {
            this.add(gltf.scene);
            const objs = this.generateShapesOfChildren
                ? gltf.scene.children
                : [gltf.scene];
            objs.forEach((c) => {
                if (c.name.endsWith("_X")) {
                    return; // don't add shapes for objects with _X
                }
                const result = threeToCannon(c);
                const { shape, offset, quaternion } = result;
                this.body.addShape(shape, offset, quaternion);
            });
            gltf.scene.traverse((o: any) => {
                if (o.isMesh && o.material.name.endsWith("_T")) { // _T means set the material as transparent
                    o.material.transparent = true;
                    o.material.opacity = 0.2;
                }
            });
        });

        this.body.addEventListener('collide', this.collideHandler.bind(this));
        parent.world.addEventListener("endContact", this.collideEndHandler.bind(this));

        parent.addToUpdateList(this);

        this.position.copy(this.initialOffset);
        this.quaternion.copy(this.initialQuaternion);
    }

    collideHandler(e: any) {
        if (this.collideCallback) this.collideCallback(this, e);
    }
    collideEndHandler(e: any) {
        const { bodyA, bodyB } = e;
        if (bodyA.id != this.body.id && bodyB.id != this.body.id) return;
        const event = {
            body: bodyA.id == this.body.id ? bodyB : bodyA,
            e
        };
        if (this.collideEndCallback) this.collideEndCallback(this, event);
    }

    // given a contact event e, return the other body
    static getOtherFromContact(self: LevelObject, e: any) {
        const otherBody =
            e.contact.bi.id == self.body.id ? e.contact.bj : e.contact.bi;
        return otherBody;
    }

    update(timeStamp: number) {
        if (this.updateCallback) this.updateCallback(timeStamp);

        if (this.bodyType == CANNON.Body.DYNAMIC) {
            // copy cannon physics to group mesh
            // custom gravity
            this.body.applyForce(this.gravity);

            this.position.copy(this.body.position as any);
            this.quaternion.copy(this.body.quaternion as any);
        }
    }
}

export default LevelObject;
