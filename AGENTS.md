# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

- Match the text UI process with `pgrep -f '/usr/local/bin/nomadnet$'`, keeping the `$`. Without
  it the pattern also matches `/bin/sh /usr/local/bin/nomadnet-session` (PID 1), so the health
  check passes with Nomad Network dead and the shutdown `pkill` signals the session script itself.
- Don't model `.reticulum/config` with `FileHelper.ini`: it has nested `[[interface]]` sections
  the `ini` library mangles, and Nomad Network's Interfaces page co-owns the file. The package
  writes it whole, and only at install and from the reset action.
- Keep the `SITE_DIRS` `mkdir -p` in `nomadnet-session`. Nomad Network creates only its default
  pages folder; a custom `pages_path` that does not exist (an unmounted NextExplorer folder) makes
  it crash-loop on `FileNotFoundError` at startup.
- Smoke-test the image without a box: build it, mount a scratch directory at `/data` holding
  seeded configs, and run `nomadnet-session` (plus `ttyd … tmux attach-session -t nomadnet`).
- In Python run inside the image, import msgpack as `RNS.vendor.umsgpack`, as Nomad Network does. A bare
  `import msgpack` fails: the package isn't installed on its own.
- `.github/workflows/tagAndRelease.yml` is Start9's standard one; keep it that way. It runs on the
  Start9-Community fork, where `REFERENCE_REGISTRY` decides whether a version is new. Don't add a
  "tag already exists" check: the fork inherits this repo's tags, so such a check would stop merges
  from publishing. Tag and Release is disabled on The-Cryptosquid's own repo, whose GitHub releases
  are made by hand.
