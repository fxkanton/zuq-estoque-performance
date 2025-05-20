
-- This SQL script adds an acquisition_date column to the readers table
-- Run this in the Supabase SQL Editor

ALTER TABLE readers 
ADD COLUMN acquisition_date DATE;
