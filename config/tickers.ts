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

  // ── France – Valeurs moyennes & small caps (marchés réglementés) ──────────
  'ABCA.PA',  // ABC arbitrage
  'ALCOF.PA', // Cofidur (EMS electronique)
  'ALESA.PA', // Ecoslops (recyclage pétrole)
  'ALHIT.PA', // HITECHPROS (ESN/conseil IT)
  'ALIMR.PA', // Immersion SA
  'ALMII.PA', // M2i Formation
  'ALVDM.PA', // Voyageurs du Monde
  'ATO.PA',   // Atos SE
  'AURE.PA',  // Aurea (recyclage industriel)
  'BOI.PA',   // Boiron
  'CBR.PA',   // Robertet (arômes & parfums)
  'FII.PA',   // LISI Group (fixations aéronautiques)
  'FNAC.PA',  // Fnac Darty
  'FREY.PA',  // Frey (REIT retail parks)
  'GBB.PA',   // Guerbet (imagerie médicale)
  'GEA.PA',   // Grenobloise d'Electronique
  'HCO.PA',   // High Co. (marketing data)
  'IDIP.PA',  // IDI (capital-investissement coté)
  'LNA.PA',   // LNA Santé
  'LSS.PA',   // Lectra
  'MLCMG.PA', // CMG Cleantech
  'NXI.PA',   // Nexity (promotion immobilière)
  'POXEL.PA', // Poxel (pharma)
  'PVL.PA',   // Plastiques du Val de Loire
  'SESG.PA',  // SES S.A. (satellite)
  'SMCP.PA',  // SMCP (Sandro, Maje, Claudie Pierlot)
  'VETO.PA',  // Vétoquinol (santé animale)

  // ── France – Euronext Growth (vérifiés Yahoo Finance) ─────────────────────
  // Industrie & services
  'ALDLS.PA', // DLSI (Delfingen Industry, câbles auto)
  'ALREA.PA', // Réalités (promotion immobilière)
  'ALMOU.PA', // Moulinvest (sciage bois)
  'ALBON.PA', // Compagnie Lebon (holding)
  'ALCAT.PA', // CATANA GROUP (yachts de luxe)
  'ALMER.PA', // Sapmer (pêche thonière)
  'ALMAR.PA', // Mare Nostrum (RH/interim)
  'ALFOR.PA', // FORSEE POWER (batteries industrielles)
  'ALFRE.PA', // Freelance.com (portage salarial)
  'ALROC.PA', // RocTool (composites haute performance)
  'ALBOU.PA', // Bourrelier Group (bricolage)
  'ALORD.PA', // Ordissimo (tablettes seniors)
  'ALODC.PA', // Omer-Decugis (import fruits exotiques)
  'ALAGO.PA', // E-Pango
  'ALARF.PA', // Adeunis (IoT industriel)
  'ALAVI.PA', // AdVini (vins & spiritueux)
  'ALINN.PA', // Innelec Multimédia (distribution high-tech)
  'ALLEX.PA', // Lexibook (jouets électroniques)
  // Technologie & software
  'ALWIT.PA', // Witbe (monitoring vidéo réseau)
  'ALBLD.PA', // Bilendi (data & études marché)
  'ALPRG.PA', // Prologue (logiciels santé)
  'ALVIA.PA', // Vialife
  'ALVIN.PA', // Vinpai (peintures industrielles)
  'ALINS.PA', // Intrasense (imagerie médicale IA)
  'ALIMO.PA', // Groupimo (immobilier tech)
  'ALJXR.PA', // Archos (électronique grand public)
  'ALKLA.PA', // Klarsen
  // Biotech & santé
  'ALGEN.PA', // genOway (modèles animaux OGM R&D)
  'ALTHE.PA', // Theraclion (ultrasons thérapeutiques)
  'ALSGD.PA', // SpineGuard (guidage chirurgical)
  'ALSEN.PA', // Sensorion (surdité, biotech)
  'ALBIO.PA', // Biosynex (tests rapides)
  'ALINT.PA', // IntegraGen (génomique)
  'ALMDT.PA', // Median Technologies (IA oncologie)
  'ALCBI.PA', // Crypto Blockchain Industries
  'ALENT.PA', // Ethero
  'ALAQU.PA', // Aquila
  // Non-AL Euronext Growth / SMEs
  'ADOC.PA',  // Adocia (insulines)
  'GUI.PA',   // Guillemot (gaming peripherals)
  'LACR.PA',  // LACROIX Group (électronique défense)
  'S30.PA',   // Solutions 30 (services terrain)
  'SDG.PA',   // Synergie (intérim/RH)
  'GLO.PA',   // GL Events (événementiel)
  'THEP.PA',  // Thermador Groupe (distribution thermique)
  'PIG.PA',   // Haulotte Group (nacelles élévatrices)
  'ITP.PA',   // Interparfums (parfums licences)
  'NRG.PA',   // NRJ Group (radio/TV)
  'BEN.PA',   // Bénéteau (bateaux)
  'MBWS.PA',  // Marie Brizard Wine & Spirits
  'CBOT.PA',  // CBo Territoria (foncière La Réunion)
  'METEX.PA', // METabolic EXplorer (biotech fermentation)
  'OSE.PA',   // OSE Immunotherapeutics
  'TNG.PA',   // Transgene (vaccins thérapeutiques)
  'DBV.PA',   // DBV Technologies (allergies alimentaires)

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
