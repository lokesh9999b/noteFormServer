const sql = require('mssql');

    const config2 = {
        user: "sa",
        password: "Lokesh@999",
        server: "MAA019179A\\SQLEXPRESS",
        database: "Note_Main",
        options: {
            encrypt: true,
            trustServerCertificate: true
        }
    };
    
    const poolPromise = new sql.ConnectionPool(config2)
        .connect()
        .then(pool => {
            console.log("Main DB is connected");
            return pool;
        })
        .catch(err => {
            console.error('Database connection failed: ', err);
            throw err;
        });
    
    module.exports = poolPromise;
