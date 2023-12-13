import dat from 'dat.gui';
import { Scene, Color, Sphere, Vector3, SphereGeometry, Mesh, Clock } from 'three';

import * as CANNON from 'cannon-es';

import Player from '../objects/Player';
import Land from '../objects/Land';
import BasicLights from '../lights/BasicLights';

// Define an object type which describes each object in the update list
type UpdateChild = {
    // Each object *might* contain an update function
    update?: (timeStamp: number) => void;
};

class LevelScene extends Scene {
    // Define the type of the state field
    state: {
        gui: dat.GUI;
        rotationSpeed: number;
        updateList: UpdateChild[];
        players: Player[];
        activePlayer: number;
    };
    timeStep: number;
    world: CANNON.World;
    clock: Clock;

    constructor() {
        // Call parent Scene() constructor
        super();

        this.clock = new Clock();
        
        // Init world
        this.timeStep = 1 / 60;
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0), // TODO: this should somehow be player specific.. maybe two worlds one for each player?
        }); 

        // Init state
        this.state = {
            gui: new dat.GUI(), // Create GUI for scene
            rotationSpeed: 1,
            updateList: [],
            players: [],
            activePlayer: 0,
        };

        // Set background to a nice color
        this.background = new Color(0x7ec0ee);

        // Add meshes to scene
        const land = new Land(this, true);
        const player1 = new Player(this, true, new CANNON.Vec3(0, 15, 0), this.clock); // TODO make where the player spawns encoded in the level
        const player2 = new Player(this, true, new CANNON.Vec3(0, 15, 5), this.clock);
        const lights = new BasicLights();

        // update state
        this.state.players.push(player1);
        this.state.players.push(player2);
        this.state.activePlayer = 0;

        this.add(land, player1, player2, lights);

        window.addEventListener('keydown', this.keydownHandler.bind(this), false);
    }

    addBodyToWorld(object: CANNON.Body): void {
        this.world.addBody(object);
    }

    addToUpdateList(object: UpdateChild): void {
        this.state.updateList.push(object);
    }

    getActivePlayer(): Player {
        return this.state.players[this.state.activePlayer];
    }

    update(timeStamp: number): void {
        const { updateList } = this.state;
        // this.rotation.y = (rotationSpeed * timeStamp) / 10000;
        this.world.step(this.timeStep);

        // Call update for each object in the updateList
        for (const obj of updateList) {
            if (obj.update !== undefined) {
                obj.update(timeStamp);
            }
        }
    }
    
    keydownHandler (event) {
        if (event.key == "x") { // x to switch characters
            this.state.activePlayer = 1 - this.state.activePlayer;
        }
    }
}

export default LevelScene;
