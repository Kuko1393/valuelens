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

  // ── France – CAC Mid 60 ────────────────────────────────────────────────────
  'AKE.PA',   // Arkema (chimie de spécialité)
  'AM.PA',    // Amundi
  'AC.PA',    // Accor
  'ALO.PA',   // Alstom
  'BIM.PA',   // bioMérieux (diagnostic in vitro)
  'CAP.PA',   // Capgemini
  'COFA.PA',  // Coface
  'EDEN.PA',  // Edenred
  'ELIS.PA',  // Elis (services textiles)
  'ERF.PA',   // Eurofins Scientific
  'GET.PA',   // Getlink (Tunnel sous la Manche)
  'GFC.PA',   // Gecina (SIIC bureaux Paris)
  'GTT.PA',   // Gaztransport & Technigaz
  'ICAD.PA',  // Icade (foncière bureau/santé)
  'IPN.PA',   // Ipsen
  'NEX.PA',   // Nexans (câbles)
  'RXL.PA',   // Rexel (distribution électrique)
  'SOI.PA',   // Soitec (substrats semi-conducteurs)
  'SOP.PA',   // Sopra Steria
  'SPIE.PA',  // SPIE (services multi-techniques)
  'TEC.PA',   // Technip Energies
  'TFI.PA',   // TF1
  'TKO.PA',   // Tikehau Capital (gestion d'actifs alternatifs)
  'URW.PA',   // Unibail-Rodamco-Westfield
  'VIV.PA',   // Vivendi
  'WLN.PA',   // Worldline (paiements)

  // ── France – Valeurs moyennes & small caps vérifiées ──────────────────────
  'ABCA.PA',  // ABC arbitrage (stratégies alternatives cotées)
  'ALCOF.PA', // Cofidur (EMS electronique)
  'ALESA.PA', // Ecoslops (recyclage pétrole)
  'ALHIT.PA', // HITECHPROS (ESN/conseil IT)
  'ALIMR.PA', // Immersion SA
  'ALMII.PA', // M2i Formation
  'ALVDM.PA', // Voyageurs du Monde (agence premium)
  'ATO.PA',   // Atos SE (IT, restructuration)
  'AURE.PA',  // Aurea (recyclage industriel)
  'BOI.PA',   // Boiron (homéopathie, cash-rich)
  'CBR.PA',   // Robertet (arômes & parfums, niche premium)
  'FII.PA',   // LISI Group (fixations aéronautiques)
  'FNAC.PA',  // Fnac Darty
  'FREY.PA',  // Frey (REIT retail parks)
  'GBB.PA',   // Guerbet (imagerie médicale)
  'GEA.PA',   // Grenobloise d'Electronique (defense electronique)
  'HCO.PA',   // High Co. (marketing data)
  'IDIP.PA',  // IDI (capital-investissement coté)
  'LNA.PA',   // LNA Santé (EHPAD/cliniques)
  'LSS.PA',   // Lectra (solutions digitales mode/auto/mobilier)
  'MLCMG.PA', // CMG Cleantech
  'NXI.PA',   // Nexity (promotion immobilière)
  'POXEL.PA', // Poxel (pharma diabète & NASH)
  'PVL.PA',   // Plastiques du Val de Loire (emballage)
  'SESG.PA',  // SES S.A. (opérateur satellite, coté Paris)
  'SMCP.PA',  // SMCP (Sandro, Maje, Claudie Pierlot)
  'VETO.PA',  // Vétoquinol (santé animale)

  // ── Allemagne – DAX 40 ─────────────────────────────────────────────────────
  'SAP.DE','SIE.DE','ALV.DE','MUV2.DE','DTE.DE',
  'ADS.DE','BMW.DE','MBG.DE','BAS.DE','BAYN.DE',
  'VOW3.DE','HEN3.DE','IFX.DE','LIN.DE','DBK.DE',
  'SHL.DE','ENR.DE','MTX.DE','SY1.DE','CON.DE',

  // ── Suisse ────────────────────────────────────────────────────────────────
  'NESN.SW','NOVN.SW','UHR.SW','ABBN.SW',
  'ZURN.SW','GIVN.SW','UBSG.SW','PGHN.SW','SREN.SW',

  // ── Pays-Bas ──────────────────────────────────────────────────────────────
  'ASML.AS','PRX.AS','HEIA.AS','INGA.AS',
  'AD.AS','RAND.AS','PHIA.AS','WKL.AS',

  // ── Royaume-Uni ───────────────────────────────────────────────────────────
  'AZN.L','ULVR.L','SHEL.L','BP.L','GSK.L',
  'DGE.L','RIO.L','HSBA.L','LLOY.L','BATS.L','VOD.L','BHP.L','CPG.L',

  // ── Scandinavie ───────────────────────────────────────────────────────────
  'NOVO-B.CO','NESTE.HE','SAND.ST','ATCO-A.ST','VOLV-B.ST',

  // ── Italie & Espagne ──────────────────────────────────────────────────────
  'RACE.MI','ENI.MI','ENEL.MI','ISP.MI','UCG.MI',
  'ITX.MC','SAN.MC','IBE.MC',

  // ── Canada ────────────────────────────────────────────────────────────────
  'SHOP.TO','RY.TO','TD.TO','ENB.TO','CNQ.TO',
  'CP.TO','CNR.TO','SU.TO','BMO.TO','BNS.TO',
  'ATD.TO','TRI.TO','MFC.TO','POW.TO',
]

export const SECTORS = [
  'Technology','Financials','Healthcare','Consumer Discretionary',
  'Consumer Staples','Industrials','Energy','Materials',
  'Real Estate','Utilities','Communication Services',
]
