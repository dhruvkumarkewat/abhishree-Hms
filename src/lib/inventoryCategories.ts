export interface InventoryCategory {
  id?: number | string;
  name: string;
  description?: string;
  item_count?: number;
  created_at?: string;
}

export const INITIAL_INVENTORY_CATEGORIES: InventoryCategory[] = [
  { id: 1, name: 'Medicines', description: 'Pharmaceutical drugs, tablets, syrups, antibiotics and formulations' },
  { id: 2, name: 'Surgical', description: 'Surgical instruments, sutures, scalpels, and operation theatre supplies' },
  { id: 3, name: 'Consumables', description: 'Cotton, gauze, syringes, bandages, disposable medical supplies' },
  { id: 4, name: 'Equipment', description: 'Biomedical devices, monitors, infusion pumps, diagnostic machines' },
  { id: 5, name: 'General', description: 'Hospital-wide general utilities and housekeeping provisions' },
  { id: 6, name: 'Laboratory / Lab Supplies', description: 'Diagnostic reagents, test tubes, specimen containers, slides' },
  { id: 7, name: 'PPE & Safety', description: 'Gloves, masks, gowns, face shields' },
  { id: 8, name: 'Disinfectants & Cleaning', description: 'Hospital disinfectants, hand sanitizers, sterilization solutions' },
  { id: 9, name: 'IV Fluids & Infusion', description: 'Saline, dextrose, ringer lactate, IV sets, cannulas' },
  { id: 10, name: 'Implants & Prosthetics', description: 'Orthopedic implants, stents, pacemakers' },
  { id: 11, name: 'Medical Gases', description: 'Oxygen cylinders, nitrous oxide, manifolds' },
  { id: 12, name: 'Blood Bank / Blood Products', description: 'Blood bags, plasma, testing kits' },
  { id: 13, name: 'Dental Supplies', description: 'Dental instruments, filling materials, tips' },
  { id: 14, name: 'Radiology / Imaging Supplies', description: 'X-ray/CT/MRI related consumables' },
  { id: 15, name: 'Office / Administrative Supplies', description: 'Stationery, registers, printer cartridges' },
];

export const CATEGORY_COLOR_MAP: Record<string, string> = {
  Medicines: 'b-blue',
  Surgical: 'b-red',
  Consumables: 'b-teal',
  Equipment: 'b-purple',
  General: 'b-slate',
  'Laboratory / Lab Supplies': 'b-amber',
  'PPE & Safety': 'b-teal',
  'Disinfectants & Cleaning': 'b-teal',
  'IV Fluids & Infusion': 'b-blue',
  'Implants & Prosthetics': 'b-purple',
  'Medical Gases': 'b-amber',
  'Blood Bank / Blood Products': 'b-red',
  'Dental Supplies': 'b-teal',
  'Radiology / Imaging Supplies': 'b-purple',
  'Office / Administrative Supplies': 'b-slate',
};
