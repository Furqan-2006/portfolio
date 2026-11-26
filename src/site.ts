// Single place for site-wide facts. Edit here, not in pages.
export const site = {
  name: 'Furqan',
  fullName: 'Muhammad Furqan Sheikh',
  tagline: 'Systems engineer, with security as a layer on top.',
  intro:
    'I build low-level and distributed systems in C, C++, Python and Go, and treat security as a property of the design rather than a feature added at the end.',
  email: 'furqansh.2oo6@gmail.com',
  github: 'https://github.com/Furqan-2006',
  // Shown on the home page. Keep to three short, true lines; edit when they change.
  currently: [
    { label: 'Lifeline', text: 'Finishing the course implementation and the emulation evaluation.', href: '/projects/lifeline/' },
    { label: 'Nexus', text: 'Starting core implementation, beginning with the repository setup and the determinism library.', href: '/projects/nexus/' },
    { label: 'FlightOps', text: 'Planned over the winter break: a Go drone fleet platform on MAVLink and PX4 simulation.' },
  ] as { label: string; text: string; href?: string }[],
};
