import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import { threeToCannon } from "three-to-cannon";
import TWEEN from 'three/examples/jsm/libs/tween.module.js';

import LevelScene, { COLLISION_GROUPS } from '../scenes/BaseScene';
import { cannonVecToThree } from '../utils';

interface Options {
    start: CANNON.Vec3;
    end?: CANNON.Vec3 | undefined;
    size?: CANNON.Box;
}

class Platform extends Group {
    parent: LevelScene;
    name: string;
    body: CANNON.Body;
    start: CANNON.Vec3;
    end: CANNON.Vec3 | undefined;
    size: CANNON.Box;

    constructor(parent: LevelScene, name: string, options: Options) {
        // Call parent Group() constructor
        super();

        this.name = name
        this.start = options.start;
        this.end = options.end;
        this.size = options.size || new CANNON.Box(new CANNON.Vec3(2, 0.25, 2))

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

        TWEEN.update();
    }

    triggerMovement() {
        // begin the tween to take it from start to end
        console.log("BEGINNING ANIAMTION");
        // Use timing library for more precice "bounce" animation
        // TweenJS guide: http://learningthreejs.com/blog/2011/08/17/tweenjs-for-smooth-animation/
        // Possible easings: http://sole.github.io/tween.js/examples/03_graphs.html
        if (this.end === undefined) return;
        const movePlatform = new TWEEN.Tween(this.body.position)
            .to({ x: this.end.x, y: this.end.y, z: this.end.z}, 1000) // take a second to complete
            .to({ x: this.start.x, y: this.start.y, z: this.start.z}, 1000) // take a second to complete
            .easing(TWEEN.Easing.Quadratic.Out);

        movePlatform.repeat(1000); // forever?
        // Start animation
        movePlatform.start();
    }
}

export default Platform;
