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
            this.getPlayer().setGravity(this.getPlayer().state.gravity.scale(-1));
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

        // move closer if walls in the way
        // const playerPos = this.getPlayer().position.clone().add(new Vector3(0, 0.5, 0));
        // const camPos = new Vector3();
        // this.camera.getWorldPosition(camPos)
        // const desiredPos = camPos.clone().setFromSphericalCoords(this.cameraDistance, this.state.cameraAngle.y, this.state.cameraAngle.x);
        // const result = new CANNON.RaycastResult();
        // this.game.getLevel().world.raycastClosest(threeVectorToCannon(playerPos), threeVectorToCannon(desiredPos), { collisionFilterMask: COLLISION_GROUPS.SCENE | COLLISION_GROUPS.OBJECTS }, result);
        // const resDist = Math.abs(result.distance + 1) < EPS ? this.cameraDistance * 10 : result.distance;
        // const dist = Math.max(1, Math.min(resDist * 0.75, this.cameraDistance));
        // this.camera.position.setFromSphericalCoords(dist, this.state.cameraAngle.y, this.state.cameraAngle.x);

        // next goal:  orient the player to appear the "right way up" according to its local gravity vector
        // useful variables
        const normGrav = cannonVecToThree(this.getPlayer().state.gravity);           // normalized gravity
        normGrav.normalize();
        const localUp = new CANNON.Vec3(0, 1, 0);                                    // up direction in local space
        const globalUp = threeVectorToCannon(normGrav).scale(-1);                    // up direction in WORLD SPACE
        const alignTop = new CANNON.Quaternion().setFromVectors(localUp, globalUp);  // rotation to convert from local to global
        // const gravAngle = 

        // 1) inital setting of quaternion to match gravity
        const alignTopCamera = cannonQuatToThree(alignTop.mult(new CANNON.Quaternion().setFromAxisAngle(localUp, -Math.PI / 2)));
        this.camera.quaternion.copy(new Quaternion());
        this.camera.applyQuaternion(alignTopCamera); // GOOD, KEEP THIS

        const spherePos = new Vector3().setFromSphericalCoords(this.cameraDistance, this.state.cameraAngle.y, this.state.cameraAngle.x).applyQuaternion(cannonQuatToThree(alignTop));
        const bodyPos = this.getBody().position;
        this.camera.position.copy(cannonVecToThree(bodyPos).add(spherePos));

        // have to reimplement lookAt with quaternions
        const camToBody = cannonVecToThree(bodyPos).sub(this.camera.position);
        // const lookAtBody = new Quaternion().setFromUnitVectors(new Vector3(1, 0, 0), camToBody).slerp(new Quaternion(), 0.5); // kinda works, rotates weird
        const angle = new Vector3(1, 0, 0).angleTo(camToBody); // signed angle?
        const axis = new Vector3(1, 0, 0).cross(camToBody).projectOnVector(cannonVecToThree(globalUp)).normalize();
        const lookAtBody = new Quaternion().setFromAxisAngle(axis, angle);
        this.camera.applyQuaternion(lookAtBody);



        // STILL HAVE TO FIX THIS

        // get direction of camera, since that impacts what "forward" means
        // get direction the camera is pointing in world space
        const cameraWorldDir = new Vector3();
        this.camera.getWorldDirection(cameraWorldDir);
        // subtract the "up" direction (based on gravity of player) projection and then normalize
        // movement correction subtracts out the movement in the direction of gravity (ie local up/down)
        const correction = cameraWorldDir.clone().projectOnVector(normGrav);
        const cameraWorldDirCorrected = cameraWorldDir.clone();
        cameraWorldDirCorrected.sub(correction).normalize();
        // why doesn't work for sideways movement??

        // TODO rotate player to look at camera and be oriented "upright" relative to its gravity
        // this.getBody().quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), this.state.cameraAngle.x + Math.PI / 2);
        const rotAroundGravAxis = new CANNON.Quaternion().setFromAxisAngle(
            localUp, // after applying alignTop, working in local space
            this.state.cameraAngle.x + Math.PI / 2
        );
        this.getBody().quaternion.copy(alignTop.mult(rotAroundGravAxis));
        // this.getBody().quaternion.copy(rotAroundGravAxis);
        // const globalDown = new CANNON.Vec3(0, -1, 0);
        // const angle = cannonVecToThree(globalDown).angleTo(normGrav);
        // console.log("Gravity angle (deg)", angle / Math.PI * 180);
        

        // Goal: convert velocity to world coordinates based on direction of camera
        // player's state.quat stores rotation of plane to WALK IN (canceling out movement in gravity direction)
        // this.getPlayer().state.quat.setFromUnitVectors(new Vector3(1, 0, 0), cameraWorldDirCorrected); // might be better when cameera position is fixed?
        inputVelocity.applyQuaternion(this.getPlayer().state.quat);
        inputVelocity.normalize().multiplyScalar(this.getPlayer().state.walkSpeed);

        // POSITION APPROACH
        this.getBody().position.x += inputVelocity.x;
        this.getBody().position.y += inputVelocity.y;
        this.getBody().position.z += inputVelocity.z;

        // handle animation
        this.getPlayer().determineAnimation(inputVelocity);

        this.state.lastTimeStamp = timeStamp;
    };
};

export default FPSControls;