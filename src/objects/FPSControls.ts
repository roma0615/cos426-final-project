import { MathUtils, Group, BoxGeometry, MeshBasicMaterial, Mesh, Quaternion, Vector3, Camera, Euler } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import TWEEN from 'three/examples/jsm/libs/tween.module.js';
import * as CANNON from 'cannon-es';

import LevelScene, { COLLISION_GROUPS } from '../scenes/LevelScene';
import { cannonVecToThree, threeVectorToCannon } from '../utils';

// adapted from https://github.com/schteppe/cannon.js/blob/master/examples/js/PointerLockControls.js#L5
class FPSControls {
    // Define the type of the state field
    state: {
        velocityFactor: number;
        keysPressed: Set<string>;
        lastTimeStamp: number;
        cameraAngle: {
            x: number;
            y: number;
        }
    };
    scene: LevelScene;
    camera: Camera;
    cameraDistance: number;

    constructor (camera: Camera, scene: LevelScene) {
        // if (cannonBody === undefined) return;
        this.scene = scene;
        this.camera = camera;
        this.cameraDistance = 10;
        this.state = {
            velocityFactor: 0.2,
            keysPressed: new Set(), // keep track of keys pressed
            lastTimeStamp: 0,
            cameraAngle: {
                x: -Math.PI / 2,
                y: Math.PI / 4,
            }
        }

        // setup event listeners
        document.addEventListener("mousemove", this.onMouseMove.bind(this));
        document.addEventListener("keydown", this.onKeyDown.bind(this));
        document.addEventListener("keyup", this.onKeyUp.bind(this));
    }

    getPlayer() {
        return this.scene.getActivePlayer();
    }
    getBody() {
        return this.scene.getActivePlayer().body;
    }

    onMouseMove (event: MouseEvent) {
        this.getPlayer().state.cameraAngle.x -= event.movementX * 0.002;
        this.getPlayer().state.cameraAngle.y -= event.movementY * 0.002;
        this.getPlayer().state.cameraAngle.y = Math.max(0.1, Math.min(this.getPlayer().state.cameraAngle.y, Math.PI - 0.1));
    }

    onKeyDown (event: KeyboardEvent) {
        if (["w", "a", "s", "d", " "].includes(event.key)) {
            this.state.keysPressed.add(event.key);
        }
    };

    onKeyUp (event: KeyboardEvent) {
        if (["w", "a", "s", "d", " "].includes(event.key)) {
            this.state.keysPressed.delete(event.key);
        }
    };

    getObject() {
        return this.camera;
    };

    // Moves the camera to the Cannon.js object position and adds velocity to the object if the run key is down
    update(timeStamp: number) {
        const inputVelocity = new Vector3();
        const delta = timeStamp - this.state.lastTimeStamp;
        // delta *= 0.1;

        // inputVelocity is local space right now
        inputVelocity.set(0, 0, 0);

        // i know usually x is sideways but since y is up it is weird. so instead
        // if we make +/-x forward/backward, then +z is right and -z is left
        // and +/-y is up/down
        if (this.state.keysPressed.has("w")) {
            inputVelocity.x = this.state.velocityFactor * delta; // not sure why w is flipped
        }
        if (this.state.keysPressed.has("s")) {
            inputVelocity.x = -this.state.velocityFactor * delta;
        }

        if (this.state.keysPressed.has("a")) {
            inputVelocity.z = -this.state.velocityFactor * delta;
        }
        if (this.state.keysPressed.has("d")) {
            inputVelocity.z = this.state.velocityFactor * delta;
        }
        if (this.state.keysPressed.has(" ") && this.getPlayer().state.canJump) {
            // jump and remove
            // apply impluse vertically
            this.getBody().velocity.y += this.getPlayer().state.jumpVelocity;
            this.getPlayer().state.canJump = false;
        }


        // put camera behind the player
        this.state.cameraAngle.x = MathUtils.lerp(this.state.cameraAngle.x, this.getPlayer().state.cameraAngle.x, 0.15);
        this.state.cameraAngle.y = MathUtils.lerp(this.state.cameraAngle.y, this.getPlayer().state.cameraAngle.y, 0.15);
        // this.getPlayer().state.cameraAngle.x;

        this.camera.position.setFromSphericalCoords(this.cameraDistance, this.state.cameraAngle.y, this.state.cameraAngle.x);
        // this.camera.position.lerp(desiredPos, timeStamp <= 2000 ? 1 : 0.01);
        // rotate body to look at camera
        this.getBody().quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), this.getPlayer().state.cameraAngle.x + Math.PI / 2);
        const bodyPos = cannonVecToThree(this.getBody().position);
        this.camera.position.add(bodyPos);
        this.camera.lookAt(bodyPos);

        // Convert velocity to world coordinates based on direction of camera
        const cameraWorldDir = new Vector3();
        this.camera.getWorldDirection(cameraWorldDir);
        cameraWorldDir.setY(0).normalize();
        // console.log("camera world dir:", cameraWorldDir);
        this.getPlayer().state.quat.setFromUnitVectors(new Vector3(1, 0, 0), cameraWorldDir);
        // inputVelocity.applyAxisAngle(new Vector3(0, 1, 0));
        inputVelocity.applyQuaternion(this.getPlayer().state.quat);
        inputVelocity.normalize().multiplyScalar(this.getPlayer().state.walkSpeed);

        // shift the position of the object by inputVelocity
        // this.getBody().applyForce(threeVectorToCannon(inputVelocity));
        // this.getBody().force.normalize().
        this.getBody().position.x += inputVelocity.x;
        this.getBody().position.z += inputVelocity.z;

        // handle animation
        this.getPlayer().determineAnimation(inputVelocity);

        this.state.lastTimeStamp = timeStamp;
    };
};

export default FPSControls;