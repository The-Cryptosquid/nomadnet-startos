import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  canMountNextexplorer,
  mainMounts,
  mountNextexplorerFolder,
  rnsPort,
  siteMountpoints,
  ttydCommand,
  ttydPort,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Nomad Network!'))

  // Without it neither the proxy gate nor ttyd asks for a login.
  const password = await storeJson.read((s) => s?.uiPassword).const(effects)
  if (!password)
    throw new Error(
      i18n(
        'The web terminal has no login of its own. Set a password before starting Nomad Network.',
      ),
    )

  // ==================================
  // NextExplorer website folders
  // ==================================
  const site = await storeJson.read((s) => s?.site).const(effects)

  let mounts = mainMounts()
  // Mountpoints nomadnet's config points at; nomadnet-session creates any that
  // could not be mounted as empty folders, so a missing folder serves an empty
  // site instead of crashing nomadnet at startup.
  const siteDirs: string[] = []
  const siteProblems: string[] = []

  if (site?.selection === 'nextexplorer') {
    const folders = [
      [site.value.pagesFolder, siteMountpoints.pages],
      [site.value.filesFolder, siteMountpoints.files],
    ] as const
    const installed = await canMountNextexplorer(effects, null)
    for (const [folder, mountpoint] of folders) {
      if (!folder) continue
      siteDirs.push(mountpoint)
      if (installed && (await canMountNextexplorer(effects, folder))) {
        mounts = mountNextexplorerFolder(mounts, folder, mountpoint)
      } else if (installed) {
        siteProblems.push(
          i18n(
            'The folder "${folder}" was not found in NextExplorer, so nothing from it is served. Create it there and restart Nomad Network, or change Website Source.',
            { folder },
          ),
        )
      }
    }
    if (!installed) {
      siteProblems.push(
        i18n(
          'NextExplorer is not installed, so your node serves an empty site. Install it and restart Nomad Network, or switch Website Source back to Built-in.',
        ),
      )
    }
  }

  const sub = sdk.SubContainer.of(
    effects,
    { imageId: 'nomadnet' },
    mounts,
    'nomadnet-sub',
  )

  const daemons = sdk.Daemons.of(effects)
    .addDaemon('nomadnet', {
      subcontainer: sub,
      exec: {
        command: ['nomadnet-session'],
        env: { SITE_DIRS: siteDirs.join(' ') },
      },
      ready: {
        display: i18n('Nomad Network'),
        gracePeriod: 30_000,
        fn: () =>
          sdk.healthCheck.runHealthScript(
            ['pgrep', '-f', '/usr/local/bin/nomadnet$'],
            sub,
            {
              message: () => i18n('Nomad Network is running'),
              errorMessage: i18n(
                'Nomad Network is not running. It restarts on its own; check the logs if this persists.',
              ),
            },
          ),
      },
      requires: [],
    })
    .addDaemon('terminal', {
      subcontainer: sub,
      exec: { command: ttydCommand(password) },
      ready: {
        display: i18n('Web Terminal'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, ttydPort, {
            successMessage: i18n('The web terminal is ready'),
            errorMessage: i18n('The web terminal is not ready'),
          }),
      },
      requires: ['nomadnet'],
    })
    .addHealthCheck('rns-tcp', {
      ready: {
        display: i18n('Reticulum TCP Server'),
        gracePeriod: 60_000,
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, rnsPort, {
            successMessage: i18n(
              'Accepting Reticulum connections on port 4242',
            ),
            errorMessage: i18n(
              'Nothing is listening on port 4242. Re-add a TCP Server Interface on that port, or run Reset Network Configuration.',
            ),
          }),
      },
      requires: ['nomadnet'],
    })

  if (site?.selection !== 'nextexplorer') return daemons

  // Computed once above from what could be mounted; it cannot change until
  // main runs again, so check it once.
  const pagesFolder = site.value.pagesFolder
  return daemons.addHealthCheck('website', {
    ready: {
      display: i18n('Website'),
      gracePeriod: 0,
      trigger: sdk.trigger.onceTrigger,
      fn: async () =>
        siteProblems.length
          ? { result: 'failure', message: siteProblems.join(' ') }
          : {
              result: 'success',
              message: i18n('Serving pages from NextExplorer: ${folder}', {
                folder: pagesFolder,
              }),
            },
    },
    requires: [],
  })
})
