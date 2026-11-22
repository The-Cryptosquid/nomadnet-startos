export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting Nomad Network!': 0,
  'Nomad Network': 1,
  'Nomad Network is running': 2,
  'Nomad Network is not running. It restarts on its own; check the logs if this persists.': 3,
  'Web Terminal': 4,
  'The web terminal is ready': 5,
  'The web terminal is not ready': 6,
  'Reticulum TCP Server': 7,
  'Accepting Reticulum connections on port 4242': 8,
  'Nothing is listening on port 4242. Re-add a TCP Server Interface on that port, or run Reset Network Configuration.': 9,

  // interfaces.ts
  'The Nomad Network text interface in your browser: messages, the page browser, your node, and network interfaces': 10,
  'Where your other Reticulum devices and peers connect with a TCP Client Interface': 11,

  // init
  'Preparing Nomad Network': 12,
  'The web terminal has no login of its own. Set a password before starting Nomad Network.': 13,

  // actions/setPassword.ts
  'Reset Web Terminal Password': 14,
  'Set Web Terminal Password': 15,
  'Generate the password for the Nomad Network web terminal. The username is always "admin". Running this again replaces the existing password.': 16,
  'The current password stops working as soon as this runs.': 17,
  'Web Terminal Password Set': 18,
  'Your browser asks for these the next time you open the Web Terminal. Save the password now. It is not shown again.': 19,
  Username: 20,
  Password: 21,

  // actions/nodeSettings.ts
  'Host a Node': 22,
  'Announce this server as a Nomad Network node that serves the pages and files you publish. Turn off to run only the messaging client.': 23,
  'Node Name': 24,
  'The name other peers see for your node. Leave empty to use your display name followed by "\'s Node".': 25,
  'Double quotation marks and line breaks are not allowed': 26,
  'Propagation Node': 27,
  'Store encrypted messages for peers while they are offline, including your own phone or laptop. Requires Host a Node.': 28,
  'Propagation Storage Limit': 29,
  'The most disk space the propagation node uses for stored messages. When it is full, LXMF removes stored messages to make room.': 30,
  'Node Settings': 31,
  'Choose whether this server hosts a node, its name, and whether it acts as a propagation node. Saving restarts Nomad Network if it is running.': 32,
  'Nomad Network has not created its configuration yet. Start the service once, then try again.': 33,

  // actions/resetNetworkConfig.ts
  'Reset Network Configuration': 34,
  'Replace the Reticulum configuration with the package default: transport enabled, interface discovery on, and the TCP server on port 4242. Use this if an interface change stops Nomad Network from starting.': 35,
  'Every interface you added is removed and Nomad Network restarts. Your identity, messages, pages, and files are untouched.': 36,
  'Network Configuration Reset': 37,
  'The default Reticulum configuration is back in place. Add your peers again from the Interfaces page in the web terminal.': 38,
  // website source (actions/websiteSource.ts, main.ts)
  'Must be a folder path such as Files/nomadnet/pages': 39,
  Source: 40,
  "Where your node's pages and files come from.\n- Built-in: folders inside Nomad Network, edited from My Node in the Web Terminal\n- NextExplorer: folders you manage in NextExplorer, served read-only and never copied": 41,
  'Built-in': 42,
  NextExplorer: 43,
  'Pages Folder': 44,
  'The NextExplorer folder holding your pages, starting with the location name (usually Files). Put your home page in it as index.mu.': 45,
  'Files Folder': 46,
  'Optional. A NextExplorer folder whose files your node offers for download. Leave empty to keep the built-in files folder.': 47,
  'Rescan Interval': 48,
  'How often Nomad Network looks for pages and files you added or removed in NextExplorer. Edits to a page that already exists are read fresh on every request.': 49,
  'Website Source': 50,
  "Serve your node's pages and files from NextExplorer instead of the built-in folders. Changing it restarts Nomad Network if it is running.": 51,
  'NextExplorer is not installed. Install it, then try again.': 52,
  'The folder "${folder}" was not found in NextExplorer. Create it there, or check the path.': 53,
  'The folder "${folder}" was not found in NextExplorer, so nothing from it is served. Create it there and restart Nomad Network, or change Website Source.': 54,
  'NextExplorer is not installed, so your node serves an empty site. Install it and restart Nomad Network, or switch Website Source back to Built-in.': 55,
  Website: 56,
  'Serving pages from NextExplorer: ${folder}': 57,
  // node information (actions/nodeInfo.ts)
  'Node Information': 58,
  "Show your LXMF address, your display name, and your node's name and address, ready to copy.": 59,
  'Nomad Network has not created its identity yet. Start the service once, then try again.': 60,
  'Display Name': 61,
  'The name people see next to your messages. Change it in the Network section of the Web Terminal.': 62,
  'LXMF Address': 63,
  'Your messaging address. Share it so people can message you from Sideband, MeshChat, Columba, or Nomad Network.': 64,
  'The name your node announces. Change it with Node Settings.': 65,
  'Node Address': 66,
  "Open this address in a page browser to visit your node's pages and files.": 67,
  'Propagation Node Address': 68,
  'Set this as the propagation node on your other devices so they collect messages that arrived while they were offline.': 69,
  'Hosting is off, so your node and propagation node are not running. Turn hosting on with Node Settings.': 70,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
