// Single place for site-wide facts. Edit here, not in pages.
export const site = {
  name: 'Furqan',
  fullName: 'Muhammad Furqan Sheikh',
  specialties: ['Systems Engineering', 'Linux Internals', 'Systems Security'],
  tagline: 'Systems engineer.|Security by design.',
  intro: 'I build low-level, security-minded systems in C, C++ and Python.',
  email: 'furqansh.2oo6@gmail.com',
  github: 'https://github.com/Furqan-2006',
  // Shown on the home page. Keep to three short, true lines; edit when they change.
  currently: [
    { label: 'Lifeline', text: 'Finishing the course project and the emulation tests.', href: '/projects/lifeline/' },
    { label: 'Nexus', text: 'Building the core. The deterministic core and the tick loop work and are tested. The gateway and agent runtime are next.', href: '/projects/nexus/' },
    { label: 'FlightOps', text: 'Planned for the winter break: a drone fleet platform in Go, using MAVLink and PX4 simulation.' },
  ] as { label: string; text: string; href?: string }[],
};
