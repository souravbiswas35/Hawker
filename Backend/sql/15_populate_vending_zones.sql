-- Ensure vending_zones table exists and has data
USE hawker;

-- Create table if not exists
CREATE TABLE IF NOT EXISTS vending_zones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    zone_code VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    location VARCHAR(300) NOT NULL,
    area VARCHAR(100) NOT NULL,
    total_spots INT NOT NULL DEFAULT 50,
    available_spots INT NOT NULL DEFAULT 50,
    has_electricity TINYINT(1) NOT NULL DEFAULT 0,
    has_water TINYINT(1) NOT NULL DEFAULT 0,
    has_shade TINYINT(1) NOT NULL DEFAULT 0,
    zone_type ENUM('commercial', 'residential', 'mixed', 'transport') NOT NULL,
    traffic_level ENUM('low', 'medium', 'high') NOT NULL,
    latitude DECIMAL(10,8) NULL,
    longitude DECIMAL(11,8) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_vending_zones_code (zone_code),
    KEY idx_vending_zones_active (is_active),
    KEY idx_vending_zones_area (area)
) ENGINE = InnoDB;

-- Insert demo zones if they don't exist
INSERT IGNORE INTO vending_zones (zone_code, name, location, area, total_spots, available_spots, has_electricity, has_water, has_shade, zone_type, traffic_level, latitude, longitude) VALUES
('MR10', 'Mirpur 10', 'Mirpur 10 Circle', 'Mirpur', 50, 38, 1, 1, 1, 'commercial', 'high', 23.8123, 90.3639),
('JC6', 'Old Dhaka Court', 'CMC Judge Court', 'Old Dhaka', 60, 3, 1, 1, 1, 'commercial', 'medium', 23.7104, 90.4074),
('MMP30', 'Mohammadpur', 'Mohammadpur Bus Stand', 'Mohammadpur', 40, 11, 1, 1, 0, 'transport', 'high', 23.7661, 90.3582),
('DG15', 'Dhanmondi 15', 'Dhanmondi Lake Area', 'Dhanmondi', 45, 25, 1, 1, 1, 'residential', 'medium', 23.7465, 90.3770),
('UT20', 'Uttara 20', 'Uttara Sector 20', 'Uttara', 55, 42, 1, 1, 1, 'commercial', 'high', 23.8735, 90.4025),
('BK12', 'Banani 12', 'Banani Road 12', 'Banani', 35, 18, 1, 1, 1, 'commercial', 'high', 23.7925, 90.4035),
('GB8', 'Gulshan 8', 'Gulshan Avenue', 'Gulshan', 40, 22, 1, 1, 1, 'commercial', 'high', 23.7825, 90.4135),
('TK5', 'Tejgaon 5', 'Tejgaon Industrial Area', 'Tejgaon', 50, 35, 1, 1, 0, 'mixed', 'high', 23.7565, 90.3895),
('MG7', 'Motijheel 7', 'Motijheel Commercial Area', 'Motijheel', 60, 45, 1, 1, 1, 'commercial', 'high', 23.7325, 90.4165),
('SB3', 'Shahbagh 3', 'Shahbagh Circle', 'Shahbagh', 45, 30, 1, 1, 1, 'mixed', 'high', 23.7385, 90.3985);

-- Verify the data
SELECT COUNT(*) as total_zones FROM vending_zones WHERE is_active = 1;
SELECT zone_code, name, location, area, available_spots FROM vending_zones WHERE is_active = 1 ORDER BY name;
