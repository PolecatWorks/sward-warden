-- Add updated_at and is_deleted columns for delta sync support.
-- updated_at is automatically managed by a trigger on each table.

ALTER TABLE farms ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE farms ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE fields ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE fields ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE events ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE events ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE farm_records ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE farm_records ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- Generic trigger function to auto-update updated_at on row modification.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to each data table.
CREATE TRIGGER trg_farms_updated_at
    BEFORE UPDATE ON farms FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_fields_updated_at
    BEFORE UPDATE ON fields FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_events_updated_at
    BEFORE UPDATE ON events FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_farm_records_updated_at
    BEFORE UPDATE ON farm_records FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE soil_analyses ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE soil_analyses ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TRIGGER trg_soil_analyses_updated_at
    BEFORE UPDATE ON soil_analyses FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
