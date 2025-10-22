// Site-wide constants
export const SITE_CONFIG = {
  name: 'Incident Response Chaos Club',
  shortName: 'IRCC',
  description: 'Incident Response Chaos Club - embracing the chaos of cybersecurity through DFIR, incident response, and security research.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://irchaos.club',
  links: {
    discord: 'https://discord.gg/hGPsPGMa',
    github: 'https://github.com/irchaosclub',
  },
} as const;
