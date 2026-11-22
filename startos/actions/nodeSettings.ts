import { nomadnetConfig } from '../fileModels/nomadnetConfig'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { getIniValue, iniString, setIniValues } from '../utils'

const { InputSpec, Value } = sdk

const isYes = (v: string | null, fallback: boolean) =>
  v === null ? fallback : /^(yes|true|on|1)$/i.test(v)

const inputSpec = InputSpec.of({
  enableNode: Value.toggle({
    name: i18n('Host a Node'),
    description: i18n(
      'Announce this server as a Nomad Network node that serves the pages and files you publish. Turn off to run only the messaging client.',
    ),
    default: true,
  }),
  nodeName: Value.text({
    name: i18n('Node Name'),
    description: i18n(
      'The name other peers see for your node. Leave empty to use your display name followed by "\'s Node".',
    ),
    required: false,
    default: null,
    maxLength: 64,
    patterns: [
      {
        regex: '[^"\\n\\r]*',
        description: i18n(
          'Double quotation marks and line breaks are not allowed',
        ),
      },
    ],
  }),
  propagation: Value.toggle({
    name: i18n('Propagation Node'),
    description: i18n(
      'Store encrypted messages for peers while they are offline, including your own phone or laptop. Requires Host a Node.',
    ),
    default: true,
  }),
  storageLimit: Value.number({
    name: i18n('Propagation Storage Limit'),
    description: i18n(
      'The most disk space the propagation node uses for stored messages. When it is full, LXMF removes stored messages to make room.',
    ),
    required: true,
    default: 2000,
    min: 10,
    max: 100000,
    step: 10,
    integer: true,
    units: 'MB',
    placeholder: null,
  }),
})

export const nodeSettings = sdk.Action.withInput(
  'node-settings',
  {
    name: i18n('Node Settings'),
    description: i18n(
      'Choose whether this server hosts a node, its name, and whether it acts as a propagation node. Saving restarts Nomad Network if it is running.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },
  inputSpec,

  async ({ effects }) => {
    const config = (await nomadnetConfig.read().once()) ?? ''
    const name = getIniValue(config, 'node', 'node_name')
    return {
      enableNode: isYes(getIniValue(config, 'node', 'enable_node'), false),
      nodeName: name && name.toLowerCase() !== 'none' ? name : null,
      propagation: !isYes(
        getIniValue(config, 'node', 'disable_propagation'),
        true,
      ),
      storageLimit: Math.round(
        Number(getIniValue(config, 'node', 'message_storage_limit') ?? 2000) ||
          2000,
      ),
    }
  },

  async ({ effects, input }) => {
    const config = await nomadnetConfig.read().once()
    if (config === null) {
      throw new Error(
        i18n(
          'Nomad Network has not created its configuration yet. Start the service once, then try again.',
        ),
      )
    }
    const name = input.nodeName?.trim()
    await nomadnetConfig.write(
      effects,
      setIniValues(config, 'node', {
        enable_node: input.enableNode ? 'yes' : 'no',
        node_name: name ? iniString(name) : 'None',
        disable_propagation: input.propagation ? 'no' : 'yes',
        message_storage_limit: String(input.storageLimit),
      }),
    )
    await sdk.restart(effects)
    return null
  },
)
