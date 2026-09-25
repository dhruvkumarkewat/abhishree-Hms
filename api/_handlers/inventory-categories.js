import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import supabase from './db-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'inventory_categories.json');

export const DEFAULT_INVENTORY_CATEGORIES = [
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

let inMemoryCategories = null;

function loadLocalCategories() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryCategories = parsed;
        return inMemoryCategories;
      }
    }
  } catch (err) {
    console.warn('Could not read categories from disk, using memory fallback:', err.message);
  }

  inMemoryCategories = inMemoryCategories || [...DEFAULT_INVENTORY_CATEGORIES];
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(inMemoryCategories, null, 2), 'utf-8');
  } catch { /* ignore disk write errors */ }
  return inMemoryCategories;
}

function saveLocalCategories(cats) {
  inMemoryCategories = cats;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(cats, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write categories to disk:', err.message);
  }
}

async function getInventoryItemCounts() {
  try {
    const { data, error } = await supabase.from('inventory').select('category');
    if (error || !Array.isArray(data)) return {};
    const counts = {};
    for (const item of data) {
      if (item.category) {
        counts[item.category] = (counts[item.category] || 0) + 1;
      }
    }
    return counts;
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // ----------------------------------------------------
    // GET: List all categories (with item counts)
    // ----------------------------------------------------
    if (req.method === 'GET') {
      const counts = await getInventoryItemCounts();
      let categories = [];

      try {
        const { data, error } = await supabase
          .from('inventory_categories')
          .select('*')
          .order('name', { ascending: true });

        if (!error && Array.isArray(data)) {
          if (data.length === 0) {
            // Seed defaults into supabase table
            const seedPayload = DEFAULT_INVENTORY_CATEGORIES.map(c => ({
              name: c.name,
              description: c.description
            }));
            const { data: seeded } = await supabase
              .from('inventory_categories')
              .insert(seedPayload)
              .select();
            categories = seeded || DEFAULT_INVENTORY_CATEGORIES;
          } else {
            categories = data;
          }
        } else {
          // Table doesn't exist or errored -> use local fallback
          categories = loadLocalCategories();
        }
      } catch {
        categories = loadLocalCategories();
      }

      // Attach item_count to each category
      const enriched = categories.map(cat => ({
        ...cat,
        item_count: counts[cat.name] || 0
      }));

      return res.status(200).json(enriched);
    }

    // ----------------------------------------------------
    // POST: Create a new category OR reset to defaults
    // ----------------------------------------------------
    if (req.method === 'POST') {
      const { reset, name, description } = req.body || {};

      if (reset) {
        // Reset to default categories
        try {
          const { error: delErr } = await supabase.from('inventory_categories').delete().neq('id', 0);
          if (!delErr) {
            const seedPayload = DEFAULT_INVENTORY_CATEGORIES.map(c => ({
              name: c.name,
              description: c.description
            }));
            const { data: seeded } = await supabase.from('inventory_categories').insert(seedPayload).select();
            if (seeded) {
              return res.status(200).json(seeded);
            }
          }
        } catch { /* fallback */ }

        saveLocalCategories([...DEFAULT_INVENTORY_CATEGORIES]);
        return res.status(200).json(DEFAULT_INVENTORY_CATEGORIES);
      }

      const trimmedName = (name || '').trim();
      if (!trimmedName) {
        return res.status(400).json({ error: 'Category name is required' });
      }

      // Try inserting into Supabase
      try {
        const { data, error } = await supabase
          .from('inventory_categories')
          .insert({ name: trimmedName, description: (description || '').trim() })
          .select()
          .single();

        if (!error && data) {
          return res.status(201).json(data);
        }
        if (error && error.code === '23505') {
          return res.status(400).json({ error: `Category "${trimmedName}" already exists` });
        }
      } catch { /* proceed to fallback */ }

      // Fallback local storage
      const local = loadLocalCategories();
      if (local.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
        return res.status(400).json({ error: `Category "${trimmedName}" already exists` });
      }

      const newId = local.length > 0 ? Math.max(...local.map(c => Number(c.id) || 0)) + 1 : 1;
      const newCat = {
        id: newId,
        name: trimmedName,
        description: (description || '').trim(),
        created_at: new Date().toISOString()
      };
      local.push(newCat);
      saveLocalCategories(local);
      return res.status(201).json(newCat);
    }

    // ----------------------------------------------------
    // PUT: Update category (and cascade name to inventory items)
    // ----------------------------------------------------
    if (req.method === 'PUT') {
      const { id, name, description, old_name } = req.body || {};
      const trimmedName = (name || '').trim();
      if (!trimmedName) {
        return res.status(400).json({ error: 'Category name cannot be empty' });
      }

      // If category name changed, cascade update to all items currently in inventory
      if (old_name && old_name !== trimmedName) {
        try {
          await supabase
            .from('inventory')
            .update({ category: trimmedName })
            .eq('category', old_name);
        } catch (err) {
          console.warn('Could not cascade category name change to inventory items:', err.message);
        }
      }

      // Try Supabase update
      try {
        const query = id ? supabase.from('inventory_categories').update({
          name: trimmedName,
          description: (description || '').trim()
        }).eq('id', id) : supabase.from('inventory_categories').update({
          name: trimmedName,
          description: (description || '').trim()
        }).eq('name', old_name || trimmedName);

        const { data, error } = await query.select().single();
        if (!error && data) {
          return res.status(200).json(data);
        }
      } catch { /* proceed to local fallback */ }

      // Fallback local storage update
      const local = loadLocalCategories();
      const idx = local.findIndex(c => (id && c.id == id) || (old_name && c.name === old_name) || c.name === trimmedName);
      if (idx >= 0) {
        local[idx] = {
          ...local[idx],
          name: trimmedName,
          description: (description || '').trim()
        };
        saveLocalCategories(local);
        return res.status(200).json(local[idx]);
      }

      return res.status(404).json({ error: 'Category not found' });
    }

    // ----------------------------------------------------
    // DELETE: Delete category (optional reassign to 'General')
    // ----------------------------------------------------
    if (req.method === 'DELETE') {
      const id = req.body?.id || req.query?.id;
      const name = req.body?.name || req.query?.name;
      const reassignTo = req.body?.reassignTo || req.query?.reassignTo || 'General';

      if (!id && !name) {
        return res.status(400).json({ error: 'Category id or name is required' });
      }

      // Reassign inventory items if any
      const targetCategoryName = name || (loadLocalCategories().find(c => c.id == id)?.name);
      if (targetCategoryName) {
        try {
          await supabase
            .from('inventory')
            .update({ category: reassignTo })
            .eq('category', targetCategoryName);
        } catch (err) {
          console.warn('Could not reassign items on category delete:', err.message);
        }
      }

      // Try Supabase delete
      try {
        let q = supabase.from('inventory_categories').delete();
        if (id) q = q.eq('id', id);
        else if (name) q = q.eq('name', name);
        const { error } = await q;
        if (!error) {
          return res.status(200).json({ ok: true, reassignedTo: reassignTo });
        }
      } catch { /* proceed to fallback */ }

      // Local fallback delete
      const local = loadLocalCategories();
      const updated = local.filter(c => {
        if (id && c.id == id) return false;
        if (name && c.name.toLowerCase() === name.toLowerCase()) return false;
        return true;
      });
      saveLocalCategories(updated);
      return res.status(200).json({ ok: true, reassignedTo: reassignTo });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error (inventory-categories):', err);
    res.status(500).json({ error: err.message });
  }
}
