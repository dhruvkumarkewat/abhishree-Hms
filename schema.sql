-- Phase 1: New Tables for Feature Enhancements
-- Execute this in your Supabase SQL Editor

-- 1. Staff Profiles Extension (if staff table doesn't already have these)
CREATE TABLE IF NOT EXISTS public.staff_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100),
    designation VARCHAR(100),
    shift VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Attendance Logs
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    staff_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    punch_in TIMESTAMP WITH TIME ZONE,
    punch_out TIMESTAMP WITH TIME ZONE,
    department VARCHAR(100),
    shift VARCHAR(50),
    late_status BOOLEAN DEFAULT FALSE,
    early_exit BOOLEAN DEFAULT FALSE,
    working_hours DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, date) -- Prevent duplicate punch-ins per day
);

-- 3. Approvals
CREATE TABLE IF NOT EXISTS public.approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL, -- e.g., 'Discount', 'Refund', 'Stock Adjustment'
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    requested_by VARCHAR(255) NOT NULL,
    approved_by VARCHAR(255),
    reason TEXT,
    reference_id UUID, -- ID of the invoice, stock, etc.
    amount DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Global Search View (Optional, for full-text search)
-- Not strictly necessary as we can search tables individually from frontend

-- 5. Extend bed management (If beds table exists, add new status types)
-- Assuming 'beds' table exists with a 'status' column.
-- ALTER TABLE beds DROP CONSTRAINT beds_status_check; 
-- ALTER TABLE beds ADD CONSTRAINT beds_status_check CHECK (status IN ('Available', 'Occupied', 'Reserved', 'Cleaning', 'Maintenance', 'Blocked'));
