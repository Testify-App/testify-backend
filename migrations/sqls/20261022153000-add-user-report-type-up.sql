ALTER TYPE report_entity_type ADD VALUE 'user';
ALTER TABLE reports ADD COLUMN context_conversation_id VARCHAR NULL;
