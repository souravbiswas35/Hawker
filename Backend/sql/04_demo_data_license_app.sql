-- Demo Data for Enhanced License Application System
-- Run this after the schema updates

USE hawker;

-- Insert license types
INSERT INTO license_types (name, duration_days, base_price, security_deposit, processing_fee) VALUES
('Daily', 1, 100.00, 50.00, 100.00),
('Weekly', 7, 500.00, 100.00, 100.00),
('Monthly', 30, 3000.00, 500.00, 100.00),
('6 Month', 180, 15000.00, 1000.00, 100.00),
('Annually', 365, 30000.00, 2000.00, 100.00);

-- Insert vending zones
INSERT INTO vending_zones (zone_code, name, location, area, total_spots, available_spots, has_electricity, has_water, has_shade, zone_type, traffic_level, latitude, longitude) VALUES
('MR10', 'Mirpur 10', 'Mirpur 10 Circle', 'Mirpur', 50, 38, 1, 1, 1, 'commercial', 'high', 23.8123, 90.3639),
('JC6', 'Old Dhaka Court', 'CMC Judge Court', 'Old Dhaka', 60, 3, 1, 1, 1, 'commercial', 'medium', 23.7104, 90.4074),
('MMP30', 'Mohammadpur', 'Mohammadpur Bus Stand', 'Mohammadpur', 40, 11, 1, 1, 0, 'transport', 'high', 23.7661, 90.3582),
('JTB03', 'Jatrabari Area', 'Jatrabari Flyover Bridge', 'Jatrabari', 30, 8, 1, 0, 1, 'transport', 'medium', 23.6886, 90.4265),
('DGK12', 'Dhanmondi Garden', 'Dhanmondi Residential Area', 'Dhanmondi', 25, 15, 0, 1, 1, 'residential', 'low', 23.7465, 90.3760),
('BNS15', 'Banani Supermarket', 'Banani Commercial Area', 'Banani', 35, 22, 1, 1, 1, 'commercial', 'high', 23.7906, 90.4036),
('UTS08', 'Uttara Town Square', 'Uttara Sector 7', 'Uttara', 45, 30, 1, 1, 1, 'mixed', 'medium', 23.8727, 90.4013),
('KRG20', 'Kuril Bishwa Road', 'Kuril Interchange', 'Kuril', 40, 25, 1, 0, 1, 'transport', 'high', 23.8225, 90.4249);
