-- Seed data for development

-- Insert sample rooms
INSERT INTO rooms (nombre, descripcion, capacidad) VALUES
('Cubículo 1', 'Cubículo individual con escritorio y silla', 1),
('Cubículo 2', 'Cubículo individual con escritorio y silla', 1),
('Cubículo 3', 'Cubículo individual con escritorio y silla', 1),
('Sala de Estudio A', 'Sala para 4 personas con mesa grande', 4),
('Sala de Estudio B', 'Sala para 6 personas con mesa grande', 6);

-- Insert sample whitelist entries
INSERT INTO whitelist_matriculas (matricula, nombre, activo) VALUES
('2024001234', 'Juan Pérez García', true),
('2024001235', 'María López Rodríguez', true),
('2024001236', 'Carlos Martínez Sánchez', true),
('2024001237', 'Ana González Fernández', true),
('2024001238', 'Luis Hernández Torres', true);

-- Insert sample blackouts
INSERT INTO blackouts (titulo, descripcion, inicio, fin, activo) VALUES
('Mantenimiento General', 'Mantenimiento programado de la biblioteca', 
 '2024-12-25 00:00:00+00', '2024-12-25 23:59:59+00', true),
('Día de Navidad', 'Biblioteca cerrada por festividad', 
 '2024-12-24 00:00:00+00', '2024-12-24 23:59:59+00', true);

-- Insert sample admin user (for development)
INSERT INTO users (id, email, matricula, verified, role) VALUES
('00000000-0000-0000-0000-000000000000', 'admin@biblioteca.edu', 'ADMIN001', true, 'admin')
ON CONFLICT (id) DO NOTHING;
