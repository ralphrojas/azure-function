const { sql, poolPromise } = require('../config/database');

module.exports = async function (context, req) {
    const method = req.method;
    const pool = await poolPromise;

    try {
        switch (method) {
            case 'GET':
                if (req.params.id) {
                    // Get single task
                    const result = await pool.request()
                        .input('id', sql.Int, req.params.id)
                        .query('SELECT * FROM Tasks WHERE id = @id');
                    context.res = {
                        body: result.recordset[0]
                    };
                } else {
                    // Get all tasks
                    const result = await pool.request()
                        .query('SELECT * FROM Tasks');
                    context.res = {
                        body: result.recordset
                    };
                }
                break;

            case 'POST':
                // Create task
                const { title, description, status } = req.body;
                const insertResult = await pool.request()
                    .input('title', sql.NVarChar, title)
                    .input('description', sql.NVarChar, description)
                    .input('status', sql.NVarChar, status)
                    .query('INSERT INTO Tasks (title, description, status) VALUES (@title, @description, @status); SELECT SCOPE_IDENTITY() AS id;');
                context.res = {
                    status: 201,
                    body: { id: insertResult.recordset[0].id, title, description, status }
                };
                break;

            case 'PUT':
                // Update task
                const taskToUpdate = req.body;
                await pool.request()
                    .input('id', sql.Int, req.params.id)
                    .input('title', sql.NVarChar, taskToUpdate.title)
                    .input('description', sql.NVarChar, taskToUpdate.description)
                    .input('status', sql.NVarChar, taskToUpdate.status)
                    .query('UPDATE Tasks SET title = @title, description = @description, status = @status WHERE id = @id');
                context.res = {
                    status: 200,
                    body: { ...taskToUpdate, id: req.params.id }
                };
                break;

            case 'DELETE':
                // Delete task
                await pool.request()
                    .input('id', sql.Int, req.params.id)
                    .query('DELETE FROM Tasks WHERE id = @id');
                context.res = {
                    status: 204
                };
                break;

            default:
                context.res = {
                    status: 405,
                    body: "Method not allowed"
                };
        }
    } catch (error) {
        context.log.error('Error:', error);
        context.res = {
            status: 500,
            body: "An error occurred while processing your request."
        };
    }
}; 