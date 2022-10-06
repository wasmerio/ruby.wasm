import { WASI } from "@wasmer/wasi";
import { WasmFs } from "@wasmer/wasmfs";
import { RubyVM } from "./index";

export const DefaultRubyVM = async (
  rubyModule: WebAssembly.Module,
  options: { consolePrint: boolean } = { consolePrint: true }
) => {
  const wasmFs = new WasmFs();
  const wasi = new WASI({
    bindings: {
      ...WASI.defaultBindings,
      fs: wasmFs.fs,
    },
  });

  if (options.consolePrint) {
    const originalWriteSync = wasmFs.fs.writeSync.bind(wasmFs.fs);
    wasmFs.fs.writeSync = function () {
      let fd: number = arguments[0];
      let text: string;
      if (arguments.length === 4) {
        text = arguments[1];
      } else {
        let buffer = arguments[1];
        text = new TextDecoder("utf-8").decode(buffer);
      }
      const handlers = {
        1: (line: string) => console.log(line),
        2: (line: string) => console.warn(line),
      };
      if (handlers[fd]) handlers[fd](text);
      return originalWriteSync(...arguments);
    };
  }

  const vm = await RubyVM.load(wasi, rubyModule);
  // Manually call `_initialize`, which is a part of reactor model ABI,
  // because the WASI polyfill doesn't support it yet.
  console.log(vm.guest.instance.exports._initialize);
  (vm.guest.instance.exports._initialize as Function)();
  vm.initialize();

  return {
    vm,
    wasi,
    fs: wasmFs,
  };
};
