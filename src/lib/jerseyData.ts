
export interface KitVariant {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  baseImage: string; // Ghost mannequin base
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  fontFamily: string;
  leagueId: string;
  sponsor?: string;
  kits: KitVariant[];
}

export interface League {
  id: string;
  name: string;
  logo: string;
  sport: 'football' | 'baseball' | 'rugby';
}

export const CATEGORIES = [
  { id: 'football', name: 'Football', icon: 'Trophy' },
  { id: 'baseball', name: 'Baseball', icon: 'Activity' },
  { id: 'rugby', name: 'Rugby Union', icon: 'Shield' }
];

export const LEAGUES: League[] = [
  { id: 'epl', name: 'Premier League', logo: 'https://media.api-sports.io/football/leagues/39.png', sport: 'football' },
  { id: 'laliga', name: 'LaLiga', logo: 'https://media.api-sports.io/football/leagues/140.png', sport: 'football' },
  { id: 'saudi', name: 'Saudi Pro League', logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWksIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI5MDAiIGZvbnQtc2l6ZT0iMzIiIGZpbGw9IiMwZjE3MmEiPlNQTDwvdGV4dD48L3N2Zz4=', sport: 'football' },
  { id: 'npfl', name: 'NPFL', logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWksIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI5MDAiIGZvbnQtc2l6ZT0iMjgiIGZpbGw9IiMwZjE3MmEiPk5QRkw8L3RleHQ+PC9zdmc+', sport: 'football' },
  { id: 'international', name: 'International', logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjAwIDEwMCI+PGVsbGlwc2UgY3g9IjEwMCIgY3k9IjUwIiByeD0iOTAiIHJ5PSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMGYxNzJhIiBzdHJva2Utd2lkdGg9IjQiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InN5c3RlbS11aSwgc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9IjkwMCIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzBmMTcyYSI+SU5URVJOQVRJT05BTDwvdGV4dD48L3N2Zz4=', sport: 'football' },
  { id: 'mlb', name: 'MLB', logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWksIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI5MDAiIGZvbnQtc2l6ZT0iMzIiIGZpbGw9IiMwZjE3MmEiPk1MQjwvdGV4dD48L3N2Zz4=', sport: 'baseball' },
  { id: 'rugby-world', name: 'Rugby Union', logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHJ4PSIyMCIgZmlsbD0iIzBiMjI0MCIvPjxwYXRoIGQ9Ik0gMzAsNTAgQyAzMCwzMiA3MCwzMiA3MCw1MCBDIDcwLDY4IDMwLDY4IDMwLDUwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwZDJmZiIgc3Ryb2tlLXdpZHRoPSI0Ii8+PHBhdGggZD0iTSA1MCwyMiBMIDUwLDc4IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMGQyZmYiIHN0cm9rZS13aWR0aD0iMiIvPjx0ZXh0IHg9IjUwIiB5PSI0OCIgZm9udC1mYW1pbHk9InN5c3RlbS11aSwgc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9IjkwMCIgZm9udC1zaXplPSIxMyIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+V09STEQ8L3RleHQ+PHRleHQgeD0iNTAiIHk9IjYyIiBmb250LWZhbWlseT0ic3lzdGVtLXVpLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjEwIiBmaWxsPSIjMDBkMmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5SVUdCWTwvdGV4dD48L3N2Zz4=', sport: 'rugby' }
];

export const getLogoUrl = (url: string) => {
  if (!url || url === '') return 'https://via.placeholder.com/150?text=LOGO';
  if (url.startsWith('data:')) return url;
  
  if (url.startsWith('http')) {
    // Proxy all external images through our secure server-side proxy
    // to bypass CORS, Referer checks, and sandboxed iframe constraints blockages.
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  
  return url;
};
export const TEAMS: Team[] = [
  // --- PREMIER LEAGUE ---
  {
    id: 'arsenal',
    name: 'Arsenal',
    leagueId: 'epl',
    logo: 'https://media.api-sports.io/football/teams/42.png',
    sponsor: 'EMIRATES',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#EF0107', secondaryColor: '#ffffff', accentColor: '#063672', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#000000', secondaryColor: '#ffffff', accentColor: '#EF0107', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'man-city',
    name: 'Man City',
    leagueId: 'epl',
    logo: 'https://media.api-sports.io/football/teams/50.png',
    sponsor: 'ETIHAD',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#6CABDD', secondaryColor: '#ffffff', accentColor: '#ffffff', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#1A315E', secondaryColor: '#ffffff', accentColor: '#EED610', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'liverpool',
    name: 'Liverpool',
    leagueId: 'epl',
    logo: 'https://media.api-sports.io/football/teams/40.png',
    sponsor: 'Standard Chartered',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#C8102E', secondaryColor: '#ffffff', accentColor: '#ffffff', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#00B2A9', secondaryColor: '#CCF3EC', accentColor: '#000000', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'man-united',
    name: 'Man United',
    leagueId: 'epl',
    logo: 'https://media.api-sports.io/football/teams/33.png',
    sponsor: 'Snapdragon',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#DA291C', secondaryColor: '#ffffff', accentColor: '#ffffff', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#000066', secondaryColor: '#ffffff', accentColor: '#ffffff', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'chelsea',
    name: 'Chelsea',
    leagueId: 'epl',
    logo: 'https://media.api-sports.io/football/teams/49.png',
    sponsor: 'Three',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#034694', secondaryColor: '#ffffff', accentColor: '#ffffff', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#ffffff', secondaryColor: '#034694', accentColor: '#034694', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'tottenham',
    name: 'Tottenham',
    leagueId: 'epl',
    logo: 'https://media.api-sports.io/football/teams/47.png',
    sponsor: 'AIA',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#ffffff', secondaryColor: '#132257', accentColor: '#132257', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#132257', secondaryColor: '#ffffff', accentColor: '#ffffff', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'newcastle',
    name: 'Newcastle',
    leagueId: 'epl',
    logo: 'https://media.api-sports.io/football/teams/34.png',
    sponsor: 'SELA',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#000000', secondaryColor: '#ffffff', accentColor: '#ffffff', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#344131', secondaryColor: '#ffffff', accentColor: '#ffffff', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'aston-villa',
    name: 'Aston Villa',
    leagueId: 'epl',
    logo: 'https://media.api-sports.io/football/teams/66.png',
    sponsor: 'BETANO',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#670E36', secondaryColor: '#95BFE5', accentColor: '#fee505', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#ffffff', secondaryColor: '#670E36', accentColor: '#95BFE5', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'everton',
    name: 'Everton',
    leagueId: 'epl',
    logo: 'https://media.api-sports.io/football/teams/45.png',
    sponsor: 'STAKE.COM',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#003399', secondaryColor: '#ffffff', accentColor: '#ffffff', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#ffffff', secondaryColor: '#003399', accentColor: '#003399', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'west-ham',
    name: 'West Ham',
    leagueId: 'epl',
    logo: 'https://media.api-sports.io/football/teams/48.png',
    sponsor: 'Betway',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#7A263A', secondaryColor: '#1BB1E7', accentColor: '#1BB1E7', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#000000', secondaryColor: '#7A263A', accentColor: '#7A263A', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'leicester',
    name: 'Leicester City',
    leagueId: 'epl',
    logo: 'https://media.api-sports.io/football/teams/46.png',
    sponsor: 'KING POWER',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#003090', secondaryColor: '#ffffff', accentColor: '#fdb913', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#141112', secondaryColor: '#ffffff', accentColor: '#003090', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'bournemouth',
    name: 'Bournemouth',
    leagueId: 'epl',
    logo: 'https://media.api-sports.io/football/teams/35.png',
    sponsor: 'bj88',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#E62333', secondaryColor: '#000000', accentColor: '#ffffff', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#ffffff', secondaryColor: '#003399', accentColor: '#003399', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'brentford',
    name: 'Brentford',
    leagueId: 'epl',
    logo: 'https://media.api-sports.io/football/teams/55.png',
    sponsor: 'PENSIONBEE',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#E30613', secondaryColor: '#ffffff', accentColor: '#000000', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#000000', secondaryColor: '#E30613', accentColor: '#E30613', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'brighton',
    name: 'Brighton',
    leagueId: 'epl',
    logo: 'https://media.api-sports.io/football/teams/51.png',
    sponsor: 'AMEX',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#0057B8', secondaryColor: '#ffffff', accentColor: '#FFCD00', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#FDD522', secondaryColor: '#000000', accentColor: '#000000', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'crystal-palace',
    name: 'Crystal Palace',
    leagueId: 'epl',
    logo: 'https://media.api-sports.io/football/teams/52.png',
    sponsor: 'NET88',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#1B458F', secondaryColor: '#C4122E', accentColor: '#ffffff', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#ffffff', secondaryColor: '#1B458F', accentColor: '#C4122E', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'fulham',
    name: 'Fulham',
    leagueId: 'epl',
    logo: 'https://media.api-sports.io/football/teams/36.png',
    sponsor: 'SBOTOP',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#ffffff', secondaryColor: '#000000', accentColor: '#CC1E35', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#CC1E35', secondaryColor: '#ffffff', accentColor: '#ffffff', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'ipswich',
    name: 'Ipswich Town',
    leagueId: 'epl',
    logo: 'https://media.api-sports.io/football/teams/57.png',
    sponsor: 'ED SHEERAN',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#003399', secondaryColor: '#ffffff', accentColor: '#ffffff', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#840E31', secondaryColor: '#ffffff', accentColor: '#ffffff', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'nottingham-forest',
    name: 'Nottm Forest',
    leagueId: 'epl',
    logo: 'https://media.api-sports.io/football/teams/65.png',
    sponsor: 'KAIYUN',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#DD0000', secondaryColor: '#ffffff', accentColor: '#ffffff', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#ffffff', secondaryColor: '#000000', accentColor: '#DD0000', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'southampton',
    name: 'Southampton',
    leagueId: 'epl',
    logo: 'https://media.api-sports.io/football/teams/41.png',
    sponsor: 'ROLLBIT',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#ffffff', secondaryColor: '#D71920', accentColor: '#D71920', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#E9E300', secondaryColor: '#000000', accentColor: '#000000', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'wolves',
    name: 'Wolves',
    leagueId: 'epl',
    logo: 'https://media.api-sports.io/football/teams/39.png',
    sponsor: 'DEBET',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#FDB913', secondaryColor: '#231F20', accentColor: '#231F20', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#000000', secondaryColor: '#FDB913', accentColor: '#FDB913', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  
  // --- LALIGA ---
  {
    id: 'real-madrid',
    name: 'Real Madrid',
    leagueId: 'laliga',
    logo: 'https://media.api-sports.io/football/teams/541.png',
    sponsor: 'EMIRATES',
    fontFamily: '"Outfit"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#ffffff', secondaryColor: '#000000', accentColor: '#febe10', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#1A1A1A', secondaryColor: '#ffffff', accentColor: '#febe10', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'barcelona',
    name: 'FC Barcelona',
    leagueId: 'laliga',
    logo: 'https://media.api-sports.io/football/teams/529.png',
    sponsor: 'SPOTIFY',
    fontFamily: '"Outfit"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#154284', secondaryColor: '#ffffff', accentColor: '#7B1639', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#000000', secondaryColor: '#7B1639', accentColor: '#154284', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'atletico',
    name: 'Atlético',
    leagueId: 'laliga',
    logo: 'https://media.api-sports.io/football/teams/530.png',
    sponsor: 'RIYADH AIR',
    fontFamily: '"Outfit"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#ffffff', secondaryColor: '#CB3524', accentColor: '#252850', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#252850', secondaryColor: '#ffffff', accentColor: '#CB3524', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'sevilla',
    name: 'Sevilla',
    leagueId: 'laliga',
    logo: 'https://media.api-sports.io/football/teams/536.png',
    sponsor: 'Castore',
    fontFamily: '"Outfit"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#ffffff', secondaryColor: '#E61A23', accentColor: '#E61A23', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#E61A23', secondaryColor: '#ffffff', accentColor: '#ffffff', baseImage: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=1200' }
    ]
  },
  {
    id: 'al-nassr',
    name: 'Al-Nassr',
    leagueId: 'saudi',
    logo: 'https://media.api-sports.io/football/teams/2939.png',
    sponsor: 'KAFD',
    fontFamily: '"Outfit"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#FFD700', secondaryColor: '#0051ba', accentColor: '#0051ba', baseImage: '' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#0051ba', secondaryColor: '#FFD700', accentColor: '#FFD700', baseImage: '' }
    ]
  },
  {
    id: 'enyimba',
    name: 'Enyimba FC',
    leagueId: 'npfl',
    logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHJ4PSIxNSIgZmlsbD0iIzAwMDBmZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic3lzdGVtLXVpLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjMwIiBmaWxsPSIjZmZmZmZmIj5FRjwvdGV4dD48L3N2Zz4=',
    sponsor: 'UNITED',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Home 24/25', primaryColor: '#0000FF', secondaryColor: '#ffffff', accentColor: '#ffffff', baseImage: '' },
      { id: 'away', name: 'Away 24/25', primaryColor: '#ffffff', secondaryColor: '#0000FF', accentColor: '#0000FF', baseImage: '' }
    ]
  },

  // --- MLB (BASEBALL) ---
  {
    id: 'ny-yankees',
    name: 'NY Yankees',
    leagueId: 'mlb',
    logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHJ4PSIxNSIgZmlsbD0iIzAwMzA4NyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic3lzdGVtLXVpLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjMwIiBmaWxsPSIjZmZmZmZmIj5OWVk8L3RleHQ+PC9zdmc=',
    fontFamily: '"JetBrains Mono"',
    kits: [
      { id: 'home', name: 'Home Pinstripes', primaryColor: '#ffffff', secondaryColor: '#003087', accentColor: '#003087', baseImage: 'https://images.unsplash.com/photo-1508349177119-83c02a71f2aa?q=80&w=1200' },
      { id: 'away', name: 'Road Gray', primaryColor: '#eeeeee', secondaryColor: '#003087', accentColor: '#003087', baseImage: 'https://images.unsplash.com/photo-1508349177119-83c02a71f2aa?q=80&w=1200' }
    ]
  },
  {
    id: 'dodgers',
    name: 'LA Dodgers',
    leagueId: 'mlb',
    logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHJ4PSIxNSIgZmlsbD0iIzAwNWE5YyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic3lzdGVtLXVpLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjMwIiBmaWxsPSIjZmZmZmZmIj5MQUQ8L3RleHQ+PC9zdmc=',
    fontFamily: '"JetBrains Mono"',
    kits: [
      { id: 'home', name: 'Classic Blue', primaryColor: '#ffffff', secondaryColor: '#005a9c', accentColor: '#ef3e42', baseImage: 'https://images.unsplash.com/photo-1508349177119-83c02a71f2aa?q=80&w=1200' },
      { id: 'away', name: 'Road Blue', primaryColor: '#005a9c', secondaryColor: '#ffffff', accentColor: '#ef3e42', baseImage: 'https://images.unsplash.com/photo-1508349177119-83c02a71f2aa?q=80&w=1200' }
    ]
  },
  {
    id: 'red-sox',
    name: 'Red Sox',
    leagueId: 'mlb',
    logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHJ4PSIxNSIgZmlsbD0iI2JkMzAzOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic3lzdGVtLXVpLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjMwIiBmaWxsPSIjZjVmNWY1Ij5CT1M8L3RleHQ+PC9zdmc=',
    fontFamily: '"JetBrains Mono"',
    kits: [
      { id: 'home', name: 'Home Jersey', primaryColor: '#ffffff', secondaryColor: '#bd3039', accentColor: '#0c2340', baseImage: 'https://images.unsplash.com/photo-1508349177119-83c02a71f2aa?q=80&w=1200' },
      { id: 'away', name: 'Road Gray', primaryColor: '#eeeeee', secondaryColor: '#bd3039', accentColor: '#0c2340', baseImage: 'https://images.unsplash.com/photo-1508349177119-83c02a71f2aa?q=80&w=1200' }
    ]
  },

  // --- RUGBY ---
  {
    id: 'all-blacks',
    name: 'All Blacks',
    leagueId: 'rugby-world',
    logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHJ4PSIyMCIgZmlsbD0iIzAwMDAwMCIvPjxwYXRoIGQ9Ik0yNSw3NSBDNDAsNjUgNjAsNDUgNzUsMTUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNNDIsNjUgQzMyLDYwIDMwLDUyIDM1LDUyIEM0NSw1MiA0OCw1OCA0OCw1OCBaIiBmaWxsPSIjZmZmZmZmIi8+PHBhdGggZD0iTTQ4LDU3IEMzOCw1MiAzNiw0NCA0MSw0NCBDNTEsNDQgNTQsNTAgNTQsNTAgWiIgZmlsbD0iI2ZmZmZmZiIvPjxwYXRoIGQ9Ik01NCw0OSBDNDQsNDQgNDIsMzYgNDcsMzYgQzU3LDM2IDYwLDQyIDYwLDQyIFoiIGZpbGw9IiNmZmZmZmYiLz48cGF0aCBkPSJNNjAsNDEgQzUwLDM2IDQ4LDI4IDUzLDI4IEM2MywyOCA2NiwzNCA2NiwzNCBaIiBmaWxsPSIjZmZmZmZmIi8+PHBhdGggZD0iTTQyLDY1IEM1Miw2MCA1NSw1MiA1MCw1MiBDNDAsNTIgMzcsNTggMzcsNTggWiIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44Ii8+PHBhdGggZD0iTTQ4LDU3IEM1OCw1MiA2MSw0NCA1Niw0NCBDNDYsNDQgNDMsNTAgNDMsNTAgWiIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44Ii8+PHBhdGggZD0iTTU0LDQ5IEM2NCw0NCA2NywzNiA2MiwzNiBDNTIsMzYgNDksNDIgNDksNDIgWiIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44Ii8+PHRleHQgeD0iNTAiIHk9Ijg3IiBmb250LWZhbWlseT0ic3lzdGVtLXVpLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjgiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGxldHRlci1zcGFjaW5nPSIxIj5BTEwgQkxBQ0tTPC90ZXh0Pjwvc3ZnPg==',
    sponsor: 'ALTRAD',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Elite 24', primaryColor: '#000000', secondaryColor: '#ffffff', accentColor: '#ffffff', baseImage: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=1200' },
      { id: 'away', name: 'Elite Away', primaryColor: '#ffffff', secondaryColor: '#000000', accentColor: '#000000', baseImage: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=1200' }
    ]
  },
  {
    id: 'springboks',
    name: 'Springboks',
    leagueId: 'rugby-world',
    logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHJ4PSIyMCIgZmlsbD0iIzAwNGQyNSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDIiIHI9IjI2IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmNjMDAiIHN0cm9rZS13aWR0aD0iMyIvPjxwYXRoIGQ9Ik0zMiw0OSBDMzYsNDMgNDUsMzcgNTIsMzEgQzU1LDI5IDU4LDI1IDYyLDI1IEM2NCwyNSA2NiwyOSA2MywzMiBDNjAsMzQgNTQsMzggNTEsNDIgQzQ4LDYgNDgsNTAgNTMsNTUgQzQ1LDUxIDM4LDUxIDMyLDQ5IFoiIGZpbGw9IiNmZmNjMDAiLz48cGF0aCBkPSJNNUg4LDI4IEw2NCwxNiBNNjAsMjcgTDY3LDE4IiBzdHJva2U9IiNmZmNjMDAiIHN0cm9rZT0iI2ZmY2MwMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNMzMsNDkgTDLocal SVGs" stroke="#ffcc00" stroke-width="2.5" stroke-linecap="round"/><text x="50" y="85" font-family="system-ui, sans-serif" font-weight="900" font-size="8" fill="#ffcc00" text-anchor="middle" letter-spacing="1">SPRINGBOKS</text></svg>',
    sponsor: 'MTN',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Elite 24', primaryColor: '#006431', secondaryColor: '#ffffff', accentColor: '#ffcd00', baseImage: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=1200' },
      { id: 'away', name: 'Elite Away', primaryColor: '#ffffff', secondaryColor: '#006431', accentColor: '#006431', baseImage: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=1200' }
    ]
  },
  {
    id: 'england-rugby',
    name: 'England',
    leagueId: 'rugby-world',
    logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHJ4PSIyMCIgZmlsbD0iI2ZmZmZmZiIgc3Ryb2tlPSIjZWVlZWVlIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMzUsMzIgQzMwLDMwIDI2LDQwIDMyLDQ1IEMzNSw0MiAzOCwzNiAzNSwzMiBaIiBmaWxsPSIjMDA2NDMwIi8+PHBhdGggZD0iTTY1LDMyIEM3MCwzMCA3NCw0MCA2OCw0NSBDNjUsNDIgNjIsMzYgNjUsMzIgWiIgZmlsbD0iIzAwNjQzMCIvPjxwYXRoIGQ9Ik01MCw3MCBDNTQsNzQgNDYsNzggNDYsNzIgQzQ4LDY4IDUyLDY2IDUwLDcwIFoiIGZpbGw9IiMwMDY0MzAiLz48cGF0aCBkPSJNNTAsMjMgQzQyLDIzIDM4LDM1IDUwLDQ1IEM2MiwzNSA1OCwyMyA1MCwyMyBaIiBmaWxsPSIjZGEyOTFjIi8+PHBhdGggZD0iTTI4LD41IEMyOCw1MyA0MCw1NyA1MCw0NSBDNDAsMzMgMjgsMzcgMjgsNDUgWiIgZmlsbD0iI2RhMjkxYyIvPjxwYXRoIGQ9Ik03Miw0NSBDNzIsNTMgNjAsNTcgNTAsNDUgQzYwLDMzIDcyLDM3IDcyLDQ1IFoiIGZpbGw9IiNkYTI5MWMiLz48cGF0aCBkPSJNNTAsNjcgQzQyLDY3IDM4LDU1IDUwLDQ1IEM2Miw1NSA1OCw2NyA1MCw2NyBaIiBmaWxsPSIjZGEyOTFjIi8+PGNpcmNsZSBjeD0iNTAiIGN5PSI0NSIgcj0iMTEiIGZpbGw9IiNmZmZmZmYiLz48cGF0aCBkPSJNNTAsMzggQzQ2LDM4IDQzLDQyIDUwLDQ1IEM1Nyw0MiA1NCwzOCA1MCwzOCBaIiBmaWxsPSIjZGEyOTFjIi8+PHBhdGggZD0iTTQzLDQ1IEM0Myw0OSA0Nyw1MSA1MCw0NSBDNDcsMzkgNDMsNDEgNDMsNDUgWiIgZmlsbD0iI2RhMjkxYyIvPjxwYXRoIGQ9Ik01Nyw0NSBDNTQsNDkgNTMsNTEgNTAsNDUgQzUzLDM5IDU3LDQxIDU3LDQ1IFoiIGZpbGw9IiNkYTI5MWMiLz48cGF0aCBkPSJNNTAsNTIgQzQ2DUyIDQzLDQ4IDUwLDQ1IEM1Nyw0OCA1NCw1MiA1MCw1MiBaIiBmaWxsPSIjZGEyOTFjIi8+PGNpcmNsZSBjeD0iNTAiIGN5PSI0NSIgcj0iNSIgZmlsbD0iI2ZmY2MwMCIvPjx0ZXh0IHg9IjUwIiB5PSI4NSIgZm9udC1mYW1pbHk9InN5c3RlbS11aSwgc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9IjkwMCIgZm9udC1zaXplPSI4IiBmaWxsPSIjMTExMTExIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBsZXR0ZXItc3BhY2luZz0iMSI+RU5HTEFORDwvdGV4dD48L3N2Zz4=',
    sponsor: 'O2',
    fontFamily: '"Space Grotesk"',
    kits: [
      { id: 'home', name: 'Elite 24', primaryColor: '#ffffff', secondaryColor: '#ce1124', accentColor: '#ce1124', baseImage: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=1200' },
      { id: 'away', name: 'Elite Away', primaryColor: '#1A315E', secondaryColor: '#ffffff', accentColor: '#ce1124', baseImage: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=1200' }
    ]
  }
];
