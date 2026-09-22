export type Role = 'Admin' | 'Doctor' | 'Nurse' | 'Receptionist' | 'Pharmacist' | 'Lab Technician' | 'Accountant' | 'Patient';

export const ROLES: Role[] = ['Admin', 'Doctor', 'Nurse', 'Receptionist', 'Pharmacist', 'Lab Technician', 'Accountant', 'Patient'];

export interface DemoUser {
  name: string;
  email: string;
  role: Role;
  password?: string;
  link?: { doctorId?: number; patientId?: number; staffName?: string };
}

/**
 * Known default staff accounts for AbhiShree Hospital.
 * Role mappings and profiles are verified via Supabase Authentication.
 */
export const DEMO_USERS: DemoUser[] = [
  { name: 'Aarav Sharma', email: 'admin@abhishree.hospital', role: 'Admin' },
  { name: 'Dr. Meera Nair', email: 'doctor@abhishree.hospital', role: 'Doctor', link: { doctorId: 1 } },
  { name: 'Sister Lakshmi Rao', email: 'nurse@abhishree.hospital', role: 'Nurse' },
  { name: 'Rohan Verma', email: 'reception@abhishree.hospital', role: 'Receptionist' },
  { name: 'Kavya Iyer', email: 'pharmacy@abhishree.hospital', role: 'Pharmacist' },
  { name: 'Arjun Patel', email: 'lab@abhishree.hospital', role: 'Lab Technician' },
  { name: 'Neha Gupta', email: 'accounts@abhishree.hospital', role: 'Accountant' },
  { name: 'Vikram Malhotra', email: 'patient@abhishree.hospital', role: 'Patient', link: { patientId: 3 } },
];

export const ROLE_TAGLINES: Record<Role, string> = {
  Admin: 'Hospital operations & oversight',
  Doctor: 'Consultations & clinical care',
  Nurse: 'Wards, vitals & patient monitoring',
  Receptionist: 'Front desk & patient flow',
  Pharmacist: 'Prescriptions & dispensary',
  'Lab Technician': 'Tests, samples & reports',
  Accountant: 'Billing, payments & claims',
  Patient: 'My health & appointments',
};

export function userForEmail(email: string): DemoUser | null {
  const e = email.trim().toLowerCase();
  return DEMO_USERS.find((u) => u.email.toLowerCase() === e) || null;
}

export interface SessionUser {
  name: string;
  email: string;
  role: Role;
  link?: { doctorId?: number; patientId?: number };
}

export function sessionFromDemo(d: DemoUser): SessionUser {
  return { name: d.name, email: d.email, role: d.role, link: d.link ? { doctorId: d.link.doctorId, patientId: d.link.patientId } : undefined };
}
