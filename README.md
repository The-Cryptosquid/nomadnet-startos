<p align="center">
  <img src="icon.png" alt="Nomad Network Logo" width="21%">
</p>

# Nomad Network on StartOS

> Everything not listed in this document should behave the same as upstream
> Nomad Network. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

[Nomad Network](https://github.com/markqvist/NomadNet) is an encrypted, off-grid mesh communicator and page-hosting node built on Reticulum and LXMF. Upstream is a terminal application; this package keeps its text UI running permanently on the server, serves it to the browser through a password-protected web terminal, and seeds a configuration that makes the server a hosting node, LXMF propagation node and Reticulum transport node out of the box.

The icon is the Reticulum project logo; Nomad Network itself publishes no logo.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

The image is built by this package's `Dockerfile`, because upstream's published container image is amd64-only. It is the official slim Python image with Nomad Network (and its `rns` and `lxmf` dependencies) installed from PyPI, plus `tmux`, `nano`, and the static `ttyd` release binary (checksum-verified).

| Item          | Value                                                                                   |
| ------------- | --------------------------------------------------------------------------------------- |
| Image source  | Custom `Dockerfile` (pip-installed `nomadnet` on slim Python)                           |
| Architectures | x86_64, aarch64                                                                         |
| Entrypoint    | None used; each daemon sets its own command                                             |
| Environment   | `HOME=/data`, so `~/.reticulum`, `~/.nomadnetwork` and `~/Downloads` land on the volume |

One subcontainer, `nomadnet-sub`, runs both daemons, because ttyd reaches the tmux server through its socket in the container's `/tmp`:

- **`nomadnet`** runs `nomadnet-session`: it starts a detached tmux session named `nomadnet` running the text UI (`nomadnet`) in a loop, so quitting the UI from the browser restarts it after 3 seconds. On stop it sends the UI SIGINT and waits up to 10 seconds for LXMF to persist its state.
- **`terminal`** runs `ttyd` on port 7681, attaching each browser tab to that same tmux session (`tmux attach-session -t nomadnet`). Every open tab shares one screen. Because Nomad Network captures the mouse (`mouse_enabled = True`), a plain drag never selects text; ttyd runs with `macOptionClickForcesSelection=true` so that Shift-drag (Windows/Linux) or Option-drag (macOS) forces a selection, which ttyd copies to the clipboard on release.

When **Website Source** is set to NextExplorer, the chosen NextExplorer folders are mounted read-only into `nomadnet-sub` at `/mnt/nextexplorer/pages` and `/mnt/nextexplorer/files`, and `nomadnet-session` creates an empty folder at any of those paths that could not be mounted, so Nomad Network starts (serving an empty site) instead of crashing on a missing `pages_path`.

To inspect a running install: `start-cli package attach nomadnet -n nomadnet-sub -- rnstatus` (Reticulum interface status, through the shared instance), or `-- tail -50 /data/.nomadnetwork/logfile`.

## Volume and Data Layout

Everything lives on one volume, `main`, mounted at `/data`.

| Path (in the volume)          | Contents                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `store.json`                  | StartOS-side state: the web terminal password                                                    |
| `.nomadnetwork/config`        | Nomad Network config                                                                             |
| `.nomadnetwork/storage/`      | Primary identity, peer settings, conversations, LXMF router state and propagation message store  |
| `.nomadnetwork/storage/pages` | Pages your node serves (micron `.mu` files, or executable scripts)                               |
| `.nomadnetwork/storage/files` | Files your node serves                                                                           |
| `.nomadnetwork/logfile`       | Nomad Network and Reticulum log (the text UI owns the terminal, so nothing reaches StartOS logs) |
| `.reticulum/config`           | Reticulum config: transport, discovery and interfaces                                            |
| `.reticulum/storage/`         | Transport identity, path tables, known destinations                                              |
| `Downloads/`                  | Files saved from pages and messages                                                              |

NextExplorer folders used by **Website Source** are not on this volume; they stay in NextExplorer's `data` volume and are only mounted read-only.

No database server; LXMF keeps its state in SQLite and flat files under `.nomadnetwork/storage/lxmf`.

## File Models

The package writes two upstream config files and its own `store.json`, all as raw text or JSON so that comments and keys it does not manage survive.

- **`.reticulum/config`** (ConfigObj INI with nested `[[interface]]` sections). Written whole at install with `enable_transport = Yes`, `share_instance = Yes`, `discover_interfaces = Yes`, `autoconnect_discovered_interfaces = 3`, `panic_on_interface_error = No`, and one interface, `[[StartOS TCP Server]]` (`TCPServerInterface` on `0.0.0.0:4242`). Upstream's default `AutoInterface` is not included. After install the file belongs to the user and to Nomad Network's own **Interfaces** page; the package never rewrites it again except through **Reset Network Configuration**, which replaces it with the install-time content. Hand edits survive restarts and updates.
- **`.nomadnetwork/config`** (ConfigObj INI, single-level sections). Seeded at install from the installed version's own default config, with three keys changed: `[node] enable_node = yes`, `[node] disable_propagation = no`, and `[textui] glyphs = unicode` (a browser terminal has no Nerd Font). Afterwards two actions write it, each editing only its own `[node]` lines in place: **Node Settings** owns `enable_node`, `node_name`, `disable_propagation` and `message_storage_limit`; **Website Source** owns `pages_path`, `files_path`, `page_refresh_interval` and `file_refresh_interval` (it removes all four, then sets `pages_path = /mnt/nextexplorer/pages` and `page_refresh_interval`, plus the two files keys when a files folder is chosen; choosing Built-in leaves all four removed, which is upstream's default). Nothing is re-asserted on start; edits from the text UI's **Config** page survive until the owning action next runs.
- **`store.json`** holds `uiPassword`, the credential the StartOS proxy enforces on the web terminal, and `site`, the Website Source choice (`local`, or `nextexplorer` with the pages folder, optional files folder and rescan minutes). `main` reads `site` reactively, so saving a different choice restarts the service.

If either config file is deleted, Nomad Network recreates its own upstream default on next start (for `.reticulum/config` that means `AutoInterface` only, no TCP server, transport off) — run **Reset Network Configuration** and **Node Settings** to restore the package's shape.

## Dependencies

One optional dependency. Reticulum peers, including other Reticulum services on the same server, are reached over the network, not declared.

- **NextExplorer** — optional, enabled only while **Website Source** is set to NextExplorer. Kind `exists`: only its files are needed, so it does not have to be running and no health checks are required. Its `data` volume is mounted read-only, one mount per chosen folder (`/mnt/nextexplorer/pages`, and `/mnt/nextexplorer/files` if set). Folder paths are relative to that volume, so they start with a NextExplorer location name, usually `Files`.

## Network Access and Interfaces

Two interfaces are exported.

| Interface id | Name                 | Type  | Port | Protocol                    | Purpose                                                                                      |
| ------------ | -------------------- | ----- | ---- | --------------------------- | -------------------------------------------------------------------------------------------- |
| `terminal`   | Web Terminal         | `ui`  | 7681 | HTTP + websocket (ttyd)     | The Nomad Network text UI in a browser, behind HTTP basic auth enforced by the StartOS proxy |
| `rns`        | Reticulum TCP Server | `p2p` | 4242 | Raw TCP (Reticulum framing) | Where other Reticulum clients and nodes connect with a `TCPClientInterface`                  |

The basic-auth gate covers every address of the `terminal` binding, including LAN addresses. The username is always `admin`. `rns` is a plain TCP listener with no TLS; Reticulum encrypts its own traffic end to end. If the user removes or moves the TCP server interface in the Reticulum config, `rns` answers nothing.

Outbound, Nomad Network connects to whatever peers the user configures and, with discovery on, to up to three discovered interfaces at a time.

## Installation and First-Run Flow

Install seeds both config files (see [File Models](#file-models)) using a temporary container to print upstream's default Nomad Network config. The first start creates the primary identity, the LXMF delivery and propagation destinations, and the transport identity.

The service cannot start until the web terminal password is set (see [Tasks](#tasks)). There is no account and no setup wizard. Because the package seeds the config, Nomad Network does not treat the first start as a first run: the text UI opens on Conversations rather than the Guide (the Guide stays in the menu). The display name defaults to "Anonymous Peer" and is changed from the UI's Network section.

A fresh install has **no peers**: it accepts inbound connections on 4242 and listens for interface-discovery announces, but those only arrive once it is connected to something. The user adds a first `TCPClientInterface` from the text UI's **Interfaces** page (that page has no `bootstrap_only` option; set it by editing `.reticulum/config` if wanted), which then reports "Restart required". Choosing **Quit** in the text UI satisfies that: the session loop relaunches Nomad Network with the new interfaces within about 3 seconds, without restarting the service. No public entrypoint is pre-configured, following upstream's guidance against hard-coded entrypoints.

## Actions

Five actions, all user-facing and all available whether the service is running or not.

- **Node Information** (`node-info`). Run it to see and copy the user's own addresses without opening the text UI. Read-only: in a throwaway container with the `main` volume mounted read-only, it loads `.nomadnetwork/storage/identity` and derives the destination hashes Nomad Network uses — `lxmf.delivery` (LXMF address), `nomadnetwork.node` (node address) and `lxmf.propagation` (propagation node address) — and reads the display name from the msgpack file `.nomadnetwork/storage/peersettings` (or its `.bak`; `Anonymous Peer` if neither exists). The node name comes from `[node] node_name`, falling back to upstream's `<display name>'s Node`. Returns display name and LXMF address always; node name and node address only while `enable_node` is true; the propagation address only while `disable_propagation` is also false (upstream starts the propagation node only on a hosting node). Values are copyable. Fails with a message if the identity file does not exist yet (the service has never started). Repeat-safe.
- **Set Web Terminal Password** (`set-password`; shown as "Reset Web Terminal Password" once a password exists). Run it at install (a task requires it) or whenever the password is lost. It generates a 32-character password, stores it in `store.json`, and the proxy gate switches to it immediately — the old password stops working and the service is not restarted. Returns username `admin` and the password (masked, copyable). Repeat-safe; every run replaces the password.
- **Node Settings** (`node-settings`). Run it to name the node, stop or start hosting, turn the propagation node off or on, or cap the propagation store (default 2000 MB). It edits the four `[node]` keys listed in [File Models](#file-models) and restarts the service if it is running, which closes open web-terminal sessions for a few seconds. The form is prefilled from the file, so changes made from the text UI's Config page show up here. Repeat-safe. Fails with a message if the config file does not exist yet.
- **Website Source** (`website-source`). Run it to serve the node's pages (and optionally its downloadable files) from folders managed in NextExplorer, or to switch back to the built-in folders. Before saving it checks with a throwaway read-only mount that NextExplorer is installed and every chosen folder exists, and refuses with an error otherwise. It rewrites the four site keys listed in [File Models](#file-models), stores the choice in `store.json`, and the service restarts if it is running and the choice changed. Repeat-safe; saving the same choice does nothing. Built-in pages and files are left untouched in `.nomadnetwork/storage/` and come back when switching back.
- **Reset Network Configuration** (`reset-network-config`). Run it when an interface change stops Nomad Network from starting (the health check shows it not running, and the log shows Reticulum failing on an interface), or to return to the package's network defaults. It overwrites `.reticulum/config` with the install-time content — every added interface is lost — and restarts the service if it is running. Identity, messages, pages and files are untouched. Repeat-safe.

## Tasks

One task.

- **Set Web Terminal Password** — raised at every init while `store.json` has no `uiPassword`, which in practice means right after install. Severity `critical`: the service cannot start until it is done, because the web terminal would otherwise be served without a password. Cleared by running the action; it returns only if `store.json` loses the password.

## Health Checks

Three checks always, and a fourth while Website Source is NextExplorer.

- **Nomad Network** (`nomadnet` daemon, 30 s grace). Runs `pgrep -f '/usr/local/bin/nomadnet$'` inside the container. Failure means the text UI process is not running at that moment. A failure lasting a few seconds is the UI restarting (someone pressed Quit, or it crashed); a failure that persists means it is crash-looping — read `.nomadnetwork/logfile`; a Reticulum interface error at startup is the usual cause, fixed by correcting the interface or running **Reset Network Configuration**.
- **Web Terminal** (`terminal` daemon). TCP check on 7681. Fails only if ttyd is not listening; it starts after the `nomadnet` daemon is healthy.
- **Reticulum TCP Server** (`rns-tcp`, 60 s grace). TCP check on 4242. Failure while Nomad Network is running means the Reticulum config has no TCP server on port 4242 — the user removed or renamed it, or the config was regenerated by upstream after deletion. Messaging over other interfaces can still work; inbound connections to the `rns` interface cannot.
- **Website** (`website`, only while Website Source is NextExplorer; checked once per start). Reports the NextExplorer folder being served. It fails when, at the last start, NextExplorer was not installed or a chosen folder did not exist: that folder was not mounted, so the node serves an empty site (Nomad Network's placeholder home page) or offers no files. Create the folder in NextExplorer (or install it) and restart, or change Website Source. A folder deleted while the service runs is not noticed until the next start.

## Backups and Restore

The `main` volume is backed up as files (`ofVolumes`), so the identities, config, conversations, pages and files are all captured.

Excluded:

- `.nomadnetwork/storage/lxmf/messagestore/` — the propagation node's store of messages held for other peers. Messages waiting there for the user's own devices are lost on restore too.
- `.nomadnetwork/storage/cache/` and `.reticulum/storage/cache/` — page, image and announce caches, rebuilt from the network.

NextExplorer folders used by Website Source are never part of this package's backup; NextExplorer backs up its own data. A restore brings back the Website Source choice, so the site reappears once NextExplorer and those folders exist again.

After a restore the node comes back with the same addresses. Path tables age out and are relearned from announces; no manual step is needed.

## Limitations and Differences

1. The text UI is the only client interface: there is no graphical UI. All browser tabs share one terminal screen and one cursor.
2. No radio, serial or USB interfaces (RNode/LoRa, KISS TNCs, serial links): the container has no device access. Network interfaces configured from the Interfaces page, such as TCP clients, are what this package supports.
3. Upstream's default `AutoInterface` (LAN multicast discovery) is not configured; it cannot see the LAN from inside the StartOS container network.
4. No peers are pre-configured; the node is isolated until the user adds one.
5. Nomad Network's log goes to `.nomadnetwork/logfile`, not to the StartOS service log, because the text UI owns the terminal.
6. Nerd Font glyphs are switched to plain Unicode, since the browser terminal has no Nerd Font.
7. Pages served from NextExplorer are read-only to Nomad Network: edit them in NextExplorer. The text UI's **My Node** editor can open them but cannot save. Pages added or removed in NextExplorer appear after the rescan interval; edits to existing pages are read on every request.
8. Dynamic pages (executable files) run only if the file has its executable bit set; keep them in the built-in pages folder if you need them.
9. Upstream is a public mirror that does not take issues or offer support; bugs in Nomad Network itself have nowhere to be reported.

---

## Quick Reference for AI Consumers

```yaml
package_id: nomadnet
image: custom Dockerfile (python slim + pip nomadnet + tmux + ttyd)
architectures: [x86_64, aarch64]
subcontainers: [nomadnet-sub]
volumes:
  main: /data
file_models:
  - main:/.reticulum/config
  - main:/.nomadnetwork/config
  - main:/store.json
startos_managed_env_vars:
  - HOME
dependencies: [nextexplorer (optional, exists)]
interfaces:
  terminal: { type: ui, port: 7681 }
  rns: { type: p2p, port: 4242 }
actions:
  - node-info
  - set-password
  - node-settings
  - website-source
  - reset-network-config
tasks:
  - { action: set-password, severity: critical }
health_checks:
  - nomadnet
  - terminal
  - rns-tcp
  - website # only while Website Source is NextExplorer
```
