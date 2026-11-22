import { T } from '@start9labs/start-sdk'
import type { manifest as nextexplorerManifest } from 'nextexplorer-startos/startos/manifest'
import { sdk } from './sdk'

// ttyd serves the browser terminal here; the proxy gates it with basic auth.
export const ttydPort = 7681

// Reticulum's TCP Server Interface, seeded into the RNS config at install.
export const rnsPort = 4242

export const uiUsername = 'admin'

// HOME=/data in the image, so ~/.reticulum, ~/.nomadnetwork and ~/Downloads all
// live on this one volume. A function, so every caller chains onto a fresh
// builder.
export const mainMounts = () =>
  sdk.Mounts.of().mountVolume({
    volumeId: 'main',
    subpath: null,
    mountpoint: '/data',
    readonly: false,
  })

// Where NextExplorer folders are mounted (read-only) when the website source is
// NextExplorer; the node-settings config points pages_path / files_path here.
export const siteMountpoints = {
  pages: '/mnt/nextexplorer/pages',
  files: '/mnt/nextexplorer/files',
}

export const mountNextexplorerFolder = (
  mounts: ReturnType<typeof sdk.Mounts.of>,
  folder: string,
  mountpoint: string,
) =>
  mounts.mountDependency<typeof nextexplorerManifest>({
    dependencyId: 'nextexplorer',
    volumeId: 'data',
    subpath: folder,
    mountpoint,
    readonly: true,
  })

// A read-only mount of a missing subpath fails, so a throwaway mount is the
// existence check (and also fails when NextExplorer is not installed).
export const canMountNextexplorer = (
  effects: T.Effects,
  folder: string | null,
) =>
  sdk.SubContainer.withTemp(
    effects,
    { imageId: 'nomadnet' },
    folder === null
      ? sdk.Mounts.of().mountDependency<typeof nextexplorerManifest>({
          dependencyId: 'nextexplorer',
          volumeId: 'data',
          subpath: null,
          mountpoint: '/mnt/check',
          readonly: true,
        })
      : mountNextexplorerFolder(sdk.Mounts.of(), folder, '/mnt/check'),
    'check-nextexplorer',
    async () => true,
  ).catch((e) => {
    console.warn(e)
    return false
  })

// "Files/nomadnet/pages/" and "/Files/nomadnet/pages" both mean the same folder.
export const normalizeFolder = (folder: string) =>
  folder.trim().replace(/^\/+|\/+$/g, '')

// The Reticulum config the package seeds at install, and restores from the
// "Reset Network Configuration" action. After that the file belongs to the user:
// Nomad Network's own Interfaces page edits it.
export const defaultRnsConfig = `# Reticulum configuration, seeded by the StartOS package.
# Edit interfaces from Nomad Network's Interfaces page (or by hand) and restart
# the service. The "Reset Network Configuration" action restores this file.

[reticulum]
  # Route traffic for other peers: your phones and laptops can reach the wider
  # mesh through this node.
  enable_transport = Yes
  share_instance = Yes
  instance_name = default
  panic_on_interface_error = No

  # Learn about connectable interfaces announced on the network, and keep up to
  # three of them connected automatically.
  discover_interfaces = Yes
  autoconnect_discovered_interfaces = 3

[logging]
  loglevel = 4

[interfaces]

  # Other Reticulum clients and nodes connect here with a TCP Client Interface.
  [[StartOS TCP Server]]
    type = TCPServerInterface
    enabled = Yes
    listen_ip = 0.0.0.0
    listen_port = ${rnsPort}
`

// Nomad Network's config is ConfigObj with single-bracket sections only. These
// helpers touch one key at a time and leave comments and every other line as
// the user (or upstream's defaults) wrote them.
const sectionHeader = /^\s*\[([^\[\]]+)\]\s*$/

function sectionRange(lines: string[], section: string) {
  const start = lines.findIndex((l) => l.match(sectionHeader)?.[1] === section)
  if (start === -1) return null
  let end = lines.length
  for (let ii = start + 1; ii < lines.length; ii++) {
    if (sectionHeader.test(lines[ii])) {
      end = ii
      break
    }
  }
  return { start, end }
}

function keyLine(line: string, key: string) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/)
  return m && m[1] === key ? m[2] : null
}

export function getIniValue(
  text: string,
  section: string,
  key: string,
): string | null {
  const lines = text.split('\n')
  const range = sectionRange(lines, section)
  if (!range) return null
  for (let ii = range.start + 1; ii < range.end; ii++) {
    const value = keyLine(lines[ii], key)
    if (value !== null) return value.replace(/^(["'])(.*)\1$/, '$2')
  }
  return null
}

export function setIniValues(
  text: string,
  section: string,
  values: Record<string, string>,
): string {
  const lines = text.split('\n')
  let range = sectionRange(lines, section)
  if (!range) {
    if (lines.length && lines[lines.length - 1].trim() !== '') lines.push('')
    lines.push(`[${section}]`)
    range = { start: lines.length - 1, end: lines.length }
  }
  for (const [key, value] of Object.entries(values)) {
    let found = false
    for (let ii = range.start + 1; ii < range.end; ii++) {
      if (keyLine(lines[ii], key) !== null) {
        lines[ii] = `${key} = ${value}`
        found = true
        break
      }
    }
    if (!found) {
      lines.splice(range.start + 1, 0, `${key} = ${value}`)
      range.end++
    }
  }
  return lines.join('\n')
}

export function deleteIniKeys(
  text: string,
  section: string,
  keys: string[],
): string {
  const lines = text.split('\n')
  const range = sectionRange(lines, section)
  if (!range) return text
  const kept = lines.filter(
    (line, ii) =>
      ii <= range.start ||
      ii >= range.end ||
      !keys.some((key) => keyLine(line, key) !== null),
  )
  return kept.join('\n')
}

// ConfigObj reads an unquoted value up to a comma or `#` and rejects one opening
// with `'`; double-quote those, and refuse `"` itself (the action's input pattern).
export function iniString(value: string): string {
  return /[,#']|^\s|\s$/.test(value) ? `"${value}"` : value
}

// ttyd also demands this in each socket's first message, readable only same-origin.
export const ttydCommand = (password: string): T.CommandType => [
  'ttyd',
  '--port',
  String(ttydPort),
  '--credential',
  `${uiUsername}:${password}`,
  // Errors and warnings only: ttyd logs the credential at notice level.
  '--debug',
  '3',
  '--writable',
  '--ping-interval',
  '30',
  '-t',
  'titleFixed=Nomad Network',
  '-t',
  'disableLeaveAlert=true',
  '-t',
  'enableSixel=true',
  // Nomad Network captures the mouse, so a plain drag never selects text.
  // xterm.js forces a selection with Shift-drag, and on macOS only with
  // Option-drag when this is on; ttyd copies any selection to the clipboard.
  '-t',
  'macOptionClickForcesSelection=true',
  'tmux',
  'attach-session',
  '-t',
  'nomadnet',
]
