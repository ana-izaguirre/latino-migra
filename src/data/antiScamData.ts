export interface CountryAntiScamTip {
  country: string;
  countryCode: string;
  flag: string;
  emergencyPhone: string;
  policeUrl: string;
  officialRentalPortalInfo: string;
  keyScamAlerts: {
    scamType: string;
    warningSign: string;
    howToProtect: string;
  }[];
  officialConsumerProtectionAgency: string;
}

export const COUNTRY_ANTI_SCAM_DATA: Record<string, CountryAntiScamTip> = {
  ES: {
    country: "España",
    countryCode: "ES",
    flag: "🇪🇸",
    emergencyPhone: "091 (Policía Nacional) / 062 (Guardia Civil) / 112 (Emergencias)",
    policeUrl: "https://www.policia.es/_es/denuncias.php",
    officialRentalPortalInfo: "Utiliza portales contrastados como Idealista, Fotocasa, Badi o residencias universitarias oficiales (RESA). En España, la fianza legal de alquiler por ley (LAU) es de 1 mes (o 2 meses para uso distinto de vivienda) y debe depositarse en el organismo autonómico (ej. IVIMA en Madrid, INCASÒL en Cataluña).",
    officialConsumerProtectionAgency: "Consumo España & Oficina Municipal de Información al Consumidor (OMIC)",
    keyScamAlerts: [
      {
        scamType: "Estafa de alquiler por 'Airbnb / TripAdvisor falso' o 'Propietario en el extranjero'",
        warningSign: "El supuesto arrendador dice estar fuera de España (ej. trabajando en Reino Unido o como médico) y pide transferir dinero por Western Union, MoneyGram o un link clonado de Airbnb antes de ver el piso.",
        howToProtect: "NUNCA envíes dinero por adelantado sin haber visto el piso en persona o sin verificación por videollamada en directo dentro de la vivienda. Pide siempre nota simple registral si alquilas a particulares."
      },
      {
        scamType: "Venta de citas previas de Extranjería / TIE / Asilo",
        warningSign: "Grupos de WhatsApp o locutorios cobrando de 50€ a 300€ por 'conseguir una cita previa' en la comisaría.",
        howToProtect: "Las citas previas del Ministerio del Interior son 100% GRATUITAS por ley. El cobro por citas es una actividad ilícita que la Policía Nacional persigue activamente."
      },
      {
        scamType: "Falsas ofertas de contrato de trabajo para arraigo",
        warningSign: "Individuos o gestorías piratas que ofrecen venderte un 'precontrato de trabajo' por 1.000€ - 3.000€ para tramitar tu arraigo o visado.",
        howToProtect: "Es un delito de falsedad documental y fraude a la Seguridad Social que causa la denegación inmediata y orden de expulsión."
      }
    ]
  },
  PT: {
    country: "Portugal",
    countryCode: "PT",
    flag: "🇵🇹",
    emergencyPhone: "112 (Número Nacional de Emergencia) / PSP (Polícia de Segurança Pública)",
    policeUrl: "https://queixaselectronicas.mai.gov.pt",
    officialRentalPortalInfo: "Portales confiables: Idealista PT, Imovirtual, Uniplaces, Casa Sapo. Exige siempre el contrato de arrendamiento registrado en la Autoridade Tributária (Finanças) para obtener tu comprobante oficial (Recibo de Renda Eletrónico).",
    officialConsumerProtectionAgency: "DECO PROTeste (Asociação Portuguesa para a Defesa do Consumidor)",
    keyScamAlerts: [
      {
        scamType: "Contrato de arrendamiento sin registro en 'Finanças'",
        warningSign: "El arrendador te ofrece una rebaja si no se declara el contrato y se paga en efectivo en mano.",
        howToProtect: "Sin contrato registrado en la Autoridade Tributária no podrás obtener tu 'Atestado de Residência' en la Junta de Freguesia ni tramitar tu manifestación de interés o cita ante la AIMA (Agência para a Integração, Migrações e Asilo)."
      },
      {
        scamType: "Cobro de tarifas abusivas para conseguir NIF o Cuenta Bancaria",
        warningSign: "Intermediarios no acreditados que cobran sumas exorbitantes prometiendo NIF exprés sin representación fiscal legal.",
        howToProtect: "El NIF se tramita en las oficinas de Finanças de forma gratuita o con costo mínimo regulado; utiliza únicamente abogados colegiados (Ordem dos Advogados) o solicitadores oficiales."
      },
      {
        scamType: "Falsos visados de búsqueda de empleo (Procura de Trabalho)",
        warningSign: "Agencias que prometen garantizarte un visado de búsqueda de trabajo sin presentar el comprobante de fondos del IEFP.",
        howToProtect: "El visado exige demostrar 3 salarios mínimos portugueses en cuenta bancaria y registrarse en el portal oficial del IEFP."
      }
    ]
  },
  AU: {
    country: "Australia",
    countryCode: "AU",
    flag: "🇦🇺",
    emergencyPhone: "000 (Triple Zero - Policía, Ambulancia y Bomberos)",
    policeUrl: "https://www.scamwatch.gov.au",
    officialRentalPortalInfo: "Portales oficiales: Realestate.com.au, Domain.com.au, Flatmates.com.au. En Australia, el depósito (Bond) NUNCA se entrega en mano al dueño; por ley debe ser retenido por la autoridad gubernamental del estado (ej. RBO / RTBA en Victoria o NSW Fair Trading).",
    officialConsumerProtectionAgency: "ACCC (Australian Competition and Consumer Commission) & Fair Work Ombudsman",
    keyScamAlerts: [
      {
        scamType: "Estafa del Bond (Fianza de alquiler) por transferencia bancaria directa",
        warningSign: "El propietario te pide transferir el 'Bond' (equivalente a 4 semanas) directamente a su cuenta bancaria personal antes de inspeccionar.",
        howToProtect: "Insiste en que el Bond sea depositado a través del organismo oficial de protección de inquilinos del estado (ej. Rental Bonds Online) que te enviará un recibo gubernamental."
      },
      {
        scamType: "Explotación salarial por debajo del salario mínimo (Cash-in-hand)",
        warningSign: "Restaurantes o tiendas que ofrecen pagar $15 - $18 AUD por hora en efectivo sin registrar superannuation ni abonar payslips.",
        howToProtect: "El salario mínimo legal en Australia es de aprox. $24.10 AUD/hora (más 25% de casual loading si aplica). Denuncia anónimamente en el Fair Work Ombudsman; tu visa NO será cancelada por denunciar abusos laborales (Assurance Protocol)."
      },
      {
        scamType: "Falsos agentes de migración sin registro MARA",
        warningSign: "Personas en redes sociales que se hacen pasar por 'asesores migratorios' sin número de registro MARN.",
        howToProtect: "En Australia es ilegal brindar asesoramiento migratorio sin estar registrado en la OMARA (Office of the Migration Agents Registration Authority). Verifica siempre en mara.gov.au."
      }
    ]
  },
  DE: {
    country: "Alemania",
    countryCode: "DE",
    flag: "🇩🇪",
    emergencyPhone: "110 (Polizei) / 112 (Notarzt / Feuerwehr)",
    policeUrl: "https://www.polizei.de",
    officialRentalPortalInfo: "Portales recomendados: WG-Gesucht, ImmoScout24, Immowelt, Studentenwerk local. La fianza (Kaution) por ley (BGB § 551) no puede superar 3 meses de alquiler básico (Kaltmiete) y tienes derecho a pagarla en 3 cuotas mensuales.",
    officialConsumerProtectionAgency: "Verbraucherzentrale (Central de Consumidores de Alemania)",
    keyScamAlerts: [
      {
        scamType: "Alquiler sin posibilidad de 'Anmeldung' (Empadronamiento)",
        warningSign: "El anuncio especifica 'Keine Anmeldung möglich' (Sin posibilidad de empadronamiento).",
        howToProtect: "El Anmeldung es OBLIGATORIO por ley alemana dentro de los 14 días. Sin él, no puedes abrir cuenta bancaria, obtener tu Tax ID (Steuer-ID), ni renovar tu permiso de residencia ante la Ausländerbehörde."
      },
      {
        scamType: "Envío de llaves por mensajería DHL previo pago",
        warningSign: "El arrendador afirma que vive en el extranjero y que enviará las llaves por DHL/UPS una vez hecha la transferencia bancaria.",
        howToProtect: "Es una estafa clásica del 100% de los casos. Nunca pagues sin firmar el Mietvertrag y recibir la Wohnungsgeberbestätigung firmada."
      },
      {
        scamType: "Proveedores no autorizados de Sperrkonto (Cuenta bloqueada)",
        warningSign: "Entidades dudosas ofreciendo cuentas bloqueadas sin aval del Ministerio de Asuntos Exteriores.",
        howToProtect: "Usa únicamente proveedores aprobados por el Ministerio de Asuntos Exteriores de Alemania (ej. Coracle, Expatrio, Fintiba o Deutsche Bank)."
      }
    ]
  },
  CA: {
    country: "Canadá",
    countryCode: "CA",
    flag: "🇨🇦",
    emergencyPhone: "911 (Emergency Police, Ambulance, Fire)",
    policeUrl: "https://www.antifraudcentre-centreantifraude.ca",
    officialRentalPortalInfo: "Portales: Rentals.ca, Realtor.ca, Zumper, Kijiji (con precaución), residencias oficiales universitarias. En provincias como Ontario, es ilegal que el arrendador solicite más de 1 mes de depósito de renta.",
    officialConsumerProtectionAgency: "Canadian Anti-Fraud Centre (CAFC) & Better Business Bureau (BBB)",
    keyScamAlerts: [
      {
        scamType: "Llamadas amenazantes simulando ser de IRCC / CRA o policía",
        warningSign: "Llamada automatizada diciendo que tu visado o SIN (Social Insurance Number) ha sido suspendido y solicitando pago inmediato en criptomonedas o tarjetas regalo.",
        howToProtect: "IRCC y la Agencia Tributaria de Canadá (CRA) NUNCA llaman amenazando con deportación ni piden pagos por tarjetas de regalo o criptomonedas. Cuelga de inmediato."
      },
      {
        scamType: "Falsos consultores de inmigración sin licencia CICC / RCIC",
        warningSign: "Agentes que prometen LMIA garantizado o residencia permanente asegurada a cambio de miles de dólares.",
        howToProtect: "Verifica que el consultor tenga licencia activa en el portal oficial del College of Immigration and Citizenship Consultants (college-ic.ca)."
      }
    ]
  },
  IE: {
    country: "Irlanda",
    countryCode: "IE",
    flag: "🇮🇪",
    emergencyPhone: "999 / 112 (Garda Síochána - Policía Nacional de Irlanda)",
    policeUrl: "https://www.garda.ie",
    officialRentalPortalInfo: "Portales: Daft.ie, Rent.ie, HostingPower. En Irlanda, la Residential Tenancies Board (RTB) regula los contratos de alquiler y resolución de disputas.",
    officialConsumerProtectionAgency: "Competition and Consumer Protection Commission (CCPC) & RTB (Residential Tenancies Board)",
    keyScamAlerts: [
      {
        scamType: "Alquiler de camas hacinadas o falsos contratos en Dublín",
        warningSign: "Habitaciones con 4 a 6 literas sin ventilación o anuncios en Facebook pidiendo transferencias inmediatas por Revolut.",
        howToProtect: "Exige ver la habitación y verificar que la vivienda cumpla con los estándares mínimos de habitabilidad de la RTB. Guarda todos los recibos y conversaciones."
      },
      {
        scamType: "Escuelas de inglés no acreditadas en ILEP",
        warningSign: "Academias ofreciendo cursos a precios sospechosamente bajos que no están en el listado oficial ILEP.",
        howToProtect: "Para que tu visa Stamp 2 con permiso de trabajo sea aprobada, el curso DEBE estar registrado en la lista oficial ILEP (Interim List of Eligible Programmes) del Departamento de Justicia."
      }
    ]
  },
  US: {
    country: "Estados Unidos",
    countryCode: "US",
    flag: "🇺🇸",
    emergencyPhone: "911 (Emergency)",
    policeUrl: "https://www.ic3.gov (FBI Internet Crime Complaint Center)",
    officialRentalPortalInfo: "Portales: Zillow, Apartments.com, Trulia, Off-Campus Housing de tu universidad. Las universidades cuentan con oficinas de International Student Services (ISSO) para asesorarte.",
    officialConsumerProtectionAgency: "FTC (Federal Trade Commission) & Consumer Financial Protection Bureau (CFPB)",
    keyScamAlerts: [
      {
        scamType: "Estafa de trabajo 'Mystery Shopper' o envío de cheques sin fondos",
        warningSign: "Te envían un cheque por correo antes de empezar a trabajar y te piden depositarlo y transferir parte del dinero de vuelta.",
        howToProtect: "El cheque rebotará días después y tu banco te cobrará a ti la totalidad del dinero. Nunca aceptes cheques de extraños ni transfieras dinero de vuelta."
      },
      {
        scamType: "Llamadas de supuestos agentes de USCIS / DHS exigiendo pagos",
        warningSign: "El identificador de llamada simula el número oficial de USCIS y exigen pagos bajo amenaza de cancelación de tu estatus F-1 o J-1.",
        howToProtect: "USCIS nunca te pedirá dinero por teléfono ni por transferencias electrónicas directas. Consulta siempre con el DSO de tu universidad."
      }
    ]
  },
  FR: {
    country: "Francia",
    countryCode: "FR",
    flag: "🇫🇷",
    emergencyPhone: "17 (Police Nationale) / 112 (Urgences Européennes)",
    policeUrl: "https://www.pre-plainte-en-ligne.gouv.fr",
    officialRentalPortalInfo: "Portales: SeLoger, PAP.fr, Studapart, residencias CROUS para estudiantes. La garantía de alquiler pública gratuita Visale (Action Logement) te respalda como aval sin costo.",
    officialConsumerProtectionAgency: "DGCCRF (Direction Générale de la Concurrence, de la Consommation et de la Répression des Fraudes)",
    keyScamAlerts: [
      {
        scamType: "Pago de reserva de alojamiento por Western Union / MoneyGram / Transcash",
        warningSign: "El arrendador solicita cupones Transcash o transferencias internacionales para 'reservar la visita'.",
        howToProtect: "En Francia es estrictamente ilegal solicitar dinero antes de la firma formal del contrato de alquiler (Bail de location)."
      }
    ]
  },
  IT: {
    country: "Italia",
    countryCode: "IT",
    flag: "🇮🇹",
    emergencyPhone: "112 (Numero Unico Europeo) / 113 (Polizia di Stato)",
    policeUrl: "https://www.commissariatodips.it",
    officialRentalPortalInfo: "Portales: Immobiliare.it, Idealista IT, Casa.it. Exige siempre el 'Contratto di locazione' registrado en la Agenzia delle Entrate.",
    officialConsumerProtectionAgency: "Unione Nazionale Consumatori & AGCM",
    keyScamAlerts: [
      {
        scamType: "Contratos de alquiler en negro (affitto in nero)",
        warningSign: "El casero se niega a registrar el contrato en la Agenzia delle Entrate.",
        howToProtect: "Sin contrato registrado no podrás tramitar tu Permesso di Soggiorno en la Questura ni solicitar las becas DSU universitarias."
      }
    ]
  }
};
