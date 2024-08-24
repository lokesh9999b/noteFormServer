const sql = require('mssql');

const config3 = {
    user: "sa",
    password: "Lokesh@999",
    server: "MAA019179A\\SQLEXPRESS",
    database: "Note_Meta",
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

const poolPromise = new sql.ConnectionPool(config3)
    .connect()
    .then(pool => {
        console.log("Meta DB connected");
        return pool;
    })
    .catch(err => {
        console.error('Database connection failed: ', err);
        throw err;
    });

module.exports = poolPromise;
