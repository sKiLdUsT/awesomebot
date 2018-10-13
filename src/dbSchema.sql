CREATE TABLE IF NOT EXISTS guilds (id, modules, config TEXT);
CREATE TABLE IF NOT EXISTS modules (id, path TEXT);
CREATE TABLE IF NOT EXISTS permissions (memberId, guildId, scopes TEXT);
CREATE TABLE IF NOT EXISTS moduleConfig (guildId, moduleId, config TEXT);