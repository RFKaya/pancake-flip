-- Roller ve izinler (spatie/laravel-permission + Filament Shield düzeni). Veri-yalnız ve yinelenebilir.

INSERT OR IGNORE INTO roles (name, guard_name, created_at, updated_at) VALUES
    ('admin', 'web', strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    ('game_designer', 'web', strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    ('support', 'web', strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    ('content', 'web', strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    ('viewer', 'web', strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    ('player', 'web', strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), strftime('%Y-%m-%dT%H:%M:%SZ', 'now'));

WITH actions(action) AS (VALUES ('ViewAny'), ('View'), ('Create'), ('Update'), ('Delete'), ('DeleteAny')),
     resources(resource) AS (VALUES ('Malzeme'), ('MusteriTipi'), ('GameConfig'), ('ContentVersion'), ('Player'), ('Fis'), ('FraudFlag'), ('ContactMessage'), ('ContentPage'), ('AuditLog'), ('User'), ('Role'), ('Permission'))
INSERT OR IGNORE INTO permissions (name, guard_name, created_at, updated_at)
SELECT action || ':' || resource, 'web', strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM actions, resources;

INSERT OR IGNORE INTO permissions (name, guard_name, created_at, updated_at) VALUES
    ('Publish:ContentVersion', 'web', strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    ('SetLevel:Player', 'web', strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    ('Reveal:PII', 'web', strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), strftime('%Y-%m-%dT%H:%M:%SZ', 'now'));

-- game_designer
INSERT OR IGNORE INTO role_has_permissions (permission_id, role_id)
SELECT p.id, r.id FROM permissions p JOIN roles r ON r.name = 'game_designer' AND r.guard_name = 'web'
WHERE p.guard_name = 'web' AND p.name IN (
    'ViewAny:Malzeme', 'View:Malzeme', 'Create:Malzeme', 'Update:Malzeme',
    'Delete:Malzeme', 'DeleteAny:Malzeme', 'ViewAny:MusteriTipi', 'View:MusteriTipi',
    'Create:MusteriTipi', 'Update:MusteriTipi', 'Delete:MusteriTipi', 'DeleteAny:MusteriTipi',
    'ViewAny:GameConfig', 'View:GameConfig', 'Create:GameConfig', 'Update:GameConfig',
    'Delete:GameConfig', 'DeleteAny:GameConfig', 'ViewAny:ContentVersion', 'View:ContentVersion',
    'Create:ContentVersion', 'Update:ContentVersion', 'Delete:ContentVersion', 'DeleteAny:ContentVersion',
    'ViewAny:Player', 'View:Player', 'ViewAny:Fis', 'View:Fis'
);

-- support
INSERT OR IGNORE INTO role_has_permissions (permission_id, role_id)
SELECT p.id, r.id FROM permissions p JOIN roles r ON r.name = 'support' AND r.guard_name = 'web'
WHERE p.guard_name = 'web' AND p.name IN (
    'ViewAny:ContactMessage', 'View:ContactMessage', 'Create:ContactMessage', 'Update:ContactMessage',
    'Delete:ContactMessage', 'DeleteAny:ContactMessage', 'ViewAny:FraudFlag', 'View:FraudFlag',
    'Create:FraudFlag', 'Update:FraudFlag', 'Delete:FraudFlag', 'DeleteAny:FraudFlag',
    'ViewAny:Player', 'View:Player', 'ViewAny:Fis', 'View:Fis'
);

-- content
INSERT OR IGNORE INTO role_has_permissions (permission_id, role_id)
SELECT p.id, r.id FROM permissions p JOIN roles r ON r.name = 'content' AND r.guard_name = 'web'
WHERE p.guard_name = 'web' AND p.name IN (
    'ViewAny:ContentPage', 'View:ContentPage', 'Create:ContentPage', 'Update:ContentPage',
    'Delete:ContentPage', 'DeleteAny:ContentPage'
);

-- viewer
INSERT OR IGNORE INTO role_has_permissions (permission_id, role_id)
SELECT p.id, r.id FROM permissions p JOIN roles r ON r.name = 'viewer' AND r.guard_name = 'web'
WHERE p.guard_name = 'web' AND p.name IN (
    'ViewAny:Malzeme', 'View:Malzeme', 'ViewAny:MusteriTipi', 'View:MusteriTipi',
    'ViewAny:GameConfig', 'View:GameConfig', 'ViewAny:ContentVersion', 'View:ContentVersion',
    'ViewAny:Player', 'View:Player', 'ViewAny:Fis', 'View:Fis',
    'ViewAny:FraudFlag', 'View:FraudFlag', 'ViewAny:ContactMessage', 'View:ContactMessage',
    'ViewAny:ContentPage', 'View:ContentPage'
);
