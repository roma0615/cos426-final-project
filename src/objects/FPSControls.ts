import { MathUtils, Group, BoxGeometry, MeshBasicMaterial, Mesh, Quaternion, Vector3, Camera, Euler } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import TWEEN from 'three/examples/jsm/libs/tween.module.js';
import * as CANNON from 'cannon-es';

import LevelScene, { COLLISION_GROUPS } from '../scenes/BaseScene';
import { EPS, cannonQuatToThree, cannonVecToThree, threeQuatToCannon, threeVectorToCannon } from '../utils';
import BaseScene from '../scenes/BaseScene';
import Game from '../Game';

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
    game: Game;
    camera: Camera;
    cameraDistance: number;

    constructor (camera: Camera, game: Game) {
        // if (cannonBody === undefined) return;
        this.game = game;
        this.camera = camera;
        this.cameraDistance = 10;
        this.state = {
            velocityFactor: 0.2,
            keysPressed: new Set(), // keep track of keys pressed
            lastTimeStamp: 0,
            cameraAngle: {
                x: -Math.PI / 2,
                y: Math.PI / 3,
            }
        }

        // setup event listeners
        document.addEventListener("mousemove", this.onMouseMove.bind(this));
        document.addEventListener("keydown", this.onKeyDown.bind(this));
        document.addEventListener("keyup", this.onKeyUp.bind(this));
    }

    getPlayer() {
        return this.game.getLevel().getActivePlayer();
    }
    getBody() {
        return this.game.getLevel().getActivePlayer().body;
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

        // console.log(event);
        if (event.key == "r") { // restart level
            this.game.restart();
        }
        if (event.key == "g") { // flip gravity
            // this.getPlayer().setGravity(this.getPlayer().state.gravity.scale(-1));
            this.getPlayer().setGravity(new CANNON.Vec3(-2, -8, 0));
        }
        if (event.code == "ArrowRight") {
            this.game.setLevel(this.game.activeLevel+1);
        }
        if (event.code == "ArrowLeft") {
            this.game.setLevel(this.game.activeLevel-1);
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

        // inputVelocity is local space right now
        inputVelocity.set(0, 0, 0);

        // i know usually x is sideways but since y is up it is weird. so instead
        // if we make +/-x forward/backward, then +z is right and -z is left
        // and +/-y is up/down
        const { canJump } = this.getPlayer().state;
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
        if (this.state.keysPressed.has(" ") && canJump) {
            // jump and remove
            // apply impluse vertically (IN THE LOCAL SPACE, according to player's gravity)
            const upLocal = this.getPlayer().state.gravity.scale(-this.getPlayer().state.jumpVelocity);
            // remove any jump vel in jump direction 
            const jumpVel = cannonVecToThree(this.getBody().velocity).projectOnVector(cannonVecToThree(upLocal));
            this.getBody().velocity.vsub(threeVectorToCannon(jumpVel));
            // now apply new jump impulse
            this.getBody().applyImpulse(upLocal.scale(0.1));

            this.getPlayer().state.canJump = false;
            this.getPlayer().body.linearDamping = 0.2;
        }

        // inputVelocity is in local space

        // use setFromSpherical
        // rotate around axis

        // put camera behind the player
        // this.state.cameraAngle.x = this.getPlayer().state.cameraAngle.x;
        // this.state.cameraAngle.y = this.getPlayer().state.cameraAngle.y;
        this.state.cameraAngle.x = MathUtils.lerp(this.state.cameraAngle.x, this.getPlayer().state.cameraAngle.x, 0.15);
        this.state.cameraAngle.y = MathUtils.lerp(this.state.cameraAngle.y, this.getPlayer().state.cameraAngle.y, 0.15);

        // next goal: orient the player to appear the "right way up" according to its local gravity vector
        // useful variables
        const normGrav = cannonVecToThree(this.getPlayer().state.gravity);           // normalized gravity
        normGrav.normalize();
        const localUp = new CANNON.Vec3(0, 1, 0);                                    // up direction in local space
        const globalUp = threeVectorToCannon(normGrav).scale(-1);                    // up direction in WORLD SPACE
        const alignTop = new CANNON.Quaternion().setFromVectors(localUp, globalUp);  // rotation to convert from local to global
        const alignTopT = cannonQuatToThree(alignTop);

        // 1) inital setting of quaternion to match gravity
        const alignTopCamera = cannonQuatToThree(alignTop.mult(new CANNON.Quaternion().setFromAxisAngle(localUp, -Math.PI / 2)));
        this.camera.quaternion.copy(new Quaternion());
        this.camera.applyQuaternion(alignTopCamera); // GOOD, KEEP THIS

        const spherePos = new Vector3().setFromSphericalCoords(this.cameraDistance, this.state.cameraAngle.y, this.state.cameraAngle.x).applyQuaternion(cannonQuatToThree(alignTop));
        const bodyPos = this.getBody().position;
        this.camera.position.copy(cannonVecToThree(bodyPos).add(spherePos));

        // have to reimplement lookAt with quaternions
        // PART 1: around globalUp axis (moving mouse left/right)
        const camToBody = cannonVecToThree(bodyPos).sub(this.camera.position);

        // camBody: need to remove the part that's in line with the axis
        const axis = cannonVecToThree(globalUp);
        const camToBodyOrth = camToBody.clone().sub(camToBody.clone().projectOnVector(axis));
        const angle = new Vector3(1, 0, 0).applyQuaternion(alignTopT).angleTo(camToBodyOrth); // how to get signed angle?
        const cross = new Vector3(1, 0, 0).applyQuaternion(alignTopT).cross(camToBodyOrth); // how to get signed angle?
        const flip = axis.dot(cross) >= -EPS ? 1 : -1;
        const signedAngle = flip * angle; // should be between [0, 2pi] now
        const lookAtBody = new Quaternion().setFromAxisAngle(axis, signedAngle);
        this.camera.applyQuaternion(lookAtBody);

        // PART 2: around camera's horizontal axis (pitch)
        let cameraWorldDir = new Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        cameraWorldDir.normalize(); // ok so this is right
        const pitchAxis = new Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion); // +x is right in local camera space
        // can use camToBody now, since there should be no more parallel component we don't want
        const angle2 = cameraWorldDir.clone().angleTo(camToBody); // how to get signed angle?
        const cross2 = cameraWorldDir.clone().cross(camToBody); // how to get signed angle?
        const flip2 = pitchAxis.dot(cross2) >= -EPS ? 1 : -1;
        const signedAngle2 = flip2 * angle2; // should be between [0, 2pi] now
        const lookAtBody2 = new Quaternion().setFromAxisAngle(pitchAxis, signedAngle2);
        this.camera.applyQuaternion(lookAtBody2);
        // kinda working here..


        // rotate the player so he's facing away from you
        const rotAroundGravAxis = new CANNON.Quaternion().setFromAxisAngle(
            localUp, // after applying alignTop, working in local space
            this.state.cameraAngle.x + Math.PI / 2
        );
        this.getBody().quaternion.copy(alignTop.mult(rotAroundGravAxis));

        // STILL HAVE TO FIX THIS
        // Goal: convert velocity to world coordinates based on direction of camera
        cameraWorldDir = new Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        cameraWorldDir.normalize();
        // subtract the "up" direction (based on gravity of player) projection and then normalize
        // cameraWorldDirOrthToGravity takes the direction of camera and removes any component along the gravity axis
        const gravAxisComponent = cameraWorldDir.clone().projectOnVector(normGrav);
        const cameraWorldDirOrthToGravity = cameraWorldDir.clone().sub(gravAxisComponent).normalize();

        // const movementRot = alignTopT.clone();
        // movementRot.multiply(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), cannonVecToThree(globalUp).normalize())); // orientation
        // console.log(cameraWorldDirOrthToGravity);
        // movementRot.multiply(new Quaternion().setFromUnitVectors(new Vector3(1, 0, 0), cameraWorldDirOrthToGravity)); // plane of movement

        // TODO fix
        // inputVelocity.applyQuaternion(movementRot);
        inputVelocity.normalize().multiplyScalar(this.getPlayer().state.walkSpeed);

        const inputVelocityGlobal = new CANNON.Vec3();
        CANNON.Transform.vectorToWorldFrame(this.getBody().quaternion, threeVectorToCannon(inputVelocity), inputVelocityGlobal);


        // POSITION APPROACH
        this.getBody().position.x += inputVelocityGlobal.x;
        this.getBody().position.y += inputVelocityGlobal.y;
        this.getBody().position.z += inputVelocityGlobal.z;

        // handle animation
        this.getPlayer().determineAnimation(inputVelocity);

        this.state.lastTimeStamp = timeStamp;
    };
};

export default FPSControls;