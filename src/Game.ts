import BaseScene from "./scenes/BaseScene";
import Level00Scene from "./scenes/Level00Scene";
import Level01Scene from "./scenes/Level01Scene";
import Level02Scene from "./scenes/Level02Scene";
import Level03Scene from "./scenes/Level03Scene";
import Level04Scene from "./scenes/Level04Scene";

class Game {
  levelClasses: any[];
  levels: BaseScene[];
  activeLevel: number;

  constructor() {
    this.levelClasses = [Level00Scene, Level01Scene, Level02Scene, Level03Scene, Level04Scene];
    this.levels = this.levelClasses.map((L) => new L(this));
    this.activeLevel = 0;
  }

  getLevel() {
    return this.levels[this.activeLevel];
  }

  restart() {
    this.levels[this.activeLevel] = new (this.levelClasses[this.activeLevel])(this);
  }

  setLevel(level: number) {
    this.activeLevel = level;
    console.log(`Advancing level to ${this.activeLevel}`)
  }

}

export default Game;