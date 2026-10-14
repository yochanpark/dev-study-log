// MSSQL 접근은 여기에만 둔다. 모든 값은 request.input()으로 바인딩한다(문자열 조합 금지).
// 한글이 ???로 깨지지 않도록 문자열은 NVarChar로 넘긴다.
const sql = require('mssql');

function createMemberRepository(config) {
    const poolPromise = new sql.ConnectionPool(config).connect();
    const request = async () => (await poolPromise).request();

    return {
        async findById(id) {
            const result = await (await request())
                .input('id', sql.NVarChar, id)
                .query('SELECT id, pw, name FROM MEMBERS WHERE id = @id');
            return result.recordset[0] ?? null;
        },

        async page(page, pageSize) {
            const list = await (await request())
                .input('offset', sql.Int, (page - 1) * pageSize)
                .input('pageSize', sql.Int, pageSize)
                .query('SELECT id, name FROM MEMBERS ORDER BY id OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY');
            const count = await (await request()).query('SELECT COUNT(*) AS totalCount FROM MEMBERS');
            return { rows: list.recordset, totalCount: count.recordset[0].totalCount };
        },

        async insert({ id, pw, name }) {
            await (await request())
                .input('id', sql.NVarChar, id)
                .input('pw', sql.NVarChar, pw)
                .input('name', sql.NVarChar, name)
                .query('INSERT INTO MEMBERS (id, pw, name) VALUES (@id, @pw, @name)');
        },

        async update({ id, pw, name }) {
            await (await request())
                .input('id', sql.NVarChar, id)
                .input('pw', sql.NVarChar, pw)
                .input('name', sql.NVarChar, name)
                .query('UPDATE MEMBERS SET name = @name, pw = @pw WHERE id = @id');
        },

        async remove(id) {
            await (await request())
                .input('id', sql.NVarChar, id)
                .query('DELETE FROM MEMBERS WHERE id = @id');
        },
    };
}

module.exports = { createMemberRepository };
