CREATE TABLE IF NOT EXISTS soil_analyses (
    id BIGSERIAL PRIMARY KEY,
    field_id BIGINT NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    sample_date VARCHAR(255) NOT NULL,
    ph_level DOUBLE PRECISION,
    phosphorus_index INTEGER,
    potassium_index INTEGER,
    magnesium_index INTEGER
);
