const express = require('express');
const path = require('path');
const sql = require('mssql');
const config2 = require('./Config/config2');
const config3 = require('./Config/config3');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());
app.get('/api/getCriticality', async (req, res) => {
    try {
        const pool = await config3;
        const request = pool.request();
        const result = await request.query('SELECT * FROM criticality');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send('Database query error');
    }
});



app.get('/api/getVertical', async (req, res) => {
    try {
        const pool = await config3;
        const request = pool.request();
        const result = await request.query('SELECT * FROM vertical_master');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send('Database query error');
    }
});

app.get('/api/getSubVerticals', async (req, res) => {
    try {
        const pool = await config3;
        const verticalId = req.query.verticalId;
        const request = pool.request();
        const result = await request.input('verticalId', sql.Int, verticalId).query('SELECT * FROM sub_vertical WHERE vertical_id = @verticalId');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching subVertical:', err);
        res.status(500).send('Database query error');
    }
});

app.get('/api/getReviewers', async (req, res) => {
    try {
     const pool = await config3;
     const verticalId = req.query.verticalId;
     const subVertical = decodeURIComponent(req.query.subVertical);
     console.log('subVertical:', subVertical);
 
     // First query to get the vertical
     const request1 = pool.request();
     const verticalResult = await request1
       .input('verticalId', sql.Int, verticalId)
       .query('SELECT vertical FROM vertical_master WHERE vertical_id = @verticalId');
 
     if (verticalResult.recordset.length === 0) {
       return res.status(404).send('Vertical not found');
     }
 
     const vertical = verticalResult.recordset[0].vertical;
     console.log('vertical:', vertical);
 
     // Second query to get the reviewers
     const request2 = pool.request();
     const query2 = 'SELECT * FROM user_master WHERE vertical = @vertical AND sub_vertical = @subVertical';
     const result2 = await request2
       .input('vertical', sql.VarChar, vertical)
       .input('subVertical', sql.VarChar, subVertical)
       .query(query2);
 
     res.json(result2.recordset);
    } catch (err) {
     console.error('Error fetching reviewers:', err);
     res.status(500).send('Error fetching reviewers');
    }
 });



app.post('/api/submitNote', async (req, res) => {
    try {
        const { subject, description, criticality, verticalId, subVertical, reviewer } = req.body;
        console.log(reviewer);

        const pool = await config3;

        // Get vertical and sub vertical prefixes
        const verticalRequest = pool.request();
        const verticalResult = await verticalRequest.input('verticalId', sql.Int, verticalId).query('SELECT * FROM vertical_master WHERE vertical_id = @verticalId');
        const vertical = verticalResult.recordset[0].vertical;
        const verticalPrefix = verticalResult.recordset[0].vertical_prefix; 
        

        const subVerticalRequest = pool.request();
        const subVerticalResult = await subVerticalRequest.input('verticalId', sql.Int, verticalId).input('subVertical', sql.VarChar, subVertical).query('SELECT * FROM sub_vertical WHERE vertical_id = @verticalId AND sub_vertical = @subVertical');
        const subVertical1 = subVerticalResult.recordset[0].sub_vertical;
        const subVerticalPrefix = subVerticalResult.recordset[0].prefix;
        const sequence = subVerticalResult.recordset[0].sequence;

        // Construct note_id
        const year = new Date().getFullYear().toString().slice(-2); // Get last two digits of the year
        const noteId = `${verticalPrefix}_${subVerticalPrefix}_${year}_${sequence}`;

        

        // Get reviewer email
        const reviewerRequest = pool.request();
        const reviewerResult = await reviewerRequest.input('reviewer', sql.VarChar, reviewer).query('SELECT emp_email FROM user_master WHERE emp_name = @reviewer');
        console.log(reviewerResult);
        const reviewerEmail = reviewerResult.recordset[0].emp_email;

        console.log(reviewerEmail);
        console.log(noteId)
        // Insert into note_master
        const pool1 = await config2;
        const insertRequest = pool1.request();
        await insertRequest
            .input('noteId', sql.VarChar, noteId)
            .input('subject', sql.VarChar, subject)
            .input('description', sql.VarChar, description)
            .input('criticality', sql.VarChar, criticality)
            .input('vertical', sql.VarChar, vertical)
            .input('subVertical', sql.VarChar, subVertical1)
            .input('reviewerName', sql.VarChar, reviewer)
            .input('reviewerEmail', sql.VarChar, reviewerEmail)
            
            .input('status', sql.VarChar, 'pending')
            .query('INSERT INTO note_master (note_id, subject, description, criticality, vertical, sub_vertical, reviewer_name, reviewer_email, status) VALUES (@noteId, @subject, @description, @criticality, @vertical, @subVertical, @reviewerName, @reviewerEmail, @status)');

        // Update sequence in sub_vertical
        const updateRequest = pool.request();
        await updateRequest.input('verticalId', sql.Int, verticalId).input('subVertical', sql.VarChar, subVertical).query('UPDATE sub_vertical SET sequence = sequence + 1 WHERE vertical_id = @verticalId AND sub_vertical = @subVertical');

        res.json({ message: 'Note submitted successfully' });
    } catch (err) {
        console.error('Error submitting note:', err);
        res.status(500).send('Error submitting note');
    }
});


app.listen(8000, () => {
    console.log("Note Server is running on port 8000");
});
