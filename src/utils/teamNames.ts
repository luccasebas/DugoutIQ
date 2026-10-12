// Dictionary mapping of common TrackMan, Statcast, and league abbreviations
// to real, full official team names (CCL, Bay Area, West Coast, and Summer Collegiate)

const TEAM_MAP: Record<string, string> = {
  // San Francisco Seagulls (including TrackMan truncated code 'san fra4', 'SAN_FRA4')
  'SAN_FRA4': 'San Francisco Seagulls',
  'SAN_FRA_4': 'San Francisco Seagulls',
  'SAN FRA4': 'San Francisco Seagulls',
  'SANFRA4': 'San Francisco Seagulls',
  'SAN_FRA': 'San Francisco Seagulls',
  'SAN FRA': 'San Francisco Seagulls',
  'SF_SEA': 'San Francisco Seagulls',
  'SF_SEAGULLS': 'San Francisco Seagulls',
  'SAN_FRANCISCO_SEAGULLS': 'San Francisco Seagulls',
  'SAN_FRANCISCO': 'San Francisco Seagulls',
  'SANFRANCISCO': 'San Francisco Seagulls',
  'SEAGULLS': 'San Francisco Seagulls',
  'SFS': 'San Francisco Seagulls',
  'SF': 'San Francisco Seagulls',

  // Walnut Creek Crawdads (including TrackMan truncated code 'wal cre', 'WAL_CRE')
  'WAL_CRE': 'Walnut Creek Crawdads',
  'WAL CRE': 'Walnut Creek Crawdads',
  'WALCRE': 'Walnut Creek Crawdads',
  'WAL_CRA': 'Walnut Creek Crawdads',
  'WAL CRA': 'Walnut Creek Crawdads',
  'WALNUT_CREEK_CRAWDADS': 'Walnut Creek Crawdads',
  'WALNUT_CREEK': 'Walnut Creek Crawdads',
  'WALNUTCREEK': 'Walnut Creek Crawdads',
  'CRAWDADS': 'Walnut Creek Crawdads',
  'WCK_CRA': 'Walnut Creek Crawdads',
  'WC_CRA': 'Walnut Creek Crawdads',
  'WCK': 'Walnut Creek Crawdads',

  // San Luis Obispo Blues (including TrackMan truncated code 'san lui', 'SAN_LUI')
  'SAN_LUI': 'San Luis Obispo Blues',
  'SAN LUI': 'San Luis Obispo Blues',
  'SANLUI': 'San Luis Obispo Blues',
  'SLO_BLU': 'San Luis Obispo Blues',
  'SLO_BLUES': 'San Luis Obispo Blues',
  'SAN_LUIS_OBISPO_BLUES': 'San Luis Obispo Blues',
  'SAN_LUIS_OBISPO': 'San Luis Obispo Blues',
  'SAN_LUIS': 'San Luis Obispo Blues',
  'SANLUISOBISPO': 'San Luis Obispo Blues',
  'SLO': 'San Luis Obispo Blues',
  'BLUES': 'San Luis Obispo Blues',

  // Santa Maria Indians (including TrackMan truncated code 'san mar6', 'SAN_MAR6')
  'SAN_MAR6': 'Santa Maria Indians',
  'SAN_MAR_6': 'Santa Maria Indians',
  'SAN MAR6': 'Santa Maria Indians',
  'SANMAR6': 'Santa Maria Indians',
  'SAN_MAR': 'Santa Maria Indians',
  'SAN MAR': 'Santa Maria Indians',
  'SMA_IND': 'Santa Maria Indians',
  'SM_IND': 'Santa Maria Indians',
  'SANTA_MARIA_INDIANS': 'Santa Maria Indians',
  'SANTA_MARIA': 'Santa Maria Indians',
  'SANTAMARIA': 'Santa Maria Indians',
  'INDIANS': 'Santa Maria Indians',
  'SMA': 'Santa Maria Indians',

  // Menlo Park Legends
  'MEN_LEG': 'Menlo Park Legends',
  'MEN_PAR': 'Menlo Park Legends',
  'MEN PAR': 'Menlo Park Legends',
  'MP_LEG': 'Menlo Park Legends',
  'MENLO_LEGENDS': 'Menlo Park Legends',
  'MENLO_PARK_LEGENDS': 'Menlo Park Legends',
  'MENLO_PARK': 'Menlo Park Legends',
  'MENLOPARK': 'Menlo Park Legends',
  'MENLO': 'Menlo Park Legends',
  'LEGENDS': 'Menlo Park Legends',

  // Alameda Merchants
  'ALA_MER': 'Alameda Merchants',
  'ALA MER': 'Alameda Merchants',
  'ALAMEDA_MERCHANTS': 'Alameda Merchants',
  'ALAMEDA': 'Alameda Merchants',
  'MERCHANTS': 'Alameda Merchants',
  'ALA': 'Alameda Merchants',

  // Novato Knicks
  'NOV_KNI': 'Novato Knicks',
  'NOV KNI': 'Novato Knicks',
  'NOVATO_KNICKS': 'Novato Knicks',
  'NOVATO': 'Novato Knicks',
  'KNICKS': 'Novato Knicks',

  // Philippines Baseball Group
  'PHI_BAS': 'Philippines Baseball Group',
  'PHI BAS': 'Philippines Baseball Group',
  'PHILIPPINES_BASEBALL_GROUP': 'Philippines Baseball Group',
  'PHILIPPINES': 'Philippines Baseball Group',
  'PHILIPPINES_BASEBALL': 'Philippines Baseball Group',
  'PBG': 'Philippines Baseball Group',

  // Sonoma Stompers
  'SON_STO': 'Sonoma Stompers',
  'SON STO': 'Sonoma Stompers',
  'SONOMA_STOMPERS': 'Sonoma Stompers',
  'SONOMA': 'Sonoma Stompers',
  'STOMPERS': 'Sonoma Stompers',

  // Healdsburg Prune Packers
  'HEA_PRU': 'Healdsburg Prune Packers',
  'HEA PRU': 'Healdsburg Prune Packers',
  'HEALDSBURG_PRUNE_PACKERS': 'Healdsburg Prune Packers',
  'HEALDSBURG': 'Healdsburg Prune Packers',
  'PRUNE_PACKERS': 'Healdsburg Prune Packers',

  // Lincoln Potters
  'LIN_POT': 'Lincoln Potters',
  'LIN POT': 'Lincoln Potters',
  'LINCOLN_POTTERS': 'Lincoln Potters',
  'LINCOLN': 'Lincoln Potters',
  'POTTERS': 'Lincoln Potters',

  // Santa Barbara Foresters
  'SB_FOR': 'Santa Barbara Foresters',
  'SANTA_BARBARA_FORESTERS': 'Santa Barbara Foresters',
  'SANTA_BARBARA': 'Santa Barbara Foresters',
  'FORESTERS': 'Santa Barbara Foresters',

  // Arroyo Seco Saints
  'AS_SAI': 'Arroyo Seco Saints',
  'ARROYO_SECO_SAINTS': 'Arroyo Seco Saints',
  'ARROYO_SECO': 'Arroyo Seco Saints',
  'SAINTS': 'Arroyo Seco Saints',

  // Conejo Oaks
  'CON_OAK': 'Conejo Oaks',
  'CONEJO_OAKS': 'Conejo Oaks',
  'CONEJO': 'Conejo Oaks',
  'OAKS': 'Conejo Oaks',

  // Orange County Riptide
  'OC_RIP': 'Orange County Riptide',
  'OC_RIPTIDE': 'Orange County Riptide',
  'ORANGE_COUNTY_RIPTIDE': 'Orange County Riptide',
  'RIPTIDE': 'Orange County Riptide',

  // Ventura County Pirates
  'VC_PIR': 'Ventura County Pirates',
  'VENTURA_COUNTY_PIRATES': 'Ventura County Pirates',
  'VENTURA_COUNTY': 'Ventura County Pirates',
  'PIRATES': 'Ventura County Pirates',

  // Bakersfield Train Robbers
  'BAK_TRA': 'Bakersfield Train Robbers',
  'BAKERSFIELD_TRAIN_ROBBERS': 'Bakersfield Train Robbers',
  'BAKERSFIELD': 'Bakersfield Train Robbers',

  // Cape Cod Baseball League (CCBL)
  'CHA_ANG': 'Chatham Anglers',
  'CHATHAM_ANGLERS': 'Chatham Anglers',
  'CHATHAM': 'Chatham Anglers',
  'HAR_MAR': 'Harwich Mariners',
  'HARWICH_MARINERS': 'Harwich Mariners',
  'HARWICH': 'Harwich Mariners',
  'YD_RED': 'Y-D Red Sox',
  'YD_RED_SOX': 'Y-D Red Sox',
  'YARMOUTH_DENNIS': 'Y-D Red Sox',
  'YD': 'Y-D Red Sox',
  'FAL_COM': 'Falmouth Commodores',
  'FALMOUTH': 'Falmouth Commodores',
  'BOU_BRA': 'Bourne Braves',
  'BOURNE': 'Bourne Braves',
  'COT_KET': 'Cotuit Kettleers',
  'COTUIT': 'Cotuit Kettleers',
  'HYA_HAR': 'Hyannis Harbor Hawks',
  'HYANNIS': 'Hyannis Harbor Hawks',
  'ORL_FIR': 'Orleans Firebirds',
  'ORLEANS': 'Orleans Firebirds',
  'BRE_WHI': 'Brewster Whitecaps',
  'BREWSTER': 'Brewster Whitecaps',
  'WAR_GAT': 'Wareham Gatemen',
  'WAREHAM': 'Wareham Gatemen',
};

// Formats any raw team string (abbreviation, city, or truncated code) into the real official full name
export function formatRealTeamName(rawTeam: string): string {
  if (!rawTeam) return 'Club Team';
  const trimmed = rawTeam.trim().replace(/^["']|["']$/g, '');
  if (!trimmed) return 'Club Team';

  // 1. Direct dictionary lookup (case-insensitive with underscores or spaces)
  const upperKey = trimmed.toUpperCase().replace(/\s+/g, '_');
  if (TEAM_MAP[upperKey]) {
    return TEAM_MAP[upperKey];
  }

  // 2. Normalized key (letters and digits only)
  const cleanKey = upperKey.replace(/[^A-Z0-9]/g, '');
  if (TEAM_MAP[cleanKey]) {
    return TEAM_MAP[cleanKey];
  }

  // 3. Normalized alphanumeric string for robust fuzzy matching of TrackMan codes
  const norm = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');

  // San Francisco Seagulls (catches 'san fra4', 'san fra', 'san francisco', 'sf_sea', 'sfs', etc.)
  if (
    norm.startsWith('sanfra') ||
    norm.includes('sanfra') ||
    norm.includes('sanfrancisco') ||
    norm.includes('seagull') ||
    norm === 'sf' ||
    norm === 'sfsea' ||
    norm === 'sfs'
  ) {
    return 'San Francisco Seagulls';
  }

  // Walnut Creek Crawdads (catches 'wal cre', 'wal_cre', 'walcre', 'walnut creek', 'crawdads', 'wck', etc.)
  if (
    norm.startsWith('walcre') ||
    norm.includes('walcre') ||
    norm.includes('walnutcreek') ||
    norm.includes('crawdad') ||
    norm === 'wck' ||
    norm === 'walcra'
  ) {
    return 'Walnut Creek Crawdads';
  }

  // San Luis Obispo Blues (catches 'san lui', 'san_lui', 'sanlui', 'san luis', 'san luis obispo', 'slo blues', 'slo')
  if (
    norm.startsWith('sanlui') ||
    norm.includes('sanlui') ||
    norm.includes('sanluis') ||
    norm.includes('sloblues') ||
    norm === 'slo' ||
    norm === 'sloblu'
  ) {
    return 'San Luis Obispo Blues';
  }

  // Santa Maria Indians (catches 'san mar6', 'san_mar6', 'sanmar6', 'san mar', 'santa maria', 'sma ind', 'sma')
  if (
    norm.startsWith('sanmar') ||
    norm.includes('sanmar') ||
    norm.includes('santamaria') ||
    norm.includes('indians') ||
    norm === 'sma' ||
    norm === 'smaind' ||
    norm === 'smind'
  ) {
    return 'Santa Maria Indians';
  }

  // Menlo Park Legends (catches 'men par', 'men leg', 'menlo park', 'menlopark', 'menlo', 'legends')
  if (
    norm.startsWith('menpar') ||
    norm.startsWith('menleg') ||
    norm.includes('menlo') ||
    norm.includes('legends')
  ) {
    return 'Menlo Park Legends';
  }

  // Alameda Merchants (catches 'ala mer', 'alameda', 'merchants')
  if (
    norm.startsWith('alamer') ||
    norm.includes('alameda') ||
    norm.includes('merchants')
  ) {
    return 'Alameda Merchants';
  }

  // Novato Knicks
  if (
    norm.startsWith('novkni') ||
    norm.includes('novato') ||
    norm.includes('knicks')
  ) {
    return 'Novato Knicks';
  }

  // Philippines Baseball Group
  if (
    norm.startsWith('phibas') ||
    norm.includes('philippines') ||
    norm === 'pbg'
  ) {
    return 'Philippines Baseball Group';
  }

  // Sonoma Stompers
  if (
    norm.startsWith('sonsto') ||
    norm.includes('sonoma') ||
    norm.includes('stompers')
  ) {
    return 'Sonoma Stompers';
  }

  // Healdsburg Prune Packers
  if (
    norm.startsWith('heapru') ||
    norm.includes('healdsburg') ||
    norm.includes('prunepacker')
  ) {
    return 'Healdsburg Prune Packers';
  }

  // Lincoln Potters
  if (
    norm.startsWith('linpot') ||
    norm.includes('lincoln') ||
    norm.includes('potters')
  ) {
    return 'Lincoln Potters';
  }

  // Santa Barbara Foresters
  if (
    norm.includes('santabarbara') ||
    norm.includes('foresters') ||
    norm === 'sbfor'
  ) {
    return 'Santa Barbara Foresters';
  }

  // Arroyo Seco Saints
  if (
    norm.includes('arroyoseco') ||
    norm.includes('saints') ||
    norm === 'assai'
  ) {
    return 'Arroyo Seco Saints';
  }

  // Conejo Oaks
  if (
    norm.includes('conejo') ||
    norm.includes('oaks') ||
    norm === 'conoak'
  ) {
    return 'Conejo Oaks';
  }

  // Orange County Riptide
  if (
    norm.includes('orangecounty') ||
    norm.includes('riptide') ||
    norm === 'ocrip'
  ) {
    return 'Orange County Riptide';
  }

  // Ventura County Pirates
  if (
    norm.includes('venturacounty') ||
    norm.includes('pirates') ||
    norm === 'vcpir'
  ) {
    return 'Ventura County Pirates';
  }

  // Bakersfield Train Robbers
  if (
    norm.includes('bakersfield') ||
    norm.includes('trainrobbers') ||
    norm === 'baktra'
  ) {
    return 'Bakersfield Train Robbers';
  }

  // 4. Fallback: Proper Title Casing for unmapped teams (removes underscores/dashes, capitalizes words)
  return trimmed
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
