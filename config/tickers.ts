export const TICKER_UNIVERSE: string[] = [
  // ── US Mega Caps ───────────────────────────────────────────────────────────
  'AAPL','MSFT','GOOGL','AMZN','NVDA','META','TSLA','BRK-B','V','UNH',
  'XOM','JNJ','LLY','JPM','WMT','MA','PG','HD','CVX','MRK',
  'ABBV','KO','PEP','COST','AVGO','ADBE','CSCO','NFLX','DIS','INTC',
  'CMCSA','VZ','T','NKE','PFE','ABT','CRM','TMO','TXN','PM',

  // ── US Quality Mid Caps ────────────────────────────────────────────────────
  'ODFL','FAST','POOL','ROST','PAYX','CTAS','ITW','EMR','PH','AME',
  'DOV','ROP','MSCI','SPGI','MCO','ICE','CME','IDXX','WST','CAT',
  'LIN','BAC','MCD','ALLE','CHRW','EXPD','ROL','HRL','CLX','MKC',

  // ── France – CAC 40 ────────────────────────────────────────────────────────
  'MC.PA',    // LVMH
  'OR.PA',    // L'Oréal
  'RMS.PA',   // Hermès
  'AIR.PA',   // Airbus
  'SAF.PA',   // Safran
  'TTE.PA',   // TotalEnergies
  'SAN.PA',   // Sanofi
  'AI.PA',    // Air Liquide
  'SU.PA',    // Schneider Electric
  'BN.PA',    // Danone
  'DSY.PA',   // Dassault Systèmes
  'KER.PA',   // Kering
  'BNP.PA',   // BNP Paribas
  'DG.PA',    // Vinci
  'SGO.PA',   // Saint-Gobain
  'ML.PA',    // Michelin
  'HO.PA',    // Thales
  'LR.PA',    // Legrand
  'RI.PA',    // Pernod Ricard
  'PUB.PA',   // Publicis
  'ENGI.PA',  // Engie
  'ORA.PA',   // Orange
  'VIE.PA',   // Veolia
  'CA.PA',    // Carrefour
  'GLE.PA',   // Société Générale
  'ACA.PA',   // Crédit Agricole
  'STMPA.PA', // STMicroelectronics
  'RNO.PA',   // Renault
  'EN.PA',    // Bouygues

  // ── France – CAC Mid 60 & qualité ─────────────────────────────────────────
  'CAP.PA',   // Capgemini
  'EDEN.PA',  // Edenred
  'ERF.PA',   // Eurofins Scientific
  'SOP.PA',   // Sopra Steria
  'AM.PA',    // Amundi
  'AC.PA',    // Accor
  'ALO.PA',   // Alstom
  'TFI.PA',   // TF1
  'IPN.PA',   // Ipsen
  'COFA.PA',  // Coface
  'ATO.PA',   // Atos
  'GTT.PA',   // Gaztransport & Technigaz
  'VIV.PA',   // Vivendi

  // ── Allemagne – DAX 40 ─────────────────────────────────────────────────────
  'SAP.DE',   // SAP
  'SIE.DE',   // Siemens
  'ALV.DE',   // Allianz
  'MUV2.DE',  // Munich Re
  'DTE.DE',   // Deutsche Telekom
  'ADS.DE',   // Adidas
  'BMW.DE',   // BMW
  'MBG.DE',   // Mercedes-Benz
  'BAS.DE',   // BASF
  'BAYN.DE',  // Bayer
  'VOW3.DE',  // Volkswagen
  'HEN3.DE',  // Henkel
  'IFX.DE',   // Infineon
  'LIN.DE',   // Linde
  'DBK.DE',   // Deutsche Bank
  'SHL.DE',   // Siemens Healthineers
  'ENR.DE',   // Siemens Energy
  'MTX.DE',   // MTU Aero Engines
  'SY1.DE',   // Symrise
  'CON.DE',   // Continental

  // ── Suisse ────────────────────────────────────────────────────────────────
  'NESN.SW',  // Nestlé
  'NOVN.SW',  // Novartis
  'UHR.SW',   // Swatch
  'ABBN.SW',  // ABB
  'ZURN.SW',  // Zurich Insurance
  'GIVN.SW',  // Givaudan
  'UBSG.SW',  // UBS
  'PGHN.SW',  // Partners Group
  'SREN.SW',  // Swiss Re

  // ── Pays-Bas ──────────────────────────────────────────────────────────────
  'ASML.AS',  // ASML
  'PRX.AS',   // Prosus
  'HEIA.AS',  // Heineken
  'INGA.AS',  // ING
  'AD.AS',    // Ahold Delhaize
  'RAND.AS',  // Randstad
  'PHIA.AS',  // Philips
  'WKL.AS',   // Wolters Kluwer

  // ── Royaume-Uni ───────────────────────────────────────────────────────────
  'AZN.L',    // AstraZeneca
  'ULVR.L',   // Unilever
  'SHEL.L',   // Shell
  'BP.L',     // BP
  'GSK.L',    // GSK
  'DGE.L',    // Diageo
  'RIO.L',    // Rio Tinto
  'HSBA.L',   // HSBC
  'LLOY.L',   // Lloyds
  'BATS.L',   // British American Tobacco
  'VOD.L',    // Vodafone
  'BHP.L',    // BHP
  'CPG.L',    // Compass Group

  // ── Scandinavie ───────────────────────────────────────────────────────────
  'NOVO-B.CO', // Novo Nordisk (DK)
  'NESTE.HE',  // Neste (FI)
  'SAND.ST',   // Sandvik (SE)
  'ATCO-A.ST', // Atlas Copco (SE)
  'VOLV-B.ST', // Volvo (SE)

  // ── Italie & Espagne ──────────────────────────────────────────────────────
  'RACE.MI',  // Ferrari
  'ENI.MI',   // ENI
  'ENEL.MI',  // Enel
  'ISP.MI',   // Intesa Sanpaolo
  'UCG.MI',   // UniCredit
  'ITX.MC',   // Inditex (Zara)
  'SAN.MC',   // Santander (ES)
  'IBE.MC',   // Iberdrola (ES)

  // ── Canada ────────────────────────────────────────────────────────────────
  'SHOP.TO',  // Shopify
  'RY.TO',    // Royal Bank
  'TD.TO',    // TD Bank
  'ENB.TO',   // Enbridge
  'CNQ.TO',   // Canadian Natural
  'CP.TO',    // Canadian Pacific
  'CNR.TO',   // CN Rail
  'SU.TO',    // Suncor
  'BMO.TO',   // BMO
  'BNS.TO',   // Scotiabank
  'ATD.TO',   // Alimentation Couche-Tard
  'TRI.TO',   // Thomson Reuters
  'MFC.TO',   // Manulife
  'POW.TO',   // Power Corp
]

export const SECTORS = [
  'Technology','Financials','Healthcare','Consumer Discretionary',
  'Consumer Staples','Industrials','Energy','Materials',
  'Real Estate','Utilities','Communication Services',
]
