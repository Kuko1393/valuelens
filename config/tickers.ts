const rawTickers = [
  // US — Mega Caps Tech & Platforms
  'AAPL','MSFT','GOOGL','AMZN','META','NVDA','TSLA','NFLX','CRM','ADBE',
  'ORCL','SAP','INTU','PANW','SNOW','WDAY','MDB','DDOG','NET','CRWD',
  'ZS','OKTA','PLTR','TEAM','HUBS','TTD',
  // US — Semiconductors
  'AVGO','TXN','QCOM','AMD','AMAT','LRCX','KLAC','MCHP','TER','ENTG',
  'ON','ASML',
  // US — Financials
  'V','MA','JPM','GS','MS','AXP','BRK-B','BLK','SPGI','MCO',
  'ICE','CME','MSCI','FDS','CBOE','MORN','SEIC','RJF',
  // US — Healthcare
  'UNH','LLY','JNJ','MRK','ABBV','BMY','AMGN','GILD','REGN','VRTX',
  'PFE','ABT','TMO','DHR','A','BDX','SYK','ISRG','MDT','EW',
  'BSX','ZBH','IDXX','ZTS','ALGN','COO','HOLX','DGX',
  // US — Consumer Staples & Retail
  'WMT','KO','PEP','PG','COST','TJX','ROST','DLTR','DG','CLX',
  'MKC','KHC','GIS','HSY','SJM','CHD','EL','NKE',
  // US — Restaurants & Leisure
  'MCD','SBUX','CMG','YUM','DPZ','HLT','MAR','H','EXPE',
  // US — Industrials & Distribution
  'CAT','DE','EMR','ITW','DOV','PH','AME','ROK','IR','CARR',
  'OTIS','HUBB','FTV','ROL','FAST','GWW','ODFL','SAIA','XPO',
  'UPS','FDX','JBHT','CHRW','EXPD','CTAS','PAYX','ADP',
  // US — Energy & Utilities
  'XOM','CVX','COP','EOG','SLB','HAL','NEE','DUK','SO',
  'AEP','EXC','D','WEC','DTE','PPL','AEE','CMS',
  // US — REITs
  'PLD','AMT','EQIX','CCI','O','VICI','SPG','PSA','EXR','AVB',
  // US — Materials & Misc
  'LIN','APD','ECL','PPG','SHW','NUE','MLM','VMC','PKG','IP','BLL',
  // US — Mid Caps
  'ROP','WST','ALLE','POOL','NVR','HD','BAC','PM','CSCO',

  // France — CAC 40
  'MC.PA','OR.PA','RMS.PA','AIR.PA','SAF.PA','TTE.PA','SAN.PA','AI.PA',
  'SU.PA','BN.PA','DSY.PA','KER.PA','BNP.PA','DG.PA','SGO.PA','ML.PA',
  'HO.PA','LR.PA','RI.PA','PUB.PA','ENGI.PA','ORA.PA','VIE.PA','CA.PA',
  'GLE.PA','ACA.PA','STMPA.PA','RNO.PA','EN.PA','WLN.PA','EDEN.PA',
  'URW.PA','VIV.PA','AM.PA','AC.PA','TKO.PA','BIM.PA','AXA.PA',
  // France — Mid caps
  'AKE.PA','ALO.PA','CAP.PA','COFA.PA','ELIS.PA','ERF.PA','GET.PA',
  'GFC.PA','GTT.PA','ICAD.PA','IPN.PA','NEX.PA','RXL.PA','SOI.PA',
  'SOP.PA','SPIE.PA','TEC.PA','TFI.PA',
  // France — Small/mid quality
  'ABCA.PA','BOI.PA','CBR.PA','FII.PA','FNAC.PA','FREY.PA','GBB.PA',
  'HCO.PA','IDIP.PA','LNA.PA','LSS.PA','NXI.PA','SDG.PA','GLO.PA',
  'THEP.PA','ITP.PA','NRG.PA','BEN.PA','VETO.PA','SMCP.PA','LACR.PA',
  'GUI.PA','ATO.PA','S30.PA',

  // Germany — DAX 40
  'SAP.DE','SIE.DE','ALV.DE','MUV2.DE','DTE.DE','ADS.DE','BMW.DE',
  'MBG.DE','BAS.DE','BAYN.DE','VOW3.DE','HEN3.DE','IFX.DE','LIN.DE',
  'DBK.DE','ENR.DE','MTX.DE','SY1.DE','CON.DE','RWE.DE','MRK.DE',
  'DHL.DE','BEI.DE','FRE.DE','QIA.DE','DTG.DE','SHL.DE','ZAL.DE',
  'PUM.DE','DHER.DE',
  // Germany — MDAX quality
  'SRT3.DE','AFX.DE','BNR.DE','BC8.DE','EVK.DE','KBX.DE','VNA.DE',
  'TLX.DE','BOSS.DE','NEM.DE','RHM.DE','WCH.DE','G24.DE','NDX1.DE',
  'LEG.DE','AIXA.DE','FNTN.DE','TEG.DE','RAA.DE','SBS.DE','1COV.DE',
  'DMP.DE','DWS.DE','TMV.DE','S92.DE','KION.DE',

  // Switzerland
  'NESN.SW','NOVN.SW','ROG.SW','ABBN.SW','GIVN.SW','PGHN.SW','SREN.SW',
  'UBSG.SW',

  // Netherlands
  'ASML.AS','HEIA.AS','INGA.AS','AD.AS','PHIA.AS','WKL.AS','PRX.AS',

  // UK
  'AZN.L','ULVR.L','SHEL.L','GSK.L','DGE.L','RIO.L','BP.L',
  'HSBA.L','BATS.L','BHP.L','CPG.L',

  // Canada
  'SHOP.TO','RY.TO','TD.TO','ENB.TO','CNQ.TO','CP.TO','CNR.TO',
  'ATD.TO','TRI.TO','MFC.TO',
]

export const TICKER_UNIVERSE = Array.from(new Set(rawTickers))

export const SECTORS = [
  'Technology','Financial Services','Healthcare','Consumer Cyclical',
  'Consumer Defensive','Industrials','Energy','Basic Materials',
  'Real Estate','Utilities','Communication Services',
]
