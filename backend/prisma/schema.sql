-- FoodBridge PostgreSQL Database Schema (3NF Normalized)
-- Includes primary keys, foreign keys with ON DELETE rules, check constraints, and performance indexes.

-- Enums
CREATE TYPE role_enum AS ENUM ('DONOR', 'RECIPIENT', 'VOLUNTEER', 'ADMIN');
CREATE TYPE donor_type_enum AS ENUM ('RESTAURANT', 'HOUSEHOLD', 'EVENT', 'GROCERY');
CREATE TYPE food_category_enum AS ENUM ('VEG', 'NON_VEG', 'PACKAGED', 'COOKED');
CREATE TYPE listing_status_enum AS ENUM ('AVAILABLE', 'CLAIMED', 'PICKED_UP', 'EXPIRED', 'CANCELLED');
CREATE TYPE claim_status_enum AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
CREATE TYPE pickup_status_enum AS ENUM ('ASSIGNED', 'IN_TRANSIT', 'DELIVERED');
CREATE TYPE volunteer_availability_enum AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE');
CREATE TYPE vehicle_type_enum AS ENUM ('BICYCLE', 'MOTORCYCLE', 'CAR', 'VAN', 'TRUCK');

-- 1. Users Table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role role_enum NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 2. Donors Table
CREATE TABLE donors (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    organization_name VARCHAR(255) NOT NULL,
    donor_type donor_type_enum DEFAULT 'RESTAURANT',
    verified BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_donors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_donors_user_id ON donors(user_id);

-- 3. Recipients Table (NGO / Shelter / Community Kitchen)
CREATE TABLE recipients (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    organization_name VARCHAR(255) NOT NULL,
    capacity INT DEFAULT 50 CHECK (capacity >= 0),
    verified BOOLEAN DEFAULT FALSE,
    registration_number VARCHAR(100),
    CONSTRAINT fk_recipients_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_recipients_user_id ON recipients(user_id);

-- 4. Volunteers Table
CREATE TABLE volunteers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    availability_status volunteer_availability_enum DEFAULT 'AVAILABLE',
    vehicle_type vehicle_type_enum DEFAULT 'CAR',
    CONSTRAINT fk_volunteers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_volunteers_user_id ON volunteers(user_id);

-- 5. Food Listings Table
CREATE TABLE food_listings (
    id VARCHAR(36) PRIMARY KEY,
    donor_id VARCHAR(36) NOT NULL,
    food_type VARCHAR(255) NOT NULL,
    category food_category_enum DEFAULT 'COOKED',
    quantity DOUBLE PRECISION NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    pickup_location TEXT NOT NULL,
    pickup_lat DOUBLE PRECISION NOT NULL,
    pickup_lng DOUBLE PRECISION NOT NULL,
    status listing_status_enum DEFAULT 'AVAILABLE',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_listings_donor FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE CASCADE
);

CREATE INDEX idx_listings_donor_id ON food_listings(donor_id);
CREATE INDEX idx_listings_status ON food_listings(status);
CREATE INDEX idx_listings_expiry ON food_listings(expiry_time);
CREATE INDEX idx_listings_status_expiry ON food_listings(status, expiry_time);
CREATE INDEX idx_listings_location ON food_listings(pickup_lat, pickup_lng);

-- 6. Claims Table
CREATE TABLE claims (
    id VARCHAR(36) PRIMARY KEY,
    listing_id VARCHAR(36) NOT NULL,
    recipient_id VARCHAR(36) NOT NULL,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status claim_status_enum DEFAULT 'CONFIRMED',
    CONSTRAINT fk_claims_listing FOREIGN KEY (listing_id) REFERENCES food_listings(id) ON DELETE CASCADE,
    CONSTRAINT fk_claims_recipient FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE
);

CREATE INDEX idx_claims_listing ON claims(listing_id);
CREATE INDEX idx_claims_recipient ON claims(recipient_id);
CREATE INDEX idx_claims_status ON claims(status);

-- 7. Pickups Table
CREATE TABLE pickups (
    id VARCHAR(36) PRIMARY KEY,
    claim_id VARCHAR(36) UNIQUE NOT NULL,
    volunteer_id VARCHAR(36),
    pickup_time TIMESTAMP WITH TIME ZONE,
    delivery_time TIMESTAMP WITH TIME ZONE,
    status pickup_status_enum DEFAULT 'ASSIGNED',
    CONSTRAINT fk_pickups_claim FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
    CONSTRAINT fk_pickups_volunteer FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE SET NULL
);

CREATE INDEX idx_pickups_claim ON pickups(claim_id);
CREATE INDEX idx_pickups_volunteer ON pickups(volunteer_id);
CREATE INDEX idx_pickups_status ON pickups(status);

-- 8. Feedback Table
CREATE TABLE feedback (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    related_claim_id VARCHAR(36) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_feedback_claim FOREIGN KEY (related_claim_id) REFERENCES claims(id) ON DELETE CASCADE
);

CREATE INDEX idx_feedback_user ON feedback(user_id);
CREATE INDEX idx_feedback_claim ON feedback(related_claim_id);

-- 9. Notifications Table
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

-- 10. Admin Logs Table
CREATE TABLE admin_logs (
    id VARCHAR(36) PRIMARY KEY,
    admin_id VARCHAR(36) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_table VARCHAR(100) NOT NULL,
    target_id VARCHAR(36) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_logs_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_admin_logs_admin ON admin_logs(admin_id);
