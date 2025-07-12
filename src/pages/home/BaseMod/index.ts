export abstract class BaseMod {
  abstract destroy(): void
}

export class ModManager {
  private mods: BaseMod[] = []

  constructor(mods: BaseMod[]) {
    this.mods = mods
  }

  register(mod: BaseMod) {
    this.mods.push(mod)
  }

  destroy() {
    this.mods.forEach((mod) => {
      mod.destroy()
    })
  }
}
