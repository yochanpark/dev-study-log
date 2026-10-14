-- 한글 이름이 ???로 깨지지 않도록 문자열은 NVARCHAR
CREATE TABLE MEMBERS (
    id   NVARCHAR(255) PRIMARY KEY,
    pw   NVARCHAR(MAX) NOT NULL,   -- "salt:hash" (scrypt)
    name NVARCHAR(MAX) NOT NULL
);

-- 직접 넣을 때는 N 접두사를 붙여야 유니코드로 저장된다
-- INSERT INTO MEMBERS (id, pw, name) VALUES (N'user01', N'<hash>', N'홍길동');
