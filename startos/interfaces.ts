import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { rnsPort, ttydPort, uiUsername } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  // ttyd hands whoever connects a shell-equivalent terminal, so the StartOS
  // proxy gates it with HTTP basic auth. Read reactively so the gate follows the
  // credential the moment the set-password action writes it.
  const password = await storeJson.read((s) => s?.uiPassword).const(effects)

  const terminalOrigin = await sdk.MultiHost.of(effects, 'terminal').bindPort(
    ttydPort,
    {
      protocol: 'http',
      // Unset only until the critical set-password task is done, and the service
      // cannot start before then.
      proxy: {
        auth: password
          ? {
              type: 'basic',
              credentials: [{ username: uiUsername, password }],
              realm: 'Nomad Network',
            }
          : null,
      },
    },
  )
  const terminal = sdk.createInterface(effects, {
    name: i18n('Web Terminal'),
    id: 'terminal',
    description: i18n(
      'The Nomad Network text interface in your browser: messages, the page browser, your node, and network interfaces',
    ),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    // Left null although the gate has a username: the SDK would fold it into the
    // address as admin@<host>, and Chromium refuses userinfo in a top-level
    // navigation. The browser still prompts for it.
    username: null,
    path: '',
    query: {},
  })
  const terminalReceipt = await terminalOrigin.export([terminal])

  const rnsOrigin = await sdk.MultiHost.of(effects, 'rns').bindPort(rnsPort, {
    protocol: null,
    addSsl: null,
    preferredExternalPort: rnsPort,
    secure: { ssl: false },
  })
  const rns = sdk.createInterface(effects, {
    name: i18n('Reticulum TCP Server'),
    id: 'rns',
    description: i18n(
      'Where your other Reticulum devices and peers connect with a TCP Client Interface',
    ),
    type: 'p2p',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  return [terminalReceipt, await rnsOrigin.export([rns])]
})
