(() => {
  const data = window.CHEMVAULT_DATA || (window.CHEMVAULT_DATA = {});
  const materialData = window.CHEMVAULT_MATERIALS || (window.CHEMVAULT_MATERIALS = { materials: [], propertyAxes: [], characterizationMethods: [] });

  data.compounds = data.compounds || [];
  data.reagents = data.reagents || [];
  data.routes = data.routes || [];
  data.concepts = data.concepts || [];
  materialData.materials = materialData.materials || [];
  materialData.propertyAxes = materialData.propertyAxes || [];
  materialData.characterizationMethods = materialData.characterizationMethods || [];

  function addUnique(list, items) {
    const known = new Set(list.map((item) => item.id));
    items.forEach((item) => {
      if (!known.has(item.id)) {
        list.push(item);
        known.add(item.id);
      }
    });
  }

  addUnique(data.compounds, [
    {
      id: "isobutenylbenzene",
      name: "Isobutenylbenzene",
      formula: "C10H12",
      cas: "768-49-0",
      family: "Aromatic alkene",
      synonyms: ["2-methyl-1-phenylpropene", "2-methylprop-1-enylbenzene"],
      summary: "A substituted styrene-like alkene used as a query example for linking compound identity to PubChem and PubMed metadata.",
      evidenceNote: "Confirm exact isomer, stereochemistry and synonym set against PubChem before citing physical properties.",
      tags: ["alkene", "aromatic", "styrene", "PubChem"]
    },
    {
      id: "aspirin",
      name: "Aspirin",
      formula: "C9H8O4",
      cas: "50-78-2",
      family: "Carboxylic acid ester",
      synonyms: ["acetylsalicylic acid", "ASA"],
      summary: "Benchmark small molecule for acid, ester and pharmaceutical metadata searches.",
      evidenceNote: "Use PubChem for identifiers and PubMed for biomedical literature context.",
      tags: ["drug", "ester", "carboxylic acid", "NIH"]
    },
    {
      id: "caffeine",
      name: "Caffeine",
      formula: "C8H10N4O2",
      cas: "58-08-2",
      family: "Xanthine alkaloid",
      synonyms: ["1,3,7-trimethylxanthine"],
      summary: "Nitrogen-rich heterocycle used in spectroscopy, extraction and pharmacology examples.",
      evidenceNote: "Report hydration state and source when comparing melting point or spectra.",
      tags: ["alkaloid", "heterocycle", "stimulant"]
    },
    {
      id: "acetaminophen",
      name: "Acetaminophen",
      formula: "C8H9NO2",
      cas: "103-90-2",
      family: "Phenolic amide",
      synonyms: ["paracetamol", "APAP"],
      summary: "Phenolic amide often used for teaching functional-group analysis and drug metabolism context.",
      evidenceNote: "Distinguish compound identity from formulation and dosage claims.",
      tags: ["phenol", "amide", "drug"]
    },
    {
      id: "ibuprofen",
      name: "Ibuprofen",
      formula: "C13H18O2",
      cas: "15687-27-1",
      family: "Arylpropionic acid",
      synonyms: ["2-(4-isobutylphenyl)propionic acid"],
      summary: "Chiral carboxylic acid drug useful for stereochemistry, acid-base extraction and literature-search cases.",
      evidenceNote: "State racemate or enantiomer when making biological or physical-property claims.",
      tags: ["chiral", "carboxylic acid", "drug"]
    },
    {
      id: "benzaldehyde",
      name: "Benzaldehyde",
      formula: "C7H6O",
      cas: "100-52-7",
      family: "Aromatic aldehyde",
      synonyms: ["benzenecarbaldehyde"],
      summary: "Aromatic aldehyde standard for carbonyl spectroscopy, oxidation and reduction comparisons.",
      evidenceNote: "Aldehydic proton and carbonyl features should be interpreted together.",
      tags: ["aldehyde", "aromatic", "spectroscopy"]
    },
    {
      id: "acetophenone",
      name: "Acetophenone",
      formula: "C8H8O",
      cas: "98-86-2",
      family: "Aromatic ketone",
      synonyms: ["methyl phenyl ketone"],
      summary: "Simple aryl ketone used for hydride selectivity and carbonyl assignment examples.",
      evidenceNote: "Ketone assignment should not rely on IR alone; use NMR and reference comparison.",
      tags: ["ketone", "aromatic", "carbonyl"]
    },
    {
      id: "styrene",
      name: "Styrene",
      formula: "C8H8",
      cas: "100-42-5",
      family: "Vinyl arene",
      synonyms: ["ethenylbenzene"],
      summary: "Polymerizable vinyl arene linking organic reactivity, radical polymerization and materials chemistry.",
      evidenceNote: "Inhibitor content and polymerization history matter for experimental interpretation.",
      tags: ["alkene", "polymer", "aromatic"]
    },
    {
      id: "salicylic-acid",
      name: "Salicylic acid",
      formula: "C7H6O3",
      cas: "69-72-7",
      family: "Hydroxybenzoic acid",
      synonyms: ["2-hydroxybenzoic acid"],
      summary: "Phenolic acid precursor context for aspirin synthesis and acid-base extraction.",
      evidenceNote: "Intramolecular hydrogen bonding can affect spectral interpretation.",
      tags: ["phenol", "carboxylic acid", "aspirin"]
    },
    {
      id: "dmso",
      name: "Dimethyl sulfoxide",
      formula: "C2H6OS",
      cas: "67-68-5",
      family: "Polar aprotic solvent",
      synonyms: ["DMSO"],
      summary: "Common solvent and oxidation-system component in Swern-type chemistry.",
      evidenceNote: "Residual solvent peaks and water content should be recorded in NMR contexts.",
      tags: ["solvent", "sulfoxide", "NMR"]
    },
    {
      id: "dmf",
      name: "N,N-Dimethylformamide",
      formula: "C3H7NO",
      cas: "68-12-2",
      family: "Polar aprotic solvent",
      synonyms: ["DMF"],
      summary: "High-boiling polar solvent used in substitution, coupling and polymer chemistry.",
      evidenceNote: "Toxicity and residual solvent burden should be separated from reaction scope claims.",
      tags: ["solvent", "amide", "coupling"]
    },
    {
      id: "acetonitrile",
      name: "Acetonitrile",
      formula: "C2H3N",
      cas: "75-05-8",
      family: "Nitrile solvent",
      synonyms: ["MeCN"],
      summary: "Polar solvent commonly used in HPLC, electrochemistry and synthetic methods.",
      evidenceNote: "Water content and grade can affect electrochemical and kinetic claims.",
      tags: ["solvent", "HPLC", "electrochemistry"]
    },
    {
      id: "thf",
      name: "Tetrahydrofuran",
      formula: "C4H8O",
      cas: "109-99-9",
      family: "Ether solvent",
      synonyms: ["THF"],
      summary: "Coordinating ether solvent used with organometallics and hydride reagents.",
      evidenceNote: "Peroxide risk and dryness should be stated for sensitive reactions.",
      tags: ["solvent", "ether", "organometallic"]
    },
    {
      id: "ferrocene",
      name: "Ferrocene",
      formula: "C10H10Fe",
      cas: "102-54-5",
      family: "Organometallic sandwich complex",
      synonyms: ["bis(cyclopentadienyl)iron"],
      summary: "Stable organometallic reference compound for redox, symmetry and spectroscopy examples.",
      evidenceNote: "Electrochemical comparisons require reference electrode and electrolyte conditions.",
      tags: ["organometallic", "redox", "electrochemistry"]
    },
    {
      id: "glucose",
      name: "D-Glucose",
      formula: "C6H12O6",
      cas: "50-99-7",
      family: "Carbohydrate",
      synonyms: ["dextrose"],
      summary: "Reducing sugar used in stereochemistry, solubility and biochemical context searches.",
      evidenceNote: "Anomeric form and hydration state matter for detailed structural claims.",
      tags: ["carbohydrate", "biochemistry", "stereochemistry"]
    }
  ]);

  addUnique(data.reagents, [
    {
      id: "mcpba",
      name: "meta-Chloroperoxybenzoic acid",
      formula: "mCPBA",
      category: "Oxidation",
      risk: "oxidizer",
      focus: "Epoxidation and Baeyer-Villiger oxidation",
      tags: ["peracid", "epoxidation", "alkene", "oxidation"],
      transformations: ["Alkene to epoxide", "Ketone to ester or lactone in Baeyer-Villiger contexts"],
      conditions: ["Often used in chlorinated solvent at controlled temperature", "Buffering may reduce acid-sensitive side reactions"],
      scope: "Useful electrophilic oxygen-transfer reagent for alkene and carbonyl chemistry.",
      mechanism: "Concerted oxygen transfer to alkenes or Criegee-type rearrangement after peracid addition to carbonyls.",
      traps: ["Commercial material may contain stabilizer and water", "Electron-rich alkenes react faster than electron-poor alkenes"],
      safety: "Organic peroxide oxidizer. Avoid friction, heat and incompatible reducing agents."
    },
    {
      id: "nbs",
      name: "N-Bromosuccinimide",
      formula: "NBS",
      category: "Halogenation",
      risk: "oxidizer",
      focus: "Allylic bromination and bromonium chemistry",
      tags: ["bromination", "radical", "allylic", "alkene"],
      transformations: ["Allylic C-H to allylic bromide", "Alkene bromination under ionic conditions"],
      conditions: ["Radical initiator or light for allylic bromination", "Solvent and water content tune ionic pathways"],
      scope: "Common bromine source when lower free bromine concentration is desired.",
      mechanism: "Radical chain bromination or electrophilic bromine transfer depending on conditions.",
      traps: ["Competing addition to alkenes can occur", "Regioselectivity follows radical stability and product distribution"],
      safety: "Irritant oxidizer. Avoid incompatible organics and reducing agents."
    },
    {
      id: "lda",
      name: "Lithium diisopropylamide",
      formula: "LDA",
      category: "Base",
      risk: "dry",
      focus: "Kinetic enolate formation",
      tags: ["base", "enolate", "kinetic", "organolithium"],
      transformations: ["Carbonyl compound to lithium enolate", "Directed deprotonation of acidic C-H sites"],
      conditions: ["Dry THF", "Low temperature often used for kinetic control"],
      scope: "Strong hindered non-nucleophilic base for enolate and deprotonation chemistry.",
      mechanism: "Lithium amide abstracts an acidic proton with aggregation and solvent effects.",
      traps: ["Moisture destroys reagent", "Thermodynamic versus kinetic enolate claims require conditions"],
      safety: "Strong base and moisture sensitive. Use inert-atmosphere controls."
    },
    {
      id: "nbuli",
      name: "n-Butyllithium",
      formula: "n-BuLi",
      category: "Organometallic",
      risk: "pyrophoric",
      focus: "Strong base and organolithium reagent",
      tags: ["organolithium", "base", "lithiation", "pyrophoric"],
      transformations: ["Halogen-lithium exchange", "Directed ortho metalation", "Strong deprotonation"],
      conditions: ["Dry hydrocarbon or ether solvent", "Low-temperature addition for selectivity"],
      scope: "Powerful reagent for generating organolithium species and performing metal-halogen exchange.",
      mechanism: "Polar organolithium reactivity shaped by aggregation, solvent and substrate acidity.",
      traps: ["Titration matters for stoichiometry", "Side reactions increase with temperature and electrophile incompatibility"],
      safety: "Pyrophoric solution. Requires trained handling and strict exclusion of air and moisture."
    },
    {
      id: "pd-c",
      name: "Palladium on carbon",
      formula: "Pd/C",
      category: "Catalysis",
      risk: "flammable",
      focus: "Catalytic hydrogenation and hydrogenolysis",
      tags: ["hydrogenation", "catalyst", "alkene", "benzyl"],
      transformations: ["Alkene to alkane", "Benzyl protecting group hydrogenolysis", "Nitro reduction under hydrogenation conditions"],
      conditions: ["Hydrogen atmosphere", "Solvent and catalyst loading define rate and selectivity"],
      scope: "Heterogeneous palladium catalyst for transfer or gas-phase hydrogenation workflows.",
      mechanism: "Substrate adsorption, surface hydrogen transfer and product desorption.",
      traps: ["Catalyst can ignite when dry", "Poisoning and over-reduction must be considered"],
      safety: "Keep wet as supplied and follow hydrogenation risk assessment."
    },
    {
      id: "raney-nickel",
      name: "Raney nickel",
      formula: "Ra-Ni",
      category: "Catalysis",
      risk: "pyrophoric",
      focus: "Hydrogenation and desulfurization",
      tags: ["hydrogenation", "nickel", "desulfurization", "catalyst"],
      transformations: ["Alkene or alkyne hydrogenation", "Thioacetal desulfurization", "Nitro group reduction"],
      conditions: ["Hydrogen or transfer hydrogenation conditions", "Wet catalyst handling"],
      scope: "Porous nickel catalyst used where palladium selectivity or cost is unsuitable.",
      mechanism: "Surface-mediated hydrogen transfer and adsorption-controlled reduction.",
      traps: ["Highly dependent on catalyst grade and activation", "Dry material is dangerous"],
      safety: "Pyrophoric catalyst. Keep wet and handle under institutional controls."
    },
    {
      id: "soc2",
      name: "Thionyl chloride",
      formula: "SOCl2",
      category: "Activation",
      risk: "corrosive",
      focus: "Alcohol and acid chloride formation",
      tags: ["chlorination", "acid chloride", "alcohol", "activation"],
      transformations: ["Carboxylic acid to acid chloride", "Alcohol to alkyl chloride"],
      conditions: ["Often used neat or with catalytic DMF", "Gas evolution requires venting strategy"],
      scope: "Converts oxygenated functional groups into more reactive chlorides.",
      mechanism: "Formation of chlorosulfite or acyl chlorosulfite intermediate followed by substitution.",
      traps: ["Stereochemical outcome for alcohols is condition-dependent", "Acid-sensitive substrates can degrade"],
      safety: "Corrosive, lachrymatory and releases acidic gases."
    },
    {
      id: "oxalyl-chloride",
      name: "Oxalyl chloride",
      formula: "(COCl)2",
      category: "Activation",
      risk: "corrosive",
      focus: "Acid chloride formation and Swern activation",
      tags: ["acid chloride", "Swern", "activation", "chlorination"],
      transformations: ["Carboxylic acid to acid chloride", "DMSO activation in Swern oxidation"],
      conditions: ["Dry solvent", "Low temperature for Swern-type oxidation"],
      scope: "Reactive chlorinating and activating agent for acid derivatives and oxidation systems.",
      mechanism: "Acyl chloride formation or activation of DMSO followed by alkoxysulfonium chemistry.",
      traps: ["Gas evolution and exotherm require control", "Water-sensitive reagent"],
      safety: "Corrosive and toxic gas evolution. Use strict ventilation and trained handling."
    },
    {
      id: "lawessons-reagent",
      name: "Lawesson's reagent",
      formula: "C14H14O2P2S4",
      category: "Thionation",
      risk: "standard",
      focus: "Carbonyl to thiocarbonyl conversion",
      tags: ["thionation", "thiocarbonyl", "amide", "phosphorus"],
      transformations: ["Amide to thioamide", "Ketone or ester to thiocarbonyl derivative"],
      conditions: ["Heated organic solvent", "Substrate and solvent control selectivity"],
      scope: "Useful sulfur-transfer reagent for thioamide and thiocarbonyl synthesis.",
      mechanism: "Reactive phosphorus-sulfur species deliver sulfur to carbonyl substrates.",
      traps: ["Functional-group compatibility needs procedure evidence", "Odor and byproducts complicate work-up"],
      safety: "Use hood controls and consult SDS for sulfur/phosphorus reagent hazards."
    },
    {
      id: "ibx",
      name: "2-Iodoxybenzoic acid",
      formula: "IBX",
      category: "Oxidation",
      risk: "oxidizer",
      focus: "Alcohol oxidation",
      tags: ["hypervalent iodine", "oxidation", "alcohol", "carbonyl"],
      transformations: ["Primary alcohol to aldehyde", "Secondary alcohol to ketone"],
      conditions: ["DMSO or other compatible solvent systems", "Temperature and solubility affect rate"],
      scope: "Hypervalent iodine oxidant often compared with Dess-Martin periodinane.",
      mechanism: "Ligand exchange at iodine followed by elimination to carbonyl product.",
      traps: ["Solubility can limit use", "Thermal and impact sensitivity reports require caution"],
      safety: "Oxidizer. Avoid heating dry material and follow institutional controls."
    },
    {
      id: "wilkinson-catalyst",
      name: "Wilkinson's catalyst",
      formula: "RhCl(PPh3)3",
      category: "Catalysis",
      risk: "standard",
      focus: "Homogeneous alkene hydrogenation",
      tags: ["rhodium", "hydrogenation", "homogeneous", "alkene"],
      transformations: ["Alkene to alkane under hydrogen", "Coordination chemistry teaching examples"],
      conditions: ["Hydrogen atmosphere", "Solvent, ligand and substrate coordination affect activity"],
      scope: "Classic homogeneous hydrogenation catalyst with strong mechanistic teaching value.",
      mechanism: "Ligand dissociation, oxidative addition of hydrogen, alkene coordination, migratory insertion and reductive elimination.",
      traps: ["Poisoning by strongly coordinating groups", "Air sensitivity varies with handling and purity"],
      safety: "Precious-metal catalyst and hydrogenation conditions require suitable controls."
    }
  ]);

  addUnique(materialData.materials, [
    {
      id: "pmma",
      name: "Poly(methyl methacrylate)",
      family: "Acrylic polymers",
      formula: "(C5O2H8)n",
      maturity: 86,
      applications: ["Optical plastics", "Microfluidics", "Dental materials", "Lithography"],
      properties: ["High optical clarity", "Glass transition near room-use range", "Good weathering", "Brittle compared with elastomers"],
      synthesis: "Prepared by free-radical polymerization of methyl methacrylate with thermal or photochemical initiators.",
      characterization: ["GPC molecular weight", "DSC glass transition", "FTIR ester bands", "Optical transmittance"],
      limitations: ["Molecular weight and tacticity affect properties", "Residual monomer can bias biocompatibility claims", "Crazing and solvent sensitivity matter"],
      linkedReagents: ["aibn", "benzoyl-peroxide"],
      evidenceLevel: "Polymer claims need molecular weight, dispersity, additive content and thermal history."
    },
    {
      id: "pvdf",
      name: "Poly(vinylidene fluoride)",
      family: "Fluoropolymers",
      formula: "(C2H2F2)n",
      maturity: 84,
      applications: ["Battery binders", "Membranes", "Piezoelectric films", "Chemical-resistant coatings"],
      properties: ["Chemical resistance", "Polymorph-dependent piezoelectricity", "Hydrophobicity", "Thermal stability"],
      synthesis: "Industrial fluoropolymer produced by vinylidene fluoride polymerization; processing controls crystalline phase.",
      characterization: ["FTIR beta-phase fraction", "DSC melting transition", "XRD polymorph", "Contact angle"],
      limitations: ["Processing history controls phase", "Solvent casting can leave residual solvent", "Binder claims need electrode formulation context"],
      linkedReagents: ["dmf"],
      evidenceLevel: "PVDF records need phase, processing route and additive context."
    },
    {
      id: "polystyrene",
      name: "Polystyrene",
      family: "Vinyl polymers",
      formula: "(C8H8)n",
      maturity: 88,
      applications: ["Model polymer", "Foams", "Insulation", "Particle standards"],
      properties: ["Aromatic side groups", "Amorphous glassy polymer", "Good processability", "Low polarity"],
      synthesis: "Prepared by radical, anionic or controlled polymerization of styrene.",
      characterization: ["GPC molecular weight", "DSC glass transition", "NMR tacticity", "SEC-MALS"],
      limitations: ["Thermal and mechanical claims depend on molecular weight", "Foam behavior is not bulk polymer behavior", "Additives alter properties"],
      linkedReagents: ["aibn", "nbuli"],
      evidenceLevel: "State molecular weight, dispersity and architecture before comparing properties."
    },
    {
      id: "polyethylene-glycol",
      name: "Poly(ethylene glycol)",
      family: "Polyethers",
      formula: "HO-(CH2CH2O)n-H",
      maturity: 86,
      applications: ["Bioconjugation", "Hydrogels", "Drug delivery", "Solubilizing excipient"],
      properties: ["Hydrophilicity", "Molecular-weight tunability", "Low protein adsorption", "Flexible chain"],
      synthesis: "Produced by ethylene oxide polymerization or used as functionalized PEG derivatives.",
      characterization: ["MALDI or GPC mass", "NMR end groups", "DSC crystallinity", "Water uptake"],
      limitations: ["Molecular weight distribution controls behavior", "End-group purity matters", "Biological claims require assay context"],
      linkedReagents: ["edc", "dmap"],
      evidenceLevel: "PEG claims need molecular weight, end-group identity and dispersity."
    },
    {
      id: "zsm-5",
      name: "ZSM-5 zeolite",
      family: "Microporous aluminosilicates",
      formula: "MFI aluminosilicate",
      maturity: 87,
      applications: ["Catalysis", "Molecular sieving", "Aromatization", "Adsorption"],
      properties: ["MFI pore network", "Bronsted acidity", "Shape selectivity", "Hydrothermal stability"],
      synthesis: "Hydrothermal crystallization of silica and alumina sources with organic structure-directing agents.",
      characterization: ["PXRD MFI phase", "N2 adsorption", "NH3-TPD acidity", "SEM crystal morphology"],
      limitations: ["Si/Al ratio controls acidity", "Template removal and defects matter", "Diffusion limits affect catalytic interpretation"],
      linkedReagents: ["tea-solgel"],
      evidenceLevel: "Zeolite claims need phase, Si/Al ratio, acidity and calcination history."
    },
    {
      id: "alumina",
      name: "Aluminium oxide",
      family: "Oxide supports",
      formula: "Al2O3",
      maturity: 88,
      applications: ["Catalyst support", "Chromatography", "Ceramics", "Adsorbents"],
      properties: ["Lewis acidity", "High thermal stability", "Phase-dependent surface area", "Mechanical robustness"],
      synthesis: "Produced by precipitation, calcination or sol-gel routes with phase determined by thermal history.",
      characterization: ["XRD phase", "BET area", "Surface acidity", "SEM morphology"],
      limitations: ["Gamma, alpha and other phases differ strongly", "Surface hydroxylation affects adsorption", "Impurities matter for catalysis"],
      linkedReagents: ["aluminum-isopropoxide"],
      evidenceLevel: "Report phase, surface area, pore structure and pretreatment."
    },
    {
      id: "llzo",
      name: "Lithium lanthanum zirconium oxide",
      family: "Solid electrolytes",
      formula: "Li7La3Zr2O12",
      maturity: 78,
      applications: ["Solid-state batteries", "Lithium metal interfaces", "Ion-conducting ceramics"],
      properties: ["Garnet structure", "Lithium-ion conductivity", "Dense ceramic processing", "Air sensitivity of surface carbonate"],
      synthesis: "Prepared by solid-state reaction, sol-gel or tape-casting routes followed by high-temperature sintering.",
      characterization: ["XRD cubic/tetragonal phase", "EIS ionic conductivity", "SEM density", "XPS surface carbonate"],
      limitations: ["Densification controls conductivity", "Li loss during sintering matters", "Interface resistance dominates cell claims"],
      linkedReagents: ["lithium-carbonate"],
      evidenceLevel: "Battery electrolyte claims need phase, density, conductivity and interface protocol."
    },
    {
      id: "carbon-black",
      name: "Carbon black",
      family: "Conductive carbons",
      formula: "amorphous carbon",
      maturity: 86,
      applications: ["Battery conductive additive", "Rubber reinforcement", "Pigments", "Catalyst supports"],
      properties: ["Aggregate structure", "Conductive network formation", "High surface area", "Surface oxygen variation"],
      synthesis: "Industrial incomplete-combustion material with grade-specific particle and aggregate structure.",
      characterization: ["BET area", "DBP absorption", "TEM aggregate morphology", "Raman disorder"],
      limitations: ["Grade matters", "Loading and dispersion dominate conductivity", "Surface chemistry can affect electrochemistry"],
      linkedReagents: ["graphite-oxide"],
      evidenceLevel: "State grade, surface area, loading and dispersion method."
    }
  ]);

  addUnique(data.routes, [
    { id: "styrene-polymerization", start: "Styrene", target: "Polystyrene", route: ["AIBN initiation", "Radical propagation", "Termination"], note: "Polymerization claims need conversion, molecular weight and inhibitor history." },
    { id: "mma-polymerization", start: "Methyl methacrylate", target: "PMMA", route: ["Radical initiation", "Chain growth", "Purification"], note: "Optical and mechanical claims depend on molecular weight and residual monomer." },
    { id: "alkene-epoxidation", start: "Alkene", target: "Epoxide", route: ["mCPBA oxygen transfer", "Concerted epoxidation"], note: "Stereospecificity follows alkene geometry in many peracid epoxidations." },
    { id: "acid-to-acid-chloride", start: "Carboxylic acid", target: "Acid chloride", route: ["SOCl2 or oxalyl chloride activation", "Gas evolution"], note: "Moisture exclusion and substrate sensitivity determine practical success." },
    { id: "ketone-thionation", start: "Carbonyl", target: "Thiocarbonyl", route: ["Lawesson reagent", "Sulfur transfer"], note: "Thionation should be supported by diagnostic spectroscopy or reference comparison." }
  ]);

  addUnique(data.concepts, [
    {
      id: "compound-identity",
      term: "Compound identity record",
      family: "Data provenance",
      equation: "name + identifier + structure + source link -> citable identity",
      definition: "A local chemistry record that distinguishes human-readable names from machine identifiers such as CID, InChIKey, SMILES and CAS number.",
      academicUse: "Use it before comparing literature, spectra or safety data for a compound with multiple synonyms.",
      evidenceNote: "At least one public identifier and a source link should be retained for reproducibility.",
      sourceRefs: ["pubchem", "iupac-goldbook"]
    },
    {
      id: "live-metadata-import",
      term: "Live metadata import",
      family: "Research informatics",
      equation: "local miss -> external query -> structured source card",
      definition: "A workflow where a static research site requests public scholarly metadata and renders source-linked cards without copying restricted full text.",
      academicUse: "Use it to keep local notes concise while preserving traceability to NIH/NLM and PubChem records.",
      evidenceNote: "Imported metadata is a discovery layer, not a substitute for reading the original source.",
      sourceRefs: ["pubchem", "pubmed"]
    }
  ]);

  addUnique(data.reagents, [
    {
      id: "swern-system",
      name: "Swern oxidation system",
      formula: "DMSO/(COCl)2/Et3N",
      category: "Oxidation",
      risk: "corrosive",
      focus: "Low-temperature alcohol oxidation",
      tags: ["Swern", "DMSO", "alcohol", "aldehyde"],
      transformations: ["Primary alcohol to aldehyde", "Secondary alcohol to ketone"],
      conditions: ["Low temperature", "Dry solvent", "Base quench after activation"],
      scope: "Useful when chromium oxidants are undesirable and acid-sensitive substrates are tolerated.",
      mechanism: "Activated DMSO forms an alkoxysulfonium intermediate followed by base-promoted elimination.",
      traps: ["Temperature control is important", "Dimethyl sulfide odor and gas evolution require planning"],
      safety: "Corrosive activator and malodorous byproducts. Use a hood and trained procedure."
    },
    {
      id: "tpap-nmo",
      name: "TPAP/NMO",
      formula: "Pr4N[RuO4]/NMO",
      category: "Oxidation",
      risk: "oxidizer",
      focus: "Catalytic alcohol oxidation",
      tags: ["ruthenium", "oxidation", "alcohol", "catalytic"],
      transformations: ["Primary alcohol to aldehyde", "Secondary alcohol to ketone"],
      conditions: ["Catalytic TPAP with NMO co-oxidant", "Molecular sieves often used"],
      scope: "Mild catalytic oxidation system for alcohols where substrate compatibility is favorable.",
      mechanism: "Ruthenium oxo species oxidizes alcohol and is regenerated by NMO.",
      traps: ["Water and substrate coordination affect outcome", "Procedure-specific loading matters"],
      safety: "Oxidizing system with heavy-metal catalyst. Follow waste controls."
    },
    {
      id: "dast",
      name: "DAST",
      formula: "Et2NSF3",
      category: "Fluorination",
      risk: "corrosive",
      focus: "Alcohol and carbonyl fluorination",
      tags: ["fluorination", "alcohol", "deoxyfluorination", "sulfur"],
      transformations: ["Alcohol to alkyl fluoride", "Carbonyl to gem-difluoride in selected cases"],
      conditions: ["Dry solvent", "Low-temperature addition frequently used"],
      scope: "Common deoxyfluorinating reagent for introducing C-F bonds under controlled conditions.",
      mechanism: "Sulfur-fluoride activation followed by substitution or fluorination pathway.",
      traps: ["Elimination and rearrangement can compete", "Thermal instability requires caution"],
      safety: "Reactive fluorinating reagent. Avoid heating and incompatible nucleophiles."
    },
    {
      id: "cdi",
      name: "Carbonyldiimidazole",
      formula: "CDI",
      category: "Coupling",
      risk: "standard",
      focus: "Carbonyl activation",
      tags: ["coupling", "imidazole", "amide", "carbonate"],
      transformations: ["Carboxylic acid to imidazolide", "Alcohol to carbonate derivative", "Amine to urea derivative"],
      conditions: ["Aprotic solvent", "Addition of nucleophile after activation"],
      scope: "Useful activating reagent where imidazole byproduct is operationally convenient.",
      mechanism: "Nucleophilic acyl substitution at activated carbonyl intermediate.",
      traps: ["Moisture consumes reagent", "Hindered acids or amines may need optimization"],
      safety: "Moisture-reactive irritant. Use standard dry handling."
    },
    {
      id: "pybop",
      name: "PyBOP",
      formula: "C18H28F6N6OP2",
      category: "Coupling",
      risk: "standard",
      focus: "Peptide and amide coupling",
      tags: ["amide", "peptide", "coupling", "phosphonium"],
      transformations: ["Carboxylic acid plus amine to amide", "Peptide bond formation"],
      conditions: ["Base such as DIPEA", "Polar aprotic solvent"],
      scope: "Phosphonium coupling reagent used for amide-bond formation with reduced racemization in many peptide contexts.",
      mechanism: "Carboxylate activation followed by amine attack and phosphonium byproduct formation.",
      traps: ["Not automatically racemization-free", "Base and additive choice matters"],
      safety: "Consult SDS and peptide-coupling waste procedures."
    },
    {
      id: "hobt",
      name: "1-Hydroxybenzotriazole",
      formula: "HOBt",
      category: "Coupling additive",
      risk: "energetic",
      focus: "Amide coupling additive",
      tags: ["amide", "peptide", "additive", "racemization"],
      transformations: ["Activated ester formation", "Racemization suppression in selected peptide couplings"],
      conditions: ["Used with carbodiimide or phosphonium coupling systems"],
      scope: "Additive for amide coupling that changes leaving-group and side-reaction profile.",
      mechanism: "Forms benzotriazolyl ester intermediate with improved aminolysis behavior.",
      traps: ["Hydration state and handling form matter", "Dry material may be energetic"],
      safety: "Potential energetic hazard when dry. Follow supplier and institutional controls."
    },
    {
      id: "khmds",
      name: "Potassium bis(trimethylsilyl)amide",
      formula: "KHMDS",
      category: "Base",
      risk: "dry",
      focus: "Strong hindered base",
      tags: ["base", "enolate", "amide base", "potassium"],
      transformations: ["Enolate formation", "Deprotonation of weakly acidic substrates"],
      conditions: ["Dry THF or hydrocarbon solvent", "Temperature controls aggregation and selectivity"],
      scope: "Strong non-nucleophilic base with cation effects distinct from lithium analogues.",
      mechanism: "Sterically hindered amide abstracts acidic proton; counterion changes aggregation and reactivity.",
      traps: ["Cation effects can change E/Z enolate ratio", "Moisture destroys reagent"],
      safety: "Strong base, moisture-sensitive solution or solid."
    },
    {
      id: "sodium-azide",
      name: "Sodium azide",
      formula: "NaN3",
      category: "Nucleophile",
      risk: "toxic",
      focus: "Azide substitution and click precursor synthesis",
      tags: ["azide", "nucleophile", "SN2", "click chemistry"],
      transformations: ["Alkyl halide to alkyl azide", "Acyl derivative to acyl azide in selected workflows"],
      conditions: ["Polar aprotic solvent often supports substitution", "Avoid acid and heavy metals"],
      scope: "Useful azide source for substitution and downstream triazole or amine routes.",
      mechanism: "Azide anion acts as nucleophile in substitution or acyl transfer chemistry.",
      traps: ["Hydrazoic acid formation is dangerous", "Heavy-metal azides can be explosive"],
      safety: "Highly toxic and potentially explosive with incompatible metals/acids."
    },
    {
      id: "ad-mix-alpha",
      name: "AD-mix-alpha",
      formula: "Os catalyst/K3Fe(CN)6/K2CO3/ligand",
      category: "Asymmetric oxidation",
      risk: "toxic",
      focus: "Sharpless asymmetric dihydroxylation",
      tags: ["asymmetric", "dihydroxylation", "alkene", "osmium"],
      transformations: ["Alkene to enantioenriched vicinal diol"],
      conditions: ["Biphasic tert-butanol/water often used", "Ligand set controls facial selectivity"],
      scope: "Packaged asymmetric dihydroxylation system for many alkenes.",
      mechanism: "Osmium-catalyzed syn dihydroxylation with chiral ligand-controlled approach.",
      traps: ["Mnemonic selectivity rules need substrate-specific confirmation", "Osmium toxicity dominates risk"],
      safety: "Contains toxic osmium species. Follow specialized waste controls."
    },
    {
      id: "triphosgene",
      name: "Triphosgene",
      formula: "C3Cl6O3",
      category: "Carbonylation",
      risk: "toxic",
      focus: "Phosgene-equivalent carbonyl transfer",
      tags: ["carbonylation", "chloroformate", "carbonate", "isocyanate"],
      transformations: ["Alcohol to chloroformate or carbonate", "Amine to isocyanate or carbamate in selected workflows"],
      conditions: ["Base and dry solvent", "Controlled addition and ventilation"],
      scope: "Solid phosgene equivalent used for carbonyl-transfer chemistry.",
      mechanism: "Thermal or nucleophile-triggered generation of reactive carbonyl chloride equivalents.",
      traps: ["Can release phosgene", "Stoichiometry and base control product class"],
      safety: "Highly toxic phosgene-equivalent. Requires strict controls."
    }
  ]);

  addUnique(data.compounds, [
    {
      id: "naphthalene",
      name: "Naphthalene",
      formula: "C10H8",
      cas: "91-20-3",
      family: "Polycyclic aromatic hydrocarbon",
      synonyms: ["bicyclic aromatic hydrocarbon"],
      summary: "Fused aromatic system used in aromaticity, electrophilic substitution and environmental chemistry examples.",
      evidenceNote: "Environmental or toxicology claims should be linked to source-specific exposure context.",
      tags: ["PAH", "aromatic", "environmental"]
    },
    {
      id: "anisole",
      name: "Anisole",
      formula: "C7H8O",
      cas: "100-66-3",
      family: "Aryl ether",
      synonyms: ["methoxybenzene"],
      summary: "Electron-rich arene used for directing-effect and electrophilic aromatic substitution cases.",
      evidenceNote: "Regioselectivity claims should state electrophile, solvent and temperature.",
      tags: ["aromatic", "ether", "EAS"]
    },
    {
      id: "nitrobenzene",
      name: "Nitrobenzene",
      formula: "C6H5NO2",
      cas: "98-95-3",
      family: "Nitroarene",
      synonyms: ["nitrobenzol"],
      summary: "Electron-poor arene linking reduction chemistry, spectroscopy and directing effects.",
      evidenceNote: "Reduction claims require reagent and stopping point because nitroso, hydroxylamine and aniline states can intervene.",
      tags: ["nitro", "aromatic", "reduction"]
    },
    {
      id: "ethyl-acetate",
      name: "Ethyl acetate",
      formula: "C4H8O2",
      cas: "141-78-6",
      family: "Ester solvent",
      synonyms: ["EtOAc"],
      summary: "Common extraction and chromatography solvent with ester hydrolysis relevance.",
      evidenceNote: "Solvent purity and water content can affect extraction or reaction claims.",
      tags: ["solvent", "ester", "chromatography"]
    },
    {
      id: "triethylamine",
      name: "Triethylamine",
      formula: "C6H15N",
      cas: "121-44-8",
      family: "Tertiary amine base",
      synonyms: ["Et3N", "TEA"],
      summary: "Organic base used in acylation, sulfonylation and salt-scavenging operations.",
      evidenceNote: "Base equivalence and salt precipitation are operational variables in method transfer.",
      tags: ["base", "amine", "coupling"]
    }
  ]);
})();
