import { WASI } from "@wasmer/wasi";
import { RubyVM } from "./index";

export const DefaultRubyVM = async (rubyModule: WebAssembly.Module) => {
  const wasi = new WASI();
  const vm = await RubyVM.load(wasi);
  vm.initialize();

  return {
    vm,
    wasi,
  };
};
