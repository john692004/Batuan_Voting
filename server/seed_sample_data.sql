-- =====================================================
-- Sample Data Seed — Batuan Voting System
-- Sections: Amethyst, Diamond, Garnet, ICT
-- =====================================================
USE batuan_voting;

-- ─── Sample Voters ──────────────────────────────────
-- Grade 7 - Amethyst
SET @v1 = UUID(); INSERT INTO users (id,lrn,password_hash,full_name,must_change_password) VALUES (@v1,'123456789001','$2a$10$qJuWvaZPekXNKtP8hr60SeYNgdeZVoze0/nRIQxgmWrglNH7ObvY.','Juan dela Cruz',0);
INSERT INTO profiles (id,user_id,full_name,grade_level,section) VALUES (UUID(),@v1,'Juan dela Cruz','Grade 7','Amethyst');
INSERT INTO user_roles (id,user_id,role) VALUES (UUID(),@v1,'voter');

SET @v2 = UUID(); INSERT INTO users (id,lrn,password_hash,full_name,must_change_password) VALUES (@v2,'123456789002','$2a$10$qJuWvaZPekXNKtP8hr60SeYNgdeZVoze0/nRIQxgmWrglNH7ObvY.','Maria Santos',0);
INSERT INTO profiles (id,user_id,full_name,grade_level,section) VALUES (UUID(),@v2,'Maria Santos','Grade 7','Amethyst');
INSERT INTO user_roles (id,user_id,role) VALUES (UUID(),@v2,'voter');

SET @v3 = UUID(); INSERT INTO users (id,lrn,password_hash,full_name,must_change_password) VALUES (@v3,'123456789003','$2a$10$qJuWvaZPekXNKtP8hr60SeYNgdeZVoze0/nRIQxgmWrglNH7ObvY.','Pedro Reyes',0);
INSERT INTO profiles (id,user_id,full_name,grade_level,section) VALUES (UUID(),@v3,'Pedro Reyes','Grade 7','Diamond');
INSERT INTO user_roles (id,user_id,role) VALUES (UUID(),@v3,'voter');

SET @v4 = UUID(); INSERT INTO users (id,lrn,password_hash,full_name,must_change_password) VALUES (@v4,'123456789004','$2a$10$qJuWvaZPekXNKtP8hr60SeYNgdeZVoze0/nRIQxgmWrglNH7ObvY.','Ana Garcia',0);
INSERT INTO profiles (id,user_id,full_name,grade_level,section) VALUES (UUID(),@v4,'Ana Garcia','Grade 7','Diamond');
INSERT INTO user_roles (id,user_id,role) VALUES (UUID(),@v4,'voter');

SET @v5 = UUID(); INSERT INTO users (id,lrn,password_hash,full_name,must_change_password) VALUES (@v5,'123456789005','$2a$10$qJuWvaZPekXNKtP8hr60SeYNgdeZVoze0/nRIQxgmWrglNH7ObvY.','Carlo Lim',0);
INSERT INTO profiles (id,user_id,full_name,grade_level,section) VALUES (UUID(),@v5,'Carlo Lim','Grade 8','Garnet');
INSERT INTO user_roles (id,user_id,role) VALUES (UUID(),@v5,'voter');

SET @v6 = UUID(); INSERT INTO users (id,lrn,password_hash,full_name,must_change_password) VALUES (@v6,'123456789006','$2a$10$qJuWvaZPekXNKtP8hr60SeYNgdeZVoze0/nRIQxgmWrglNH7ObvY.','Rosa Flores',0);
INSERT INTO profiles (id,user_id,full_name,grade_level,section) VALUES (UUID(),@v6,'Rosa Flores','Grade 8','Garnet');
INSERT INTO user_roles (id,user_id,role) VALUES (UUID(),@v6,'voter');

SET @v7 = UUID(); INSERT INTO users (id,lrn,password_hash,full_name,must_change_password) VALUES (@v7,'123456789007','$2a$10$qJuWvaZPekXNKtP8hr60SeYNgdeZVoze0/nRIQxgmWrglNH7ObvY.','Luis Torres',0);
INSERT INTO profiles (id,user_id,full_name,grade_level,section) VALUES (UUID(),@v7,'Luis Torres','Grade 9','ICT');
INSERT INTO user_roles (id,user_id,role) VALUES (UUID(),@v7,'voter');

SET @v8 = UUID(); INSERT INTO users (id,lrn,password_hash,full_name,must_change_password) VALUES (@v8,'123456789008','$2a$10$qJuWvaZPekXNKtP8hr60SeYNgdeZVoze0/nRIQxgmWrglNH7ObvY.','Claire Mendoza',0);
INSERT INTO profiles (id,user_id,full_name,grade_level,section) VALUES (UUID(),@v8,'Claire Mendoza','Grade 9','ICT');
INSERT INTO user_roles (id,user_id,role) VALUES (UUID(),@v8,'voter');

-- ─── SSLG Candidates ─────────────────────────────────
-- President
INSERT INTO candidates (id,name,position_id,grade_level,section,party_list,motto,election_type) VALUES
(UUID(),'Andrei Villanueva','14adfad8-33cf-11f1-9e79-567e76d2bb32','Grade 10','Amethyst','Bagong Pag-asa','Together we rise, united we thrive.','sslg'),
(UUID(),'Sofia Navarro','14adfad8-33cf-11f1-9e79-567e76d2bb32','Grade 11','Diamond','Pagbabago','A voice for every student, every day.','sslg');

-- Vice President
INSERT INTO candidates (id,name,position_id,grade_level,section,party_list,motto,election_type) VALUES
(UUID(),'Marco Dela Vega','14ae2c0c-33cf-11f1-9e79-567e76d2bb32','Grade 11','Garnet','Bagong Pag-asa','Service above self.','sslg'),
(UUID(),'Jasmine Reyes','14ae2c0c-33cf-11f1-9e79-567e76d2bb32','Grade 10','ICT','Kabataan','Lead with heart, serve with purpose.','sslg');

-- Secretary
INSERT INTO candidates (id,name,position_id,grade_level,section,party_list,motto,election_type) VALUES
(UUID(),'Nina Castillo','14ae2df0-33cf-11f1-9e79-567e76d2bb32','Grade 9','Amethyst','Pagbabago','Organized, dedicated, transparent.','sslg'),
(UUID(),'Carlo Buenaventura','14ae2df0-33cf-11f1-9e79-567e76d2bb32','Grade 10','Diamond','Bagong Pag-asa','Every word counts, every record matters.','sslg');

-- Treasurer
INSERT INTO candidates (id,name,position_id,grade_level,section,party_list,motto,election_type) VALUES
(UUID(),'Angela Cruz','14ae2e68-33cf-11f1-9e79-567e76d2bb32','Grade 11','ICT','Kabataan','Wise stewards of our shared resources.','sslg'),
(UUID(),'Renz Magalona','14ae2e68-33cf-11f1-9e79-567e76d2bb32','Grade 10','Garnet','Pagbabago','Integrity in every centavo.','sslg');

-- Auditor
INSERT INTO candidates (id,name,position_id,grade_level,section,party_list,motto,election_type) VALUES
(UUID(),'Bianca Tolentino','14ae2ec6-33cf-11f1-9e79-567e76d2bb32','Grade 12','Amethyst','Bagong Pag-asa','Truth and accountability always.','sslg'),
(UUID(),'Edison Lim','14ae2ec6-33cf-11f1-9e79-567e76d2bb32','Grade 11','Diamond','Kabataan','Numbers don''t lie — and neither do I.','sslg');

-- P.I.O.
INSERT INTO candidates (id,name,position_id,grade_level,section,party_list,motto,election_type) VALUES
(UUID(),'Kyla Soriano','14ae2f1f-33cf-11f1-9e79-567e76d2bb32','Grade 10','Garnet','Pagbabago','Connecting students through communication.','sslg'),
(UUID(),'James Evangelista','14ae2f1f-33cf-11f1-9e79-567e76d2bb32','Grade 11','ICT','Kabataan','Your news, your voice, your school.','sslg');

-- Peace Officer
INSERT INTO candidates (id,name,position_id,grade_level,section,party_list,motto,election_type) VALUES
(UUID(),'Vincent Padilla','14ae2f7e-33cf-11f1-9e79-567e76d2bb32','Grade 12','Diamond','Bagong Pag-asa','Peace starts with one step.','sslg'),
(UUID(),'Ella Domingo','14ae2f7e-33cf-11f1-9e79-567e76d2bb32','Grade 11','Amethyst','Pagbabago','A safer school for everyone.','sslg');

-- Grade 7 Representative
INSERT INTO candidates (id,name,position_id,grade_level,section,party_list,motto,election_type) VALUES
(UUID(),'Leo Bernardo','cc8e221c-33d9-11f1-9e79-567e76d2bb32','Grade 7','Amethyst','Kabataan','The future begins in Grade 7.','sslg'),
(UUID(),'Trisha Bautista','cc8e221c-33d9-11f1-9e79-567e76d2bb32','Grade 7','Diamond','Pagbabago','Small steps, big dreams.','sslg');

-- Grade 8 Representative
INSERT INTO candidates (id,name,position_id,grade_level,section,party_list,motto,election_type) VALUES
(UUID(),'Mark Salazar','cc8e30d5-33d9-11f1-9e79-567e76d2bb32','Grade 8','Garnet','Bagong Pag-asa','Rising stronger in Grade 8.','sslg'),
(UUID(),'Kaye Villafuerte','cc8e30d5-33d9-11f1-9e79-567e76d2bb32','Grade 8','ICT','Kabataan','For a brighter Grade 8.','sslg');

-- Grade 9 Representative
INSERT INTO candidates (id,name,position_id,grade_level,section,party_list,motto,election_type) VALUES
(UUID(),'Jared Aquino','cc8e3158-33d9-11f1-9e79-567e76d2bb32','Grade 9','Amethyst','Pagbabago','Grade 9: Stronger, Smarter, Together.','sslg'),
(UUID(),'Angie Quirino','cc8e3158-33d9-11f1-9e79-567e76d2bb32','Grade 9','Diamond','Bagong Pag-asa','Empowering every Grade 9 student.','sslg');

-- Grade 10 Representative
INSERT INTO candidates (id,name,position_id,grade_level,section,party_list,motto,election_type) VALUES
(UUID(),'Rico Manahan','cc8e3183-33d9-11f1-9e79-567e76d2bb32','Grade 10','Garnet','Kabataan','Grade 10: Leading the way.','sslg'),
(UUID(),'Ysabelle Castro','cc8e3183-33d9-11f1-9e79-567e76d2bb32','Grade 10','ICT','Pagbabago','A rep who truly represents.','sslg');

-- Grade 11 Representative
INSERT INTO candidates (id,name,position_id,grade_level,section,party_list,motto,election_type) VALUES
(UUID(),'Paolo Miranda','cc8e31a3-33d9-11f1-9e79-567e76d2bb32','Grade 11','Amethyst','Bagong Pag-asa','Senior high, senior values.','sslg'),
(UUID(),'Fatima Peralta','cc8e31a3-33d9-11f1-9e79-567e76d2bb32','Grade 11','Diamond','Kabataan','Grade 11 voices heard and respected.','sslg');

-- Grade 12 Representative
INSERT INTO candidates (id,name,position_id,grade_level,section,party_list,motto,election_type) VALUES
(UUID(),'Dominic Santiago','cc8e31c4-33d9-11f1-9e79-567e76d2bb32','Grade 12','Garnet','Pagbabago','Leaving a legacy for those behind us.','sslg'),
(UUID(),'Rhea Fernandez','cc8e31c4-33d9-11f1-9e79-567e76d2bb32','Grade 12','ICT','Bagong Pag-asa','The final year, the greatest impact.','sslg');

-- ─── Classroom Candidates — Amethyst ─────────────────
INSERT INTO candidates (id,name,position_id,grade_level,section,party_list,motto,election_type) VALUES
(UUID(),'Amara Dela Rosa','66c90e2b-a59a-4e6f-8db8-5f9d8d0f1284','Grade 7','Amethyst','','Lead with love and passion.','classroom'),
(UUID(),'Nico Villanueva','66c90e2b-a59a-4e6f-8db8-5f9d8d0f1284','Grade 7','Amethyst','','For Amethyst, with all my heart.','classroom'),
(UUID(),'Camille Estrada','3d7cbfbf-dacc-4e55-88d1-0d402142633e','Grade 7','Amethyst','','Supporting the mayor every step.','classroom'),
(UUID(),'Gio Santos','3d7cbfbf-dacc-4e55-88d1-0d402142633e','Grade 7','Amethyst','','A deputy who never quits.','classroom'),
(UUID(),'Lea Mendez','1910f407-8d25-4931-b652-1d869388b75e','Grade 7','Amethyst','','Every record, every word — accurate.','classroom'),
(UUID(),'Sam Reyes','1910f407-8d25-4931-b652-1d869388b75e','Grade 7','Amethyst','','Organized and always ready.','classroom'),
(UUID(),'Mia Torres','22a7907b-e231-4c85-8f4f-bf5dc4720006','Grade 7','Amethyst','','Every peso accounted for.','classroom'),
(UUID(),'Zach Luna','22a7907b-e231-4c85-8f4f-bf5dc4720006','Grade 7','Amethyst','','Transparent in every transaction.','classroom'),
(UUID(),'Bea Magno','23f9f67a-fd24-4277-8ad1-9fd1bc19ea30','Grade 7','Amethyst','','Keeping our class accountable.','classroom'),
(UUID(),'Romy Cruz','23f9f67a-fd24-4277-8ad1-9fd1bc19ea30','Grade 7','Amethyst','','Fair and accurate always.','classroom'),
(UUID(),'Lara Basco','d0b6463f-d629-4bcf-bf99-0305f23c2d29','Grade 7','Amethyst','','Your voice in every announcement.','classroom'),
(UUID(),'Ej Palma','d0b6463f-d629-4bcf-bf99-0305f23c2d29','Grade 7','Amethyst','','Spreading good news for Amethyst.','classroom'),
(UUID(),'Ken Ramos','c10cb838-7086-414f-8c40-707f8cef2224','Grade 7','Amethyst','','Peace starts in our classroom.','classroom'),
(UUID(),'Gab Flores','c10cb838-7086-414f-8c40-707f8cef2224','Grade 7','Amethyst','','Harmony in Amethyst, always.','classroom');

-- ─── Classroom Candidates — Diamond ──────────────────
INSERT INTO candidates (id,name,position_id,grade_level,section,party_list,motto,election_type) VALUES
(UUID(),'Hana Ocampo','601eee9b-9522-4840-a1e8-0d75c08168fd','Grade 8','Diamond','','Diamond deserves the best mayor.','classroom'),
(UUID(),'Rey Valdez','601eee9b-9522-4840-a1e8-0d75c08168fd','Grade 8','Diamond','','Leading Diamond to greatness.','classroom'),
(UUID(),'Vince Aquino','bbcf0e2c-3bcb-404a-9b82-067b6bd94e14','Grade 8','Diamond','','Side by side with our mayor.','classroom'),
(UUID(),'Gina Perez','bbcf0e2c-3bcb-404a-9b82-067b6bd94e14','Grade 8','Diamond','','Helping Diamond shine brighter.','classroom'),
(UUID(),'Mitch Rojas','ed0a3a94-23fa-4081-bc5d-d12e1f3f06e9','Grade 8','Diamond','','Words written with precision.','classroom'),
(UUID(),'Riva Cortez','ed0a3a94-23fa-4081-bc5d-d12e1f3f06e9','Grade 8','Diamond','','Keeping everything in order.','classroom'),
(UUID(),'Ace Delos Santos','1deff392-f5c1-4c93-87f3-0567c09ec959','Grade 8','Diamond','','Diamond funds, managed wisely.','classroom'),
(UUID(),'Yna Halili','1deff392-f5c1-4c93-87f3-0567c09ec959','Grade 8','Diamond','','A treasurer for all of Diamond.','classroom'),
(UUID(),'Hans Navarro','0695d71e-fb4f-41ab-822f-f457d59fd4d2','Grade 8','Diamond','','Every check, every balance.','classroom'),
(UUID(),'Iris Lozano','0695d71e-fb4f-41ab-822f-f457d59fd4d2','Grade 8','Diamond','','Accuracy is my commitment.','classroom'),
(UUID(),'Louie Tan','10f5c0db-8cb4-43cb-b84f-ec1fe43b68e2','Grade 8','Diamond','','Diamond''s news, on time always.','classroom'),
(UUID(),'Tisha Neri','10f5c0db-8cb4-43cb-b84f-ec1fe43b68e2','Grade 8','Diamond','','Inform, inspire, and connect.','classroom'),
(UUID(),'Bong dela Cruz','6722e88f-bc2a-4542-9cb9-3652968927c2','Grade 8','Diamond','','Safety and peace for Diamond.','classroom'),
(UUID(),'Ailyn Reyes','6722e88f-bc2a-4542-9cb9-3652968927c2','Grade 8','Diamond','','A peaceful Diamond is a strong Diamond.','classroom');

-- ─── Classroom Candidates — Garnet ───────────────────
INSERT INTO candidates (id,name,position_id,grade_level,section,party_list,motto,election_type) VALUES
(UUID(),'Zara Domingo','f105041a-3c2b-4588-93f7-f3916334035c','Grade 9','Garnet','','Garnet rises with leadership.','classroom'),
(UUID(),'Ian Castillo','f105041a-3c2b-4588-93f7-f3916334035c','Grade 9','Garnet','','Mayor for every Garnet student.','classroom'),
(UUID(),'Erica Bautista','ef4d6168-1248-4bfd-91c2-0e8735580b3e','Grade 9','Garnet','','Seconding every great idea.','classroom'),
(UUID(),'Noel Santillan','ef4d6168-1248-4bfd-91c2-0e8735580b3e','Grade 9','Garnet','','Garnet''s loyal deputy.','classroom'),
(UUID(),'Joy Macaraeg','53876cfb-3869-4826-88a2-265931530f98','Grade 9','Garnet','','Records kept with care.','classroom'),
(UUID(),'Anton Villarta','53876cfb-3869-4826-88a2-265931530f98','Grade 9','Garnet','','Committed to clear documentation.','classroom'),
(UUID(),'Danica Pascual','08e5e86f-fc5b-4d6d-ab06-329a1a5c94b8','Grade 9','Garnet','','Every fund, every purpose.','classroom'),
(UUID(),'Jose Hernandez','08e5e86f-fc5b-4d6d-ab06-329a1a5c94b8','Grade 9','Garnet','','Trustworthy hands for Garnet funds.','classroom'),
(UUID(),'Clara Manalo','76852c23-3553-4e95-b53d-8249fdd2bd6a','Grade 9','Garnet','','No number goes unchecked.','classroom'),
(UUID(),'Marc Bustamante','76852c23-3553-4e95-b53d-8249fdd2bd6a','Grade 9','Garnet','','Garnet accountability starts here.','classroom'),
(UUID(),'Pia Cabrera','d22cc04e-75eb-4279-a8e3-6487bf516df6','Grade 9','Garnet','','Spreading Garnet pride daily.','classroom'),
(UUID(),'Wil Soriano','d22cc04e-75eb-4279-a8e3-6487bf516df6','Grade 9','Garnet','','Keeping Garnet informed and inspired.','classroom'),
(UUID(),'Raf Aguilar','a8c4538a-a011-4677-bb3a-8b1f09db25b5','Grade 9','Garnet','','Peace within Garnet always.','classroom'),
(UUID(),'Luz Santos','a8c4538a-a011-4677-bb3a-8b1f09db25b5','Grade 9','Garnet','','A calm Garnet is a great Garnet.','classroom');

-- ─── Classroom Candidates — ICT ──────────────────────
INSERT INTO candidates (id,name,position_id,grade_level,section,party_list,motto,election_type) VALUES
(UUID(),'Neil Guerrero','9c1e5620-ab50-4982-b218-bd22bb3e8d9a','Grade 10','ICT','','Tech-driven leadership for ICT.','classroom'),
(UUID(),'Kat Enriquez','9c1e5620-ab50-4982-b218-bd22bb3e8d9a','Grade 10','ICT','','Coding a better ICT section.','classroom'),
(UUID(),'Dan Morales','22910d03-eeed-448e-9b2f-a53c7aaaf586','Grade 10','ICT','','Backing up every great idea.','classroom'),
(UUID(),'Leah Pascual','22910d03-eeed-448e-9b2f-a53c7aaaf586','Grade 10','ICT','','ICT''s right-hand executive.','classroom'),
(UUID(),'Richie Dela Torre','370a292d-2f29-423d-81cf-98d36845e798','Grade 10','ICT','','Data-precise, always efficient.','classroom'),
(UUID(),'Nina Alvarez','370a292d-2f29-423d-81cf-98d36845e798','Grade 10','ICT','','Documenting ICT''s journey.','classroom'),
(UUID(),'Migz Fajardo','009b1162-1872-4a20-8f39-1a95d0d78411','Grade 10','ICT','','Smart management for ICT funds.','classroom'),
(UUID(),'Ara De Leon','009b1162-1872-4a20-8f39-1a95d0d78411','Grade 10','ICT','','Every budget, wisely spent.','classroom'),
(UUID(),'Bryan Diaz','c9d1640b-1eb1-472e-8cc6-cceda288bd5e','Grade 10','ICT','','Verifying every ICT account.','classroom'),
(UUID(),'Cheska Ramos','c9d1640b-1eb1-472e-8cc6-cceda288bd5e','Grade 10','ICT','','No error goes unnoticed.','classroom'),
(UUID(),'Alvin Marquez','ae80b818-5af3-4b64-a3b7-0cf6e84cc40d','Grade 10','ICT','','ICT''s loudest and proudest voice.','classroom'),
(UUID(),'Dina Castillo','ae80b818-5af3-4b64-a3b7-0cf6e84cc40d','Grade 10','ICT','','Information at the speed of tech.','classroom'),
(UUID(),'Franz Reyes','ccb8a508-abc0-45c0-b120-329cd7b41466','Grade 10','ICT','','Order and respect in ICT.','classroom'),
(UUID(),'Gela Sta. Maria','ccb8a508-abc0-45c0-b120-329cd7b41466','Grade 10','ICT','','A peaceful and disciplined ICT.','classroom');
