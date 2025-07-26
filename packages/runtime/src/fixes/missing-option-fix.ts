ig.module('ccloader-runtime.stdlib.missing-option-fix')
  .requires('game.feature.model.options-model', 'game.feature.menu.gui.options.options-types')
  .defines(() => {
    // I'm not particularly sure what the full extent of occurrences of this bug
    // are, but there is one case I am absolutely certain of.
    // If a mod adds an option to an existing vanilla button group (e.g. the
    // Pixel Size option), and a user selects this option, their settings are
    // updated to reflect this. (e.g. `pixel-size` is set to `5`)
    // However, if the mod is later uninstalled, the setting obviously does not
    // change, so whenever opening the menu containing this option the game now
    // tries to fetch the value for a fifth button, gets `undefined` from
    // `this.buttons[...]`, and passes it to `ig.ButtonGroup#setPressedFocusGui`
    // which tries calling a method directly on the passed object. This crashes
    // the game.
    // So, let's take the liberty of resetting broken options for the user
    // should this ever occur.
    sc.OptionModel.inject({
      onStorageGlobalLoad(globals) {
        this.parent(globals)

        for (const key in sc.OPTIONS_DEFINITION) {
          const option = sc.OPTIONS_DEFINITION[key]
          if (option.type !== 'BUTTON_GROUP') continue

          const currentValue = this.get(key) as number
          if (!Object.values(option.data).includes(currentValue)) {
            this.set(key, option.init)
          }
        }

        if (this.hasChanged) {
          this.persistOptions();
        }
      },
    })
  })