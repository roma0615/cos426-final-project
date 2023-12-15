import BaseScene from "./scenes/BaseScene";
import Level00Scene from "./scenes/Level00Scene";
import Level01Scene from "./scenes/Level01Scene";
import Level02Scene from "./scenes/Level02Scene";

class Game {
  levels: BaseScene[];
  activeLevel: number;

  constructor() {
    this.levels = [
        new Level00Scene(this),
        new Level01Scene(this),
        new Level02Scene(this),
    ];
    this.activeLevel = 0;
  }

  getLevel() {
    return this.levels[this.activeLevel];
  }

  setLevel(level: number) {
    this.activeLevel = level;
    console.log(`Advancing level to ${this.activeLevel}`)
  }

}

export default Game;