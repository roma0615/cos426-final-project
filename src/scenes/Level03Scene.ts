import { Quaternion, Vector3 } from 'three';

import * as CANNON from 'cannon-es';

import Player from '../objects/Player';
import LevelObject from '../objects/LevelObject';
import BaseScene, { COLLISION_GROUPS } from './BaseScene';
import Game from '../Game';

class Level03Scene extends BaseScene {

    constructor(game: Game) {
        // Call parent BaseScene() constructor
        super(game);

        const player1 = new Player(0, this, this.clock, new CANNON.Vec3(-7, 1, -2.5));
        const player2 = new Player(1, this, this.clock, new CANNON.Vec3(-7, 1, 2.5));

        // update state
        this.state.players.push(player1);
        this.state.players.push(player2);
        this.state.activePlayer = 0;

        // --- LEVEL COMPONENTS --- //
        const upsideDown = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(0, -1, 0));

        // const level = new Land(this, true);
        const level = new LevelObject(this, 'level3', {
            bodyType: CANNON.Body.STATIC,
            collisionGroup: COLLISION_GROUPS.SCENE,
            generateShapesOfChildren: true,
        });

        const gravityPadConfig = () => ({
            bodyType: CANNON.Body.STATIC,
            isTrigger: true,
            generateShapesOfChildren: true,
            collideCallback: (self: LevelObject, e: any) => {
                const otherObj = this.getObjByBody(LevelObject.getOtherFromContact(self, e));
                if (otherObj instanceof Player) {
                    const p = otherObj as Player;
                    // set gravity in the orientation of the pad
                    p.setGravity(self.body.vectorToWorldFrame(new CANNON.Vec3(0, 1, 0)).scale(9.82));
                }
            },
        });

        // gravity pad!!! omg
        const gravityPad = new LevelObject(this, 'gravity_pad', {
            ...gravityPadConfig(),
            offset: new Vector3(0, 0, 0),
        });
        const gravityPad2 = new LevelObject(this, 'gravity_pad', {
            ...gravityPadConfig(),
            offset: new Vector3(-7, 19, 7),
            quaternion: upsideDown,
        });

        // landing pad on the ceiling.
        const pad1 = new LevelObject(this, 'landing_pad1', {
            bodyType: CANNON.Body.STATIC,
            collideCallback: (self, e) => {
                const otherObj = this.getObjByBody(LevelObject.getOtherFromContact(self, e));
                if (otherObj.name == player1.name) {
                    this.state.p1OnPad = true;
                }
            },
            collideEndCallback: (_self, e) => {
                const otherObj = this.getObjByBody(e.body);
                if (otherObj.name == player1.name) {
                    this.state.p1OnPad = false;
                }
            },
            offset: new Vector3(-7, 19, 0),
            quaternion: upsideDown,
        });
        // landing pad
        const pad2 = new LevelObject(this, 'landing_pad2', {
            bodyType: CANNON.Body.STATIC,
            collideCallback: (self, e) => {
                const otherObj = this.getObjByBody(LevelObject.getOtherFromContact(self, e));
                if (otherObj.name == player2.name) {
                    this.state.p2OnPad = true;
                }
            },
            collideEndCallback: (_self, e) => {
                const otherObj = this.getObjByBody(e.body);
                if (otherObj.name == player2.name) {
                    this.state.p2OnPad = false;
                }
            },
            offset: new Vector3(7, 0, 0),
        });

        this.add(level, player1, player2, pad1, pad2, gravityPad, gravityPad2);
        // this.add(level, player1, player2);
    }
}

export default Level03Scene;
