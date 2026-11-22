# Nomad Network

## Documentation

- [Nomad Network README](https://github.com/markqvist/NomadNet/blob/master/README.md) — upstream overview, features, and community tools for nodes.
- [Reticulum Manual](https://reticulum.network/manual/*) — the networking stack underneath: interfaces, connecting to other networks, transport nodes.

Nomad Network's full user guide is built into the program: open the Web Terminal and choose **Guide** in the top menu.

## What you get on StartOS

- **Web Terminal** — Nomad Network's text interface in your browser: conversations, the page browser, your node's pages, live channels, and network interfaces. It keeps running when you close the tab, so your node stays online and messages keep arriving.
- **Reticulum TCP Server** — an address your own phone, laptop, or a friend's node connects to, so they reach the mesh through your server.
- Out of the box your server **hosts a node** (pages and files), acts as a **propagation node** (holds encrypted messages for you and your peers while you are offline), and **routes traffic** for devices that connect to it.

## Getting set up

1. Run **Set Web Terminal Password** when prompted. Save the username (`admin`) and the password it shows you.
2. Start the service, then open the **Web Terminal** interface and sign in with those credentials.
3. Give yourself a name: in the **Network** section, edit **Name** and save.
4. Connect to other people. Your node starts out connected to nobody.
   1. Find an entry point to join: a friend's node, a community you trust, or a public one from [directory.rns.recipes](https://directory.rns.recipes/) or [rmap.world](https://rmap.world/).
   2. Open the **Interfaces** section and add a **TCP Client Interface** with that host and port.
   3. When it says a restart is required, choose **Quit** in the top menu. Nomad Network starts again by itself with the new interface a few seconds later.
5. Run **Node Settings** to give your node a name other people will see.
6. Run **Node Information** to copy your LXMF address and share it with the people you want to hear from.

## Using Nomad Network

### Copying text from the Web Terminal

Nomad Network uses the mouse for its own buttons and lists, so a normal click-and-drag doesn't select text. To select an address or anything else on screen:

- **Windows and Linux:** hold **Shift** while you drag.
- **macOS:** hold **Option** while you drag.

The selection is copied to your clipboard as soon as you release the mouse (a ✂ briefly appears). Paste it anywhere with your usual paste shortcut.

### Connecting your phone or laptop

Point your other Reticulum apps (Sideband, Columba, MeshChat, or Nomad Network on another computer) at this server: add a TCP Client interface using the host and port shown on the **Reticulum TCP Server** interface. To have your devices pick up messages from your own server while they were offline, set this server as their propagation node. Run **Node Information** to copy its address.

If you publish this service through a tunnel to keep your home IP private, send its outbound traffic through that tunnel too. Otherwise the nodes and entry points your server connects to see your home IP. If you use the tunnel for another reason, such as a port your router can't forward, there is nothing to change.

### Hosting pages and files

Your node serves what you put in its pages and files folders. Open **My Node** in the Web Terminal to write pages in the built-in page editor. The Guide covers the page format (micron) and dynamic pages.

### Hosting your site from NextExplorer

You can keep your pages in NextExplorer instead, and edit them there like any other files.

1. In NextExplorer, create a folder for your pages, for example `nomadnet/pages` in your **Files** location, and put your home page in it as `index.mu`. Optionally create a second folder for files you want to offer for download.
2. Run **Website Source**, choose **NextExplorer**, and enter the folder paths starting with the location name, for example `Files/nomadnet/pages`.
3. Save. Nomad Network restarts and serves your pages from that folder.

Edits to a page show up the next time someone opens it. New or deleted pages show up after the **Rescan Interval** you chose. Nomad Network only reads these folders, so the **My Node** editor can't save pages that live in NextExplorer. To go back to the built-in folders, run **Website Source** again and choose **Built-in**; your built-in pages are still there.

### Actions

- **Node Information** — see and copy your display name, your LXMF address (for people to message you), and your node's name, address, and propagation node address.
- **Node Settings** — set your node's name, turn hosting or the propagation node on or off, and cap how much disk space stored messages may use. Saving restarts Nomad Network if it is running, which briefly disconnects the Web Terminal.
- **Website Source** — serve your pages and files from folders in NextExplorer, or switch back to the built-in folders.
- **Reset Web Terminal Password** — generate a new password. The old one stops working right away, and Nomad Network restarts if it is running, which briefly disconnects the Web Terminal.
- **Reset Network Configuration** — use this if an interface change stops Nomad Network from starting. It puts the default network settings back, removes every interface you added, and restarts. Your identity, conversations, pages, and files are kept.

## Limitations

- Radio, LoRa (RNode), and serial interfaces can't be used, because the service has no access to the server's USB devices. Use network interfaces such as TCP.
- Every browser tab shows the same terminal screen, so two people typing at once will interfere with each other.
