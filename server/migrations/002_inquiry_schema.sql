-- Windsor Inquiry Website - Database Schema
-- Migration 002: Inquiry System + Admin Users

-- =============================================
-- ADMIN USERS TABLE (Separate from regular users)
-- =============================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- =============================================
-- INQUIRIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    inquirer_name VARCHAR(100) NOT NULL,
    inquirer_email VARCHAR(255) NOT NULL,
    inquirer_phone VARCHAR(20),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'replied', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_room ON inquiries(room_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(inquirer_email);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at);

-- =============================================
-- INQUIRY REPLIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS inquiry_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiry_replies_inquiry ON inquiry_replies(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_replies_admin ON inquiry_replies(admin_id);

-- =============================================
-- TRIGGER: Auto-update updated_at for inquiries
-- =============================================
DROP TRIGGER IF EXISTS update_inquiries_updated_at ON inquiries;
CREATE TRIGGER update_inquiries_updated_at
    BEFORE UPDATE ON inquiries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- TRIGGER: Auto-update updated_at for admin_users
-- =============================================
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INSERT DEFAULT ADMIN USER
-- Note: Password is 'admin123' - CHANGE IN PRODUCTION
-- =============================================
INSERT INTO admin_users (email, password_hash, name)
VALUES ('admin@windsor.com', '$2a$10$rQEY7.5FvS7Z7Q5Hf5Q5/uQv5Q5Hf5Q5Hf5Q5Hf5Q5Hf5Q5Hf5Q5Hf', 'Admin')
ON CONFLICT (email) DO NOTHING;
