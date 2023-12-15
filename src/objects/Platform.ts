import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import { threeToCannon } from "three-to-cannon";
import TWEEN, { Tween } from 'three/examples/jsm/libs/tween.module.js';

import LevelScene, { COLLISION_GROUPS } from '../scenes/BaseScene';
import { cannonVecToThree } from '../utils';

interface Options {
    start: CANNON.Vec3;
    end?: CANNON.Vec3 | undefined;
    size?: CANNON.Box;
    repeat?: number | undefined;
    easing?: any;
}

class Platform extends Group {
    parent: LevelScene;
    name: string;
    body: CANNON.Body;
    start: CANNON.Vec3;
    end: CANNON.Vec3 | undefined;
    size: CANNON.Box;
    repeat: number | undefined;
    easing: any;
    tween: Tween<any> | undefined;

    constructor(parent: LevelScene, name: string, options: Options) {
        // Call parent Group() constructor
        super();

        this.name = name
        this.start = options.start;
        this.end = options.end;
        this.size = options.size || new CANNON.Box(new CANNON.Vec3(2, 0.25, 2))
        this.repeat = options.repeat || 1;
        this.easing = options.easing || TWEEN.Easing.Quadratic.Out;
        this.tween = undefined;

        // Init cannon body
        this.parent = parent;

        this.body = new CANNON.Body({
            type: CANNON.Body.STATIC,
            material: parent.materials.ground,
            position: this.start,
            shape: this.size,
            collisionFilterGroup: COLLISION_GROUPS.SCENE,
            collisionFilterMask: COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.SCENE | COLLISION_GROUPS.OBJECTS
        });
        parent.world.addBody(this.body);
        parent.registerBody(this.body, this);
        parent.addToUpdateList(this);

        // setup three mesh
        const geom = new BoxGeometry(this.size.halfExtents.x * 2, this.size.halfExtents.y * 2, this.size.halfExtents.z * 2);
        const mat = new MeshBasicMaterial({ color: 0xbbccfa })
        const box = new Mesh(geom, mat);
        // box.position.add(cannonVecToThree(this.start));
        this.add(box);
    }

    update(timeStamp: number): void {
        // Update physics
        this.position.copy(this.body.position as any);
        this.quaternion.copy(this.body.quaternion as any);

        console.log("UDatping twiens");
        // update tweens
        TWEEN.update();
    }

    startMovement() {
        // begin the tween to take it from start to end
        // Use timing library for more precice "bounce" animation
        // TweenJS guide: http://learningthreejs.com/blog/2011/08/17/tweenjs-for-smooth-animation/
        // Possible easings: http://sole.github.io/tween.js/examples/03_graphs.html
        console.log("Start movement");
        if (this.end === undefined) return;
        if (this.tween !== undefined) return;
        console.log("Creating tween.");
        this.tween = new Tween(this.body.position)
            .to({ x: this.end.x, y: this.end.y, z: this.end.z}, 1000) // take a second to complete
            .to({ x: this.start.x, y: this.start.y, z: this.start.z}, 1000) // take a second to complete
            .easing(this.easing);
            // .repeat(this.repeat);

        // Start animation
        this.tween.start();
    }

    stopMovement() {
        this.tween?.stop();
    }
}

export default Platform;
