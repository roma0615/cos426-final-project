import { Vector3 } from 'three';

import * as CANNON from 'cannon-es';

import Player from '../objects/Player';
import LevelObject from '../objects/LevelObject';
import BaseScene from './BaseScene';
import Land from '../objects/Land';
import Game from '../Game';

export enum COLLISION_GROUPS {
    PLAYER = 1,
    SCENE = 2,
    OBJECTS = 4,
    // GROUP4 = 8
}

class Level04Scene extends BaseScene {

    constructor(game: Game) {
        // Call parent BaseScene() constructor
        super(game);

        const player1 = new Player(0, this, new CANNON.Vec3(-7, 2, -2.5), this.clock);
        const player2 = new Player(1, this, new CANNON.Vec3(-7, 2, 2.5), this.clock);

        // update state
        this.state.players.push(player1);
        this.state.players.push(player2);
        this.state.activePlayer = 0;

        // --- LEVEL COMPONENTS --- //
        // const level = new Land(this, true);
        const level = new LevelObject(this, 'level4', {
            bodyType: CANNON.Body.STATIC,
            collisionGroup: COLLISION_GROUPS.SCENE,
            generateShapesOfChildren: true,
        });


        // start pad
        const pad = new LevelObject(this, 'landing_pad', {
            collideCallback: (self, e) => {
                const otherObj = this.getObjByBody(LevelObject.getOtherFromContact(self, e));
                if (otherObj instanceof Player) {
                    // advance the level!
                    console.log("Advancing level");
                    this.game.setLevel(1);
                }
                // otherBody.parent
                // this.getActivePlayer().state.gravity = this.getActivePlayer().state.gravity.scale(-1);
            },
            offset: new Vector3(10, 0, 0),
        });

        // cube for pushing into place
        const cube = new LevelObject(this, 'cube', {
            mass: 1,
            collideCallback: (self, e) => {
                const otherObj = this.getObjByBody(LevelObject.getOtherFromContact(self, e));
                // demo: invert gravity once u touch the red box
                if (otherObj instanceof Player) {
                    const p = otherObj as Player;
                    p.setGravity(p.state.gravity.scale(-1));
                }
            },
            offset: new Vector3(6, 0, -2),
        });

        this.add(level, cube, player1, player2, pad);
        // this.add(level, player1, player2);
    }
}

export default Level04Scene;
