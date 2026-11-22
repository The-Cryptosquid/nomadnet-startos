import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'nomadnet',
  title: 'Nomad Network',
  license: 'GPL-3.0',
  packageRepo: 'https://github.com/Start9-Community/nomadnet-startos',
  upstreamRepo: 'https://github.com/markqvist/NomadNet',
  marketingUrl: 'https://reticulum.network/',
  donationUrl: 'https://liberapay.com/Reticulum/',
  description: { short, long },
  volumes: ['main'],
  images: {
    nomadnet: {
      source: { dockerBuild: {} },
      arch: ['x86_64', 'aarch64'],
    },
  },
})
