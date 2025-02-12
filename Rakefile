require "rake"
require "json"
require "open-uri"

$LOAD_PATH << File.join(File.dirname(__FILE__), "lib")

require "ruby_wasm/rake_task"

Dir.glob("tasks/**.rake").each { |f| import f }

BUILD_SOURCES = {
  "head" => {
    type: "github",
    repo: "ruby/ruby",
    rev: "master",
    patches: [],
  },
}

FULL_EXTS = "bigdecimal,cgi/escape,continuation,coverage,date,dbm,digest/bubblebabble,digest,digest/md5,digest/rmd160,digest/sha1,digest/sha2,etc,fcntl,fiber,gdbm,json,json/generator,json/parser,nkf,objspace,pathname,psych,racc/cparse,rbconfig/sizeof,ripper,stringio,strscan,monitor,zlib"

BUILD_PROFILES = {
  "minimal"          => { debug: false, default_exts: "", user_exts: [] },
  "minimal-debug"    => { debug: true,  default_exts: "", user_exts: [] },
  "minimal-js"       => { debug: false, default_exts: "", user_exts: ["js", "witapi"] },
  "minimal-js-debug" => { debug: true,  default_exts: "", user_exts: ["js", "witapi"] },
  "full"             => { debug: false, default_exts: FULL_EXTS, user_exts: [] },
  "full-debug"       => { debug: true,  default_exts: FULL_EXTS, user_exts: [] },
  "full-js"          => { debug: false, default_exts: FULL_EXTS, user_exts: ["js", "witapi"] },
  "full-js-debug"    => { debug: true,  default_exts: FULL_EXTS, user_exts: ["js", "witapi"] },
}

BUILDS = [
  { src: "head", target: "wasm32-unknown-wasi", profile: "minimal" },
  { src: "head", target: "wasm32-unknown-wasi", profile: "minimal-debug" },
  { src: "head", target: "wasm32-unknown-wasi", profile: "minimal-js" },
  { src: "head", target: "wasm32-unknown-wasi", profile: "minimal-js-debug" },
  { src: "head", target: "wasm32-unknown-wasi", profile: "full" },
  { src: "head", target: "wasm32-unknown-wasi", profile: "full-debug" },
  { src: "head", target: "wasm32-unknown-wasi", profile: "full-js" },
  { src: "head", target: "wasm32-unknown-wasi", profile: "full-js-debug" },
  { src: "head", target: "wasm32-unknown-emscripten", profile: "minimal" },
  { src: "head", target: "wasm32-unknown-emscripten", profile: "full" },
]

LIB_ROOT = File.dirname(__FILE__)

TOOLCHAINS = {}

namespace :build do
  BUILDS.each do |params|
    name = "#{params[:src]}-#{params[:target]}-#{params[:profile]}"
    source = BUILD_SOURCES[params[:src]].merge(name: params[:src])
    debug = params[:debug]
    options = params
        .merge(BUILD_PROFILES[params[:profile]])
        .merge(src: source)
    options.delete :profile
    options.delete :user_exts
    options.delete :debug
    RubyWasm::BuildTask.new(name, **options) do |t|
      if debug
        t.crossruby.debugflags = %w[-g]
        t.crossruby.wasmoptflags = %w[-O3 -g]
        t.crossruby.ldflags = %w[-Xlinker --stack-first -Xlinker -z -Xlinker stack-size=16777216]
      else
        t.crossruby.debugflags = %w[-g0]
        t.crossruby.ldflags = %w[-Xlinker -zstack-size=16777216]
      end

      toolchain = t.toolchain
      t.crossruby.user_exts = BUILD_PROFILES[params[:profile]][:user_exts].map do |ext|
        srcdir = File.join(LIB_ROOT, "ext", ext)
        RubyWasm::CrossRubyExtProduct.new(srcdir, toolchain)
      end
      unless TOOLCHAINS.key? toolchain.name
        TOOLCHAINS[toolchain.name] = toolchain
      end
    end
  end
end
