export type FashionOption = {
  label: string
  value: string
}

export type FashionQuestion = {
  id: string
  question: string
  options?: FashionOption[]
  allowText?: boolean
}

export type FashionSubtype = {
  label: string
  value: string
  questions: FashionQuestion[]
}

export type FashionMainType = {
  label: string
  value: string
  subtypes: FashionSubtype[]
}

/* =========================================================
   HELPERS
========================================================= */

const opts = (...values: string[]): FashionOption[] =>
  values.map((value) => ({ label: value, value }))

const ask = (
  id: string,
  question: string,
  options: FashionOption[],
): FashionQuestion => ({ id, question, options })

const askText = (id: string, question: string): FashionQuestion => ({
  id,
  question,
  allowText: true,
})

const subtype = (
  label: string,
  questions: FashionQuestion[],
): FashionSubtype => ({ label, value: label, questions })

/* =========================================================
   SHARED OPTIONS
========================================================= */

const OCCASIONS = opts('Wedding', 'Reception', 'Engagement', 'Party', 'Festival', 'Casual', 'Other')
const FESTIVE_OCCASIONS = opts('Wedding', 'Reception', 'Engagement', 'Party', 'Festival', 'Other')
const DAILY_OCCASIONS = opts('Casual', 'Office', 'Festival', 'Function', 'Other')

const COLOURS = opts(
  'Red', 'Maroon', 'Pink', 'Blue', 'Green', 'Black',
  'White', 'Gold', 'Yellow', 'Purple', 'Any Colour',
)

const NECK = opts('Round Neck', 'V Neck', 'Boat Neck', 'Square Neck', 'Sweetheart Neck', 'High Neck')
const SLEEVE = opts('Sleeveless', 'Short Sleeve', 'Half Sleeve', 'Three Quarter Sleeve', 'Full Sleeve')
const BACK = opts('Round Back', 'Deep U Back', 'Deep V Back', 'Keyhole Back', 'Tie-up (Dori) Back', 'Closed Back')

const WORK_GENERAL = opts('Simple', 'Embroidery', 'Aari Work', 'Stone Work', 'Sequins', 'Designer Work')
const WORK_BRIDAL = opts('Aari Work', 'Zardosi', 'Stone Work', 'Embroidery', 'Sequins', 'Designer Work')
const WORK_WESTERN = opts('Simple', 'Sequins', 'Stone Work', 'Embroidery')

const EMBROIDERY_TYPE = opts('Thread Embroidery', 'Zari Embroidery', 'Sequin Embroidery', 'Mirror Work', 'Resham')
const AARI_DESIGN = opts('Floral', 'Peacock', 'Temple Design', 'Bridal Motif', 'Traditional', 'Custom')
const DENSITY = opts('Light Work', 'Medium Work', 'Heavy Work')
const BRIDAL_DENSITY = opts('Medium Work', 'Heavy Work', 'Extra Heavy Work')

const GOWN_NECK = opts('Round Neck', 'V Neck', 'Square Neck', 'Sweetheart', 'Boat Neck', 'High Neck', 'Off Shoulder')
const GOWN_SLEEVE = opts('Sleeveless', 'Short Sleeve', 'Half Sleeve', 'Full Sleeve', 'Off Shoulder', 'One Shoulder')
const DRESS_LENGTH = opts('Mini', 'Midi', 'Maxi', 'Floor Length')

/* =========================================================
   BLOUSE
========================================================= */

// Occasion is already implied by the subtype (Bridal, Wedding, Reception, Party)
const eventBlouseQuestions: FashionQuestion[] = [
  ask('neck_design', 'What neck design would you prefer?', NECK),
  ask('back_design', 'What back design would you prefer?', BACK),
  ask('sleeve_design', 'What sleeve design would you prefer?', SLEEVE),
  ask('work', 'What type of work would you prefer?', WORK_BRIDAL),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

const designerBlouseQuestions: FashionQuestion[] = [
  ask('occasion', 'What is the occasion for the blouse?', FESTIVE_OCCASIONS),
  ask('neck_design', 'What neck design would you prefer?', NECK),
  ask('back_design', 'What back design would you prefer?', BACK),
  ask('sleeve_design', 'What sleeve design would you prefer?', SLEEVE),
  ask('work', 'What type of designer work would you prefer?', WORK_GENERAL),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

const simpleBlouseQuestions: FashionQuestion[] = [
  ask('occasion', 'What is the occasion for the blouse?', DAILY_OCCASIONS),
  ask('neck_design', 'What neck design would you prefer?', NECK),
  ask('back_design', 'What back design would you prefer?', BACK),
  ask('sleeve_design', 'What sleeve design would you prefer?', SLEEVE),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

const aariBlouseQuestions: FashionQuestion[] = [
  ask('occasion', 'What is the occasion for the blouse?', FESTIVE_OCCASIONS),
  ask('aari_design', 'What type of Aari design would you prefer?', AARI_DESIGN),
  ask('work_density', 'What level of Aari work would you prefer?', DENSITY),
  ask('neck_design', 'What neck design would you prefer?', NECK),
  ask('back_design', 'What back design would you prefer?', BACK),
  ask('sleeve_design', 'What sleeve design would you prefer?', SLEEVE),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

const embroideryBlouseQuestions: FashionQuestion[] = [
  ask('occasion', 'What is the occasion for the blouse?', FESTIVE_OCCASIONS),
  ask('embroidery_type', 'What type of embroidery would you prefer?', EMBROIDERY_TYPE),
  ask('work_density', 'What level of embroidery would you prefer?', DENSITY),
  ask('neck_design', 'What neck design would you prefer?', NECK),
  ask('back_design', 'What back design would you prefer?', BACK),
  ask('sleeve_design', 'What sleeve design would you prefer?', SLEEVE),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

const stoneWorkBlouseQuestions: FashionQuestion[] = [
  ask('occasion', 'What is the occasion for the blouse?', FESTIVE_OCCASIONS),
  ask('work_density', 'How much stone work would you prefer?', DENSITY),
  ask('neck_design', 'What neck design would you prefer?', NECK),
  ask('back_design', 'What back design would you prefer?', BACK),
  ask('sleeve_design', 'What sleeve design would you prefer?', SLEEVE),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

/* =========================================================
   DRESS
========================================================= */

const gownQuestions: FashionQuestion[] = [
  ask('occasion', 'What is the occasion for the gown?', FESTIVE_OCCASIONS),
  ask(
    'gown_style',
    'What gown style would you prefer?',
    opts('A-Line', 'Ball Gown', 'Mermaid', 'Fit & Flare', 'Anarkali Gown', 'Other'),
  ),
  ask('neck_design', 'What neckline would you prefer?', GOWN_NECK),
  ask('sleeve_design', 'What sleeve style would you prefer?', GOWN_SLEEVE),
  ask('work', 'What type of work would you prefer?', WORK_GENERAL),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

const westernDressQuestions: FashionQuestion[] = [
  ask('occasion', 'What is the occasion for the dress?', OCCASIONS),
  ask(
    'dress_style',
    'What style of western dress would you prefer?',
    opts('Bodycon', 'A-Line', 'Skater / Flared', 'Wrap Dress', 'Shift Dress', 'Other'),
  ),
  ask('length', 'What dress length would you prefer?', DRESS_LENGTH),
  ask('neck_design', 'What neckline would you prefer?', GOWN_NECK),
  ask('work', 'What type of design would you prefer?', WORK_WESTERN),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

const anarkaliQuestions: FashionQuestion[] = [
  ask('occasion', 'What is the occasion for the Anarkali?', FESTIVE_OCCASIONS),
  ask('flare', 'What type of flare would you prefer?', opts('Simple Flare', 'Medium Flare', 'Heavy Flare', 'Layered Flare')),
  ask('neck_design', 'What neck design would you prefer?', NECK),
  ask('sleeve_design', 'What sleeve design would you prefer?', SLEEVE),
  ask('work', 'What type of work would you prefer?', WORK_GENERAL),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

const maxiDressQuestions: FashionQuestion[] = [
  ask('occasion', 'What is the occasion for the maxi dress?', OCCASIONS),
  ask('style', 'What maxi dress style would you prefer?', opts('Simple', 'Flared', 'A-Line', 'Layered')),
  ask('neck_design', 'What neckline would you prefer?', NECK),
  ask('sleeve_design', 'What sleeve design would you prefer?', SLEEVE),
  ask('work', 'What type of work would you prefer?', WORK_GENERAL),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

const midiDressQuestions: FashionQuestion[] = [
  ask('occasion', 'What is the occasion for the midi dress?', OCCASIONS),
  ask('style', 'What midi dress style would you prefer?', opts('A-Line', 'Bodycon', 'Flared', 'Wrap Dress', 'Shirt Dress')),
  ask('sleeve_design', 'What sleeve design would you prefer?', SLEEVE),
  ask('work', 'What type of work would you prefer?', WORK_WESTERN),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

const partyDressQuestions: FashionQuestion[] = [
  ask('occasion', 'What type of party is the dress for?', opts('Birthday', 'Reception', 'Engagement', 'Cocktail Party', 'Other')),
  ask('style', 'What party dress style would you prefer?', opts('Elegant', 'Modern', 'Designer', 'Traditional')),
  ask('length', 'What dress length would you prefer?', DRESS_LENGTH),
  ask('work', 'What type of work would you prefer?', WORK_GENERAL),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

const casualDressQuestions: FashionQuestion[] = [
  ask('style', 'What casual dress style would you prefer?', opts('Simple', 'A-Line', 'Flared', 'Comfort Fit')),
  ask('length', 'What dress length would you prefer?', opts('Knee Length', 'Midi', 'Maxi')),
  ask('sleeve_design', 'What sleeve design would you prefer?', SLEEVE),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

const designerDressQuestions: FashionQuestion[] = [
  ask('occasion', 'What is the occasion for the designer dress?', OCCASIONS),
  ask('style', 'What designer style would you prefer?', opts('Modern', 'Traditional', 'Fusion', 'Luxury')),
  ask('length', 'What dress length would you prefer?', DRESS_LENGTH),
  ask('work', 'What type of work would you prefer?', WORK_GENERAL),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

/* =========================================================
   LEHENGA
========================================================= */

const LEHENGA_STYLE = opts('Flared', 'A-Line', 'Mermaid', 'Layered')
const DUPATTA = opts('Single Dupatta', 'Double Dupatta', 'Cape Style', 'No Dupatta')

// Occasion is already implied by the subtype (Bridal, Wedding, Reception, Engagement, Party)
const eventLehengaQuestions: FashionQuestion[] = [
  ask('lehenga_style', 'What lehenga style would you prefer?', LEHENGA_STYLE),
  ask('blouse_neck', 'What blouse neck design would you prefer?', NECK),
  ask('blouse_back', 'What blouse back design would you prefer?', BACK),
  ask('blouse_sleeve', 'What blouse sleeve design would you prefer?', SLEEVE),
  ask('dupatta', 'What dupatta style would you prefer?', DUPATTA),
  ask('work', 'What type of work would you prefer?', WORK_BRIDAL),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

const designerLehengaQuestions: FashionQuestion[] = [
  ask('occasion', 'What is the occasion for the lehenga?', FESTIVE_OCCASIONS),
  ...eventLehengaQuestions,
]

const aariLehengaQuestions: FashionQuestion[] = [
  ask('occasion', 'What is the occasion for the lehenga?', FESTIVE_OCCASIONS),
  ask('aari_design', 'What type of Aari design would you prefer?', AARI_DESIGN),
  ask('work_area', 'Where would you like the Aari work?', opts('Blouse', 'Lehenga', 'Dupatta', 'Full Set')),
  ask('work_density', 'What level of Aari work would you prefer?', DENSITY),
  ask('blouse_neck', 'What blouse neck design would you prefer?', NECK),
  ask('blouse_back', 'What blouse back design would you prefer?', BACK),
  ask('blouse_sleeve', 'What blouse sleeve design would you prefer?', SLEEVE),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

const embroideryLehengaQuestions: FashionQuestion[] = [
  ask('occasion', 'What is the occasion for the lehenga?', FESTIVE_OCCASIONS),
  ask('embroidery_type', 'What type of embroidery would you prefer?', EMBROIDERY_TYPE),
  ask('work_density', 'What level of embroidery would you prefer?', DENSITY),
  ask('blouse_neck', 'What blouse neck design would you prefer?', NECK),
  ask('blouse_back', 'What blouse back design would you prefer?', BACK),
  ask('blouse_sleeve', 'What blouse sleeve design would you prefer?', SLEEVE),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

/* =========================================================
   SAREE
========================================================= */

const SAREE_FABRIC = opts('Silk', 'Soft Silk', 'Georgette', 'Net', 'Organza', 'Cotton Silk')
const SAREE_WORK_AREA = opts('Border', 'Pallu', 'All Over', 'Border & Pallu')

// Occasion is already implied by the subtype (Bridal, Wedding, Reception, Party)
const eventSareeQuestions: FashionQuestion[] = [
  ask('fabric', 'What saree fabric would you prefer?', SAREE_FABRIC),
  ask('work', 'What type of work would you prefer?', WORK_BRIDAL),
  ask('work_area', 'Where would you like the work?', SAREE_WORK_AREA),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

const designerSareeQuestions: FashionQuestion[] = [
  ask('occasion', 'What is the occasion for the saree?', FESTIVE_OCCASIONS),
  ...eventSareeQuestions,
]

const customSareeQuestions: FashionQuestion[] = [
  ask('occasion', 'What is the occasion for the saree?', OCCASIONS),
  ask('fabric', 'What saree fabric would you prefer?', SAREE_FABRIC),
  askText('design_description', 'Please describe the saree design you have in mind.'),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

/* =========================================================
   AARI WORK
========================================================= */

const aariSareeQuestions: FashionQuestion[] = [
  ask('occasion', 'What is the occasion for the saree?', FESTIVE_OCCASIONS),
  ask('aari_design', 'What type of Aari design would you prefer?', AARI_DESIGN),
  ask('work_area', 'Where would you like the Aari work?', SAREE_WORK_AREA),
  ask('work_density', 'What level of Aari work would you prefer?', DENSITY),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

const aariDressQuestions: FashionQuestion[] = [
  ask('occasion', 'What is the occasion for the dress?', FESTIVE_OCCASIONS),
  ask('dress_style', 'What dress style would you prefer?', opts('Gown', 'Anarkali', 'Maxi', 'Designer Dress')),
  ask('aari_design', 'What type of Aari design would you prefer?', AARI_DESIGN),
  ask('work_density', 'What level of Aari work would you prefer?', DENSITY),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

const bridalAariQuestions: FashionQuestion[] = [
  ask('occasion', 'What bridal occasion is this Aari work for?', opts('Wedding', 'Reception', 'Engagement', 'Bridal Photoshoot')),
  ask('outfit_type', 'Which outfit do you need Aari work for?', opts('Blouse', 'Saree', 'Lehenga', 'Dress')),
  ask('aari_design', 'What bridal Aari design would you prefer?', AARI_DESIGN),
  ask('work_density', 'What level of bridal Aari work would you prefer?', BRIDAL_DENSITY),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

/* =========================================================
   OTHER
========================================================= */

const customOutfitQuestions: FashionQuestion[] = [
  ask('occasion', 'What is the occasion?', OCCASIONS),
  askText('design_description', 'Please describe the outfit you have in mind.'),
  ask('work', 'What type of work would you prefer?', WORK_GENERAL),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

const kidsWearQuestions: FashionQuestion[] = [
  ask('occasion', 'What is the occasion?', OCCASIONS),
  ask('age_group', "What is the child's age group?", opts('1 - 3 years', '4 - 7 years', '8 - 12 years', '13 - 16 years')),
  ask('outfit_type', 'What type of kids wear do you need?', opts('Frock', 'Lehenga', 'Gown', 'Pavadai', 'Dress')),
  ask('work', 'What type of work would you prefer?', WORK_GENERAL),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

const motherDaughterQuestions: FashionQuestion[] = [
  ask('occasion', 'What is the occasion for the matching outfits?', OCCASIONS),
  ask(
    'outfit_type',
    'What matching outfit style would you prefer?',
    opts('Lehenga', 'Gown', 'Saree & Dress', 'Anarkali', 'Western Dress'),
  ),
  ask('work', 'What type of work would you prefer?', WORK_GENERAL),
  ask('colour', 'What colour would you prefer?', COLOURS),
]

const coupleOutfitQuestions: FashionQuestion[] = [
  ask('occasion', 'What is the occasion for the couple outfits?', FESTIVE_OCCASIONS),
  ask('style', 'What couple outfit style would you prefer?', opts('Traditional', 'Modern', 'Matching', 'Colour Coordinated')),
  ask('work', 'What type of work would you prefer?', WORK_GENERAL),
  ask('colour', 'What colour theme would you prefer?', COLOURS),
]

/* =========================================================
   MAIN QUESTION FLOW
========================================================= */

export const fashionQuestionFlow: FashionMainType[] = [
  {
    label: 'Blouse',
    value: 'Blouse',
    subtypes: [
      subtype('Bridal Blouse', eventBlouseQuestions),
      subtype('Wedding Blouse', eventBlouseQuestions),
      subtype('Reception Blouse', eventBlouseQuestions),
      subtype('Party Blouse', eventBlouseQuestions),
      subtype('Designer Blouse', designerBlouseQuestions),
      subtype('Simple Blouse', simpleBlouseQuestions),
      subtype('Aari Work Blouse', aariBlouseQuestions),
      subtype('Embroidery Blouse', embroideryBlouseQuestions),
      subtype('Stone Work Blouse', stoneWorkBlouseQuestions),
    ],
  },
  {
    label: 'Dress',
    value: 'Dress',
    subtypes: [
      subtype('Gown', gownQuestions),
      subtype('Western Dress', westernDressQuestions),
      subtype('Anarkali', anarkaliQuestions),
      subtype('Maxi Dress', maxiDressQuestions),
      subtype('Midi Dress', midiDressQuestions),
      subtype('Party Dress', partyDressQuestions),
      subtype('Casual Dress', casualDressQuestions),
      subtype('Designer Dress', designerDressQuestions),
    ],
  },
  {
    label: 'Lehenga',
    value: 'Lehenga',
    subtypes: [
      subtype('Bridal Lehenga', eventLehengaQuestions),
      subtype('Wedding Lehenga', eventLehengaQuestions),
      subtype('Reception Lehenga', eventLehengaQuestions),
      subtype('Engagement Lehenga', eventLehengaQuestions),
      subtype('Party Lehenga', eventLehengaQuestions),
      subtype('Designer Lehenga', designerLehengaQuestions),
      subtype('Aari Work Lehenga', aariLehengaQuestions),
      subtype('Embroidery Lehenga', embroideryLehengaQuestions),
    ],
  },
  {
    label: 'Saree',
    value: 'Saree',
    subtypes: [
      subtype('Bridal Saree', eventSareeQuestions),
      subtype('Wedding Saree', eventSareeQuestions),
      subtype('Reception Saree', eventSareeQuestions),
      subtype('Party Saree', eventSareeQuestions),
      subtype('Designer Saree', designerSareeQuestions),
      subtype('Custom Saree', customSareeQuestions),
    ],
  },
  {
    label: 'Aari Work',
    value: 'Aari Work',
    subtypes: [
      subtype('Blouse Aari Work', aariBlouseQuestions),
      subtype('Saree Aari Work', aariSareeQuestions),
      subtype('Lehenga Aari Work', aariLehengaQuestions),
      subtype('Dress Aari Work', aariDressQuestions),
      subtype('Bridal Aari Work', bridalAariQuestions),
    ],
  },
  {
    label: 'Other',
    value: 'Other',
    subtypes: [
      subtype('Custom Outfit', customOutfitQuestions),
      subtype('Kids Wear', kidsWearQuestions),
      subtype('Mother-Daughter Outfit', motherDaughterQuestions),
      subtype('Couple Outfit', coupleOutfitQuestions),
    ],
  },
]

/* =========================================================
   LOOKUPS
========================================================= */

export function getFashionMainType(value: string): FashionMainType | undefined {
  return fashionQuestionFlow.find((item) => item.value === value)
}

export function getFashionSubtype(
  mainType: string,
  subtypeValue: string,
): FashionSubtype | undefined {
  return getFashionMainType(mainType)?.subtypes.find(
    (item) => item.value === subtypeValue,
  )
}