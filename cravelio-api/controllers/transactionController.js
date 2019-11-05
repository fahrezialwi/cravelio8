const db = require('../database')
const fs = require('fs')
const moment = require('moment')

module.exports = {
    getTransactions: (req, res) => {
        let sql = `SELECT * FROM transactions AS tr
        JOIN transactions_detail AS td ON tr.transaction_id = td.transaction_id`

        if (req.params.id) {
            sql += ` WHERE tr.transaction_id = ${req.params.id}`
        }
        if (req.query.status) {
            sql += ` WHERE tr.status = '${req.query.status}'`
        }
        if (req.query.year) {
            sql += ` WHERE year(tr.created_at) = ${req.query.year}`
        }
        if (req.query.user_id) {
            sql += ` WHERE tr.user_id = ${req.query.user_id}`
        }

        sql += ` ORDER BY tr.created_at DESC`

        db.query(sql, (err,result) => {
            if (err) throw err
            
            let data = []
            let iterator = 0

            for (let i = 0; i < result.length; i++) {
                if (i == 0) {
                    data.push({
                        transaction_id: result[0].transaction_id,
                        trip_id: result[0].trip_id,
                        trip_name: result[0].trip_name,
                        trip_price: result[0].trip_price,
                        start_date: result[0].start_date,
                        end_date: result[0].end_date,
                        user_id: result[0].user_id,
                        contact_first_name: result[0].contact_first_name,
                        contact_last_name: result[0].contact_last_name,
                        contact_phone_number: result[0].contact_phone_number,
                        contact_email: result[0].contact_email,
                        pax: result[0].pax,
                        participants: [{
                            title: result[0].title,
                            first_name: result[0].first_name,
                            last_name: result[0].last_name,
                            identification_type: result[0].identification_type,
                            identification_number: result[0].identification_number
                        }],
                        promo_code: result[0].promo_code,
                        promo_percentage: result[0].promo_percentage,
                        promo_value: result[0].promo_value,
                        total_payment: result[0].total_payment,
                        status: result[0].status,
                        transfer_bank_name: result[0].transfer_bank_name,
                        transfer_account_holder: result[0].transfer_account_holder,
                        transfer_proof: result[0].transfer_proof,
                        has_review: result[0].has_review,
                        created_at: result[0].created_at
                    })
                    iterator++
                    continue
                }

                if (result[i].transaction_id == result[i-1].transaction_id) {
                    data[iterator - 1].participants.push({
                        title: result[i].title,
                        first_name: result[i].first_name,
                        last_name: result[i].last_name,
                        identification_type: result[i].identification_type,
                        identification_number: result[i].identification_number
                    })
                } else {
                    data.push({
                        transaction_id: result[i].transaction_id,
                        trip_id: result[i].trip_id,
                        trip_name: result[i].trip_name,
                        trip_price: result[i].trip_price,
                        start_date: result[i].start_date,
                        end_date: result[i].end_date,
                        user_id: result[i].user_id,
                        contact_first_name: result[i].contact_first_name,
                        contact_last_name: result[i].contact_last_name,
                        contact_phone_number: result[i].contact_phone_number,
                        contact_email: result[i].contact_email,
                        pax: result[i].pax,
                        participants: [{
                            title: result[i].title,
                            first_name: result[i].first_name,
                            last_name: result[i].last_name,
                            identification_type: result[i].identification_type,
                            identification_number: result[i].identification_number
                        }],
                        promo_code: result[i].promo_code,
                        promo_percentage: result[i].promo_percentage,
                        promo_value: result[i].promo_value,
                        total_payment: result[i].total_payment,
                        status: result[i].status,
                        transfer_bank_name: result[i].transfer_bank_name,
                        transfer_account_holder: result[i].transfer_account_holder,
                        transfer_proof: result[i].transfer_proof,
                        has_review: result[i].has_review,
                        created_at: result[i].created_at
                    })
                    iterator++
                }
            }

            if (result.length > 0) {          
                res.send({
                    status: 200,
                    results: data
                })
            } else {
                res.send({
                    status: 404,
                    message: 'Data not found',
                    results: result
                })
            }
        })
    },

    createTransaction: (req, res) => {
        db.query(
            `INSERT INTO transactions (trip_id, trip_name, trip_price, start_date, end_date,
            user_id, contact_first_name, contact_last_name, contact_phone_number, contact_email,
            pax, promo_code, promo_percentage, promo_value, total_payment, status, has_review, created_at)
            VALUES (${req.body.trip_id}, '${req.body.trip_name}', ${req.body.trip_price},'${req.body.start_date}', '${req.body.end_date}',
            ${req.body.user_id}, '${req.body.contact_first_name}', '${req.body.contact_last_name}',
            '${req.body.contact_phone_number}', '${req.body.contact_email}', ${req.body.pax},
            '${req.body.promo_code}', ${req.body.promo_percentage}, ${req.body.promo_value}, ${req.body.total_payment},
            '${req.body.status}', 0, '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS')}')`, (err, result) => {
            
            if (err) throw err
            res.send({
                status: 201,
                message: 'Create transaction success',
                results: result
            })
            
            for (let i = 1; i <= req.body.pax ; i++) {
                db.query(
                    `INSERT INTO transactions_detail (transaction_id, title, first_name, last_name, identification_type, identification_number)
                    VALUES (${result.insertId}, '${req.body.participants["title"+i]}', '${req.body.participants["firstName"+i]}',
                    '${req.body.participants["lastName"+i]}', '${req.body.participants["idType"+i]}', ${req.body.participants["idNumber"+i]})`
                )
            }
        })
    },

    addTransferProof: (req, res) => {
        try {
            if (req.validation) throw req.validation
            if (req.file.size > 5000000) throw {error: true, message: 'Image size too large'}

            let data = JSON.parse(req.body.data)

            db.query(
                `UPDATE transactions SET transfer_bank_name = '${data.transfer_bank_name}', transfer_account_holder = '${data.transfer_account_holder}',
                transfer_proof = '${req.file.filename}' WHERE transaction_id = ${req.params.id}`, (err, result) => {

                try {
                    if (err) throw err
                    res.send({
                        status: 201,
                        message: 'Add proof success',
                        results: result
                    })
                } catch (error) {
                    // delete file when query/database error
                    fs.unlinkSync(req.file.path)
                    console.log(error)                
                }
            })
        } catch (error) {
            // delete file if file size more than 5MB
            fs.unlinkSync(req.file.path)
            console.log(error)
        }
    }
}