-- AsphaltTracker Enterprise Logistics Platform
-- Database initialization script

-- Create database if not exists (handled by Docker environment)
-- CREATE DATABASE IF NOT EXISTS asphalt_tracker;

-- Use the database
\c asphalt_tracker;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis" CASCADE;
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS logistics;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS monitoring;

-- Set search path
SET search_path TO public, logistics, analytics, monitoring;

-- Create basic tables for enterprise logistics

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id VARCHAR(50) UNIQUE NOT NULL,
    vehicle_number VARCHAR(100) NOT NULL,
    vin VARCHAR(17),
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    vehicle_type VARCHAR(50),
    max_weight DECIMAL(10,2),
    max_volume DECIMAL(10,2),
    fuel_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    current_location POINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id VARCHAR(50) UNIQUE NOT NULL,
    employee_id VARCHAR(50),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    license_number VARCHAR(100),
    cdl_class VARCHAR(10),
    employment_status VARCHAR(50) DEFAULT 'ACTIVE',
    hire_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipments table
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id VARCHAR(50) UNIQUE NOT NULL,
    shipment_number VARCHAR(100) NOT NULL,
    customer_id UUID REFERENCES customers(id),
    status VARCHAR(50) DEFAULT 'PLANNED',
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    origin JSONB NOT NULL,
    destination JSONB NOT NULL,
    planned_pickup_time TIMESTAMP WITH TIME ZONE,
    actual_pickup_time TIMESTAMP WITH TIME ZONE,
    planned_delivery_time TIMESTAMP WITH TIME ZONE,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    assigned_vehicle_id UUID REFERENCES vehicles(id),
    assigned_driver_id UUID REFERENCES drivers(id),
    total_distance DECIMAL(10,2),
    total_weight DECIMAL(10,2),
    cargo JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracking events table
CREATE TABLE IF NOT EXISTS tracking_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(50) UNIQUE NOT NULL,
    shipment_id UUID REFERENCES shipments(id),
    event_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    location POINT,
    description TEXT,
    source VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Geofences table
CREATE TABLE IF NOT EXISTS geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    geofence_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    coordinates JSONB NOT NULL,
    radius DECIMAL(10,2),
    purpose VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    rules JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'vehicle', 'driver', 'shipment', 'fleet'
    entity_id VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4),
    unit VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_customer ON shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_pickup_time ON shipments(planned_pickup_time);
CREATE INDEX IF NOT EXISTS idx_shipments_delivery_time ON shipments(planned_delivery_time);
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment ON tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_timestamp ON tracking_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(employment_status);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_entity ON performance_metrics(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);

-- Create spatial indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles USING GIST(current_location);
CREATE INDEX IF NOT EXISTS idx_tracking_events_location ON tracking_events USING GIST(location);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_geofences_updated_at BEFORE UPDATE ON geofences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO customers (customer_id, name, email, phone, address) VALUES
('CUST-001', 'ABC Construction', 'contact@abc-construction.com', '+1-555-0101', '{"street": "123 Industrial Blvd", "city": "Houston", "state": "TX", "zipCode": "77001"}'),
('CUST-002', 'XYZ Infrastructure', 'info@xyz-infra.com', '+1-555-0102', '{"street": "456 Business Ave", "city": "Dallas", "state": "TX", "zipCode": "75201"}'),
('CUST-003', 'BuildRight LLC', 'orders@buildright.com', '+1-555-0103', '{"street": "789 Commerce St", "city": "Austin", "state": "TX", "zipCode": "73301"}')
ON CONFLICT (customer_id) DO NOTHING;

INSERT INTO vehicles (vehicle_id, vehicle_number, make, model, year, vehicle_type, max_weight, max_volume, fuel_type) VALUES
('VEH-001', 'AT-TRUCK-001', 'Peterbilt', '579', 2022, 'TRUCK', 80000.00, 4000.00, 'DIESEL'),
('VEH-002', 'AT-TRUCK-002', 'Kenworth', 'T680', 2023, 'TRUCK', 80000.00, 4000.00, 'DIESEL'),
('VEH-003', 'AT-VAN-001', 'Ford', 'Transit', 2023, 'VAN', 10000.00, 500.00, 'GASOLINE')
ON CONFLICT (vehicle_id) DO NOTHING;

INSERT INTO drivers (driver_id, employee_id, first_name, last_name, email, phone, license_number, cdl_class, hire_date) VALUES
('DRV-001', 'EMP-001', 'John', 'Smith', 'john.smith@asphalttracker.com', '+1-555-1001', 'TX123456789', 'A', '2023-01-15'),
('DRV-002', 'EMP-002', 'Sarah', 'Johnson', 'sarah.johnson@asphalttracker.com', '+1-555-1002', 'TX987654321', 'A', '2023-02-20'),
('DRV-003', 'EMP-003', 'Mike', 'Davis', 'mike.davis@asphalttracker.com', '+1-555-1003', 'TX456789123', 'B', '2023-03-10')
ON CONFLICT (driver_id) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Create application user (optional)
-- CREATE USER asphalt_app WITH PASSWORD 'app_password_2024';
-- GRANT CONNECT ON DATABASE asphalt_tracker TO asphalt_app;
-- GRANT USAGE ON SCHEMA public TO asphalt_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO asphalt_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO asphalt_app;

COMMIT;
