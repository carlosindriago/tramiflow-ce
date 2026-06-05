-- 1. Update Organizations Table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- 2. Create Leads Table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    service_interest TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow public INSERT (for the capture form)
CREATE POLICY "Public can insert leads" ON leads
    FOR INSERT WITH CHECK (true);

-- Org members can view/update their own leads
CREATE POLICY "Org members can view own leads" ON leads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = leads.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Org members can update own leads" ON leads
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = leads.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

-- 3. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Enable Realtime for Notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 4. Create Procedures Table (Needed for Dashboard)
CREATE TABLE IF NOT EXISTS procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    expiration_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view procedures" ON procedures
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = procedures.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

-- 5. Triggers for Notifications

-- Function to handle Lead Notification
CREATE OR REPLACE FUNCTION notify_new_lead()
RETURNS TRIGGER AS $$
DECLARE
    owner_id UUID;
BEGIN
    -- Find the owner (first member) of the organization
    -- In a real scenario, you might want to notify all admins
    SELECT user_id INTO owner_id
    FROM organization_members
    WHERE organization_id = NEW.organization_id
    ORDER BY created_at ASC
    LIMIT 1;

    IF owner_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (
            owner_id,
            '🎯 Nuevo Lead Captado',
            NEW.name || ' quiere info sobre ' || COALESCE(NEW.service_interest, 'General'),
            'success',
            '/dashboard' -- or /leads if we had a page
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: New Lead
DROP TRIGGER IF EXISTS on_lead_created ON leads;
CREATE TRIGGER on_lead_created
    AFTER INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_lead();

-- Function to handle Document Notification
CREATE OR REPLACE FUNCTION notify_new_document()
RETURNS TRIGGER AS $$
DECLARE
    owner_id UUID;
    client_name TEXT;
BEGIN
    -- Get Client Name
    SELECT full_name INTO client_name FROM clients WHERE id = NEW.client_id;
    
    -- Find Notification Recipient (Org Owner or similar)
    SELECT user_id INTO owner_id
    FROM organization_members
    WHERE organization_id = NEW.organization_id
    LIMIT 1;

    IF owner_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (
            owner_id,
            '📄 Nuevo Documento',
            'Se ha subido un archivo al cliente ' || COALESCE(client_name, 'Desconocido'),
            'info',
            '/clients'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: New Document
DROP TRIGGER IF EXISTS on_document_created ON documents;
CREATE TRIGGER on_document_created
    AFTER INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_document();
