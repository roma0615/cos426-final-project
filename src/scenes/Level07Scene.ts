import { Mesh, MeshPhongMaterial, Quaternion, SphereGeometry, SpotLight, Vector3 } from 'three';

import * as CANNON from 'cannon-es';

import Player from '../objects/Player';
import BaseScene, { COLLISION_GROUPS } from './BaseScene';
import Game from '../Game';
import LevelObject from '../objects/LevelObject';

class Level07Scene extends BaseScene {

    constructor(game: Game) {
        // Call parent BaseScene() constructor
        super(game);

        const pUpdateHandler = (self: Player, _timeStamp: number) => {
            const grav = self.body.position.clone();
            grav.normalize();
            self.state.gravity.copy(grav.scale(-9.81));
        }
        const player1 = new Player(0, this, this.clock, new CANNON.Vec3(3, 10, 0), new CANNON.Vec3(0, -9.82, 0), pUpdateHandler);
        const player2 = new Player(1, this, this.clock, new CANNON.Vec3(-3, 10, 0), new CANNON.Vec3(0, -9.82, 0), pUpdateHandler); // upside down gravity

        const thanks = new LevelObject(this, 'thanks', {
            bodyType: CANNON.Body.STATIC,
            collisionGroup: COLLISION_GROUPS.SCENE,
            generateShapesOfChildren: true,
        })

        // update state
        this.state.players.push(player1);
        this.state.players.push(player2);
        this.state.activePlayer = 0;

        // --- LEVEL COMPONENTS --- //

        const planetGeom = new SphereGeometry(9, 24, 36);
        const planetMat = new MeshPhongMaterial({ color: 0x663322 })
        const planet = new Mesh(planetGeom, planetMat);
        const planetBody = new CANNON.Body({
            type: CANNON.Body.STATIC,
            material: this.materials.ground,
            shape: new CANNON.Sphere(9),
            collisionFilterGroup: COLLISION_GROUPS.OBJECTS,
            collisionFilterMask: COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.SCENE | COLLISION_GROUPS.OBJECTS,
        });
        this.world.addBody(planetBody);

        const light = new SpotLight( 0xffffdd, 50, 0, Math.PI / 2, 0, 1);
        light.position.set(0, -24, 0);
        light.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(0, -1, 0)));

        this.add(player1, player2, planet, thanks, light);
        // this.add(level, player1, player2);
    }

    winAction() {
        alert("YOU WIN!")
    }
}

export default Level07Scene;
