import dat from 'dat.gui';
import { Scene, Color, Sphere, Vector3, SphereGeometry, Mesh } from 'three';

import * as CANNON from 'cannon-es';

import Player from '../objects/Player';
import Land from '../objects/Land';
import BasicLights from '../lights/BasicLights';
import FPSControls from '../objects/FPSControls';

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
        activePlayer?: Player;
    };
    timeStep: number;
    world: CANNON.World;

    constructor() {
        // Call parent Scene() constructor
        super();

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
            activePlayer: undefined,
        };

        // Set background to a nice color
        this.background = new Color(0x7ec0ee);

        // Add meshes to scene
        const land = new Land(this, true);
        const sphere = new Mesh(new SphereGeometry(0.3, 12, 12));
        sphere.position.set(5, 0, 0);
        const player1 = new Player(this, true, true);
        // const player2 = new Player(this, false); // TODO figure out how to initialize in diff place
        const lights = new BasicLights();

        // update state
        this.state.activePlayer = player1;

        this.add(land, sphere, player1, lights);

        // Populate GUI
        this.state.gui.add(this.state, 'rotationSpeed', -5, 5);
    }

    addBodyToWorld(object: CANNON.Body): void {
        this.world.addBody(object);
    }

    addToUpdateList(object: UpdateChild): void {
        this.state.updateList.push(object);
    }

    getActivePlayer(): Player | undefined {
        return this.state.activePlayer;
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
}

export default LevelScene;
