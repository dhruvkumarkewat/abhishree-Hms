export const MEDICINE_CATEGORIES = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Ointment',
  'Drops',
  'Cream',
  'Gel',
  'Lotion',
  'Powder',
  'Solution',
  'Suspension',
  'Emulsion',
  'Spray',
  'Inhaler',
  'Nebulizer Solution',
  'Eye Drops',
  'Eye Ointment',
  'Ear Drops',
  'Nasal Drops',
  'Nasal Spray',
  'Suppository',
  'Pessary / Vaginal Tablet',
  'Patch / Transdermal Patch',
  'Mouthwash / Gargle',
  'Lozenges',
  'Granules',
  'Oral Jelly',
  'IV Infusion / IV Fluid',
] as const;

export type MedicineCategory = (typeof MEDICINE_CATEGORIES)[number];

export interface MedicineCategoryGroup {
  group: string;
  items: string[];
}

export const MEDICINE_CATEGORY_GROUPS: MedicineCategoryGroup[] = [
  {
    group: 'Oral Solid & Semi-Solid',
    items: ['Tablet', 'Capsule', 'Powder', 'Granules', 'Lozenges', 'Oral Jelly'],
  },
  {
    group: 'Oral Liquid',
    items: ['Syrup', 'Solution', 'Suspension', 'Emulsion'],
  },
  {
    group: 'Injections & Infusions',
    items: ['Injection', 'IV Infusion / IV Fluid'],
  },
  {
    group: 'Topical & External',
    items: ['Ointment', 'Cream', 'Gel', 'Lotion', 'Patch / Transdermal Patch'],
  },
  {
    group: 'Respiratory & Inhalation',
    items: ['Inhaler', 'Nebulizer Solution', 'Spray'],
  },
  {
    group: 'Ophthalmic, Otic & Nasal',
    items: ['Eye Drops', 'Eye Ointment', 'Ear Drops', 'Nasal Drops', 'Nasal Spray', 'Drops'],
  },
  {
    group: 'Rectal & Vaginal',
    items: ['Suppository', 'Pessary / Vaginal Tablet'],
  },
  {
    group: 'Oral Cavity & Gargles',
    items: ['Mouthwash / Gargle'],
  },
];

export const MEDICINE_BADGE_COLORS: Record<string, string> = {
  Tablet: 'b-blue',
  Capsule: 'b-purple',
  Syrup: 'b-amber',
  Injection: 'b-red',
  Ointment: 'b-teal',
  Drops: 'b-teal',
  Cream: 'b-teal',
  Gel: 'b-teal',
  Lotion: 'b-slate',
  Powder: 'b-slate',
  Solution: 'b-blue',
  Suspension: 'b-amber',
  Emulsion: 'b-amber',
  Spray: 'b-purple',
  Inhaler: 'b-teal',
  'Nebulizer Solution': 'b-teal',
  'Eye Drops': 'b-blue',
  'Eye Ointment': 'b-teal',
  'Ear Drops': 'b-amber',
  'Nasal Drops': 'b-blue',
  'Nasal Spray': 'b-purple',
  Suppository: 'b-purple',
  'Pessary / Vaginal Tablet': 'b-purple',
  'Patch / Transdermal Patch': 'b-slate',
  'Mouthwash / Gargle': 'b-teal',
  Lozenges: 'b-amber',
  Granules: 'b-slate',
  'Oral Jelly': 'b-amber',
  'IV Infusion / IV Fluid': 'b-red',
};
