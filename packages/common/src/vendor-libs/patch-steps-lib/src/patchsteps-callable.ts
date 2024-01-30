import { appliers, Callable, callables, State } from './patchsteps-patch';

export function register(id: string, callable: Callable) {
  if (id.length === 0) {
    throw Error('Id must not be empty.');
  }

  if (typeof callable !== 'function') {
    throw Error('Callable must be a function.');
  }
  if (callables.has(id)) {
    throw Error(`Callable ${id} is already registered.`);
  }
  callables.set(id, callable);
}

appliers['CALL'] = async function (state: State) {
  const id = this['id'];
  const args = this['args'];

  // Any falsey values are invalid
  if (!id) {
    state.debugState.throwError('ValueError', 'Id must be set.');
  }

  if (!callables.has(id)) {
    state.debugState.throwError('ValueError', `${id} is not a valid callable.`);
  }

  const callable: Callable | undefined = callables.get(id);

  try {
    await callable!(state, args);
  } catch (e) {
    if (e !== state.debugState) {
      // So they know what happened
      console.error(e);
      state.debugState.throwError('ValueError', `Callable ${id} did not properly throw an error.`);
    }
    // They properly threw the error
    throw e;
  }
};
