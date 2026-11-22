import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '1.5.0:1',
  releaseNotes: {
    en_US:
      'The Web Terminal accepts connections only from its own page. Resetting the Web Terminal password restarts Nomad Network if it is running.',
    es_ES:
      'La terminal web solo acepta conexiones desde su propia página. Restablecer la contraseña de la terminal web reinicia Nomad Network si está en ejecución.',
    de_DE:
      'Das Web-Terminal nimmt nur Verbindungen von seiner eigenen Seite an. Das Zurücksetzen des Web-Terminal-Passworts startet Nomad Network neu, falls es läuft.',
    pl_PL:
      'Terminal webowy przyjmuje połączenia tylko z własnej strony. Zresetowanie hasła terminala webowego uruchamia ponownie Nomad Network, jeśli działa.',
    fr_FR:
      "Le terminal web n'accepte que les connexions venant de sa propre page. La réinitialisation du mot de passe du terminal web redémarre Nomad Network s'il est en cours d'exécution.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
